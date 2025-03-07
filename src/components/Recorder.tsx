import { default as cls } from "classnames";
import { useRef, useEffect, useReducer } from "react";
import styles from "@/styles/Recorder.module.css";

enum RecordingState {
  Loading = "loading",
  ReadyToRecord = "readyToRecord",
  Recording = "recording",
  Generating = "generating",
  Paused = "paused",
  Playing = "playing",
}

const createFileFromChunks = (
  chunks: Blob[],
  fileName: string,
  options: BlobPropertyBag
): File => {
  const blob = new Blob(chunks, options);
  return new File([blob], fileName);
};

const fetchGenerate = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8000/generate", {
    method: "POST",
    body: formData,
  });
  return await response.bytes();
};

interface RecorderProps {
  bufferSize: number;
  downloadURL: string | undefined;
  setDownloadURL: (url: string | undefined) => void;
}

const Recorder = ({
  bufferSize,
  downloadURL,
  setDownloadURL,
}: RecorderProps) => {
  const recordingStateRef = useRef<RecordingState>(RecordingState.Loading);
  const [recordingState, setRecordingState] = useReducer(
    (prev, val: RecordingState) => {
      recordingStateRef.current = val;
      return val;
    },
    RecordingState.Loading
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const getLineColor = () => {
    if (!containerRef.current) {
      return "black";
    }
    return getComputedStyle(containerRef.current).getPropertyValue(
      "--button-color"
    );
  };

  const visualizeAudioStream = () => {
    const canvasCtx = visualizerRef.current!.getContext("2d")!;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(audioStream.current!);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = bufferSize;
    const dataArray = new Uint8Array(bufferSize);

    source.connect(analyser);

    const draw = () => {
      requestAnimationFrame(draw);

      const { width, height } = visualizerRef.current!;

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, width, height);

      canvasCtx.lineWidth = 2;
      canvasCtx.lineJoin = "round";
      canvasCtx.strokeStyle = getLineColor();

      if (recordingStateRef.current !== RecordingState.Recording) {
        return;
      }

      canvasCtx.beginPath();

      const paddingX = 0;
      const paddingY = 2;
      const sliceWidth = (width - 2 * paddingX) / bufferSize;

      for (let i = 0; i < bufferSize; i++) {
        const v = dataArray[i] / 128.0 - 1; // map between -1 and 1
        const x = paddingX + i * sliceWidth;
        const y = -v * (height / 2 - paddingY) + height / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
      }

      canvasCtx.lineTo(width - paddingX, height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const createMediaRecorder = async (): Promise<MediaRecorder> => {
    const recorder = new MediaRecorder(audioStream.current!, {
      mimeType: "audio/webm",
    });
    recordedChunks.current = [];

    recorder.onstart = () => {
      setRecordingState(RecordingState.Recording);
    };

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      setRecordingState(RecordingState.Generating);

      const file = createFileFromChunks(recordedChunks.current, "file.webm", {
        type: recorder.mimeType,
      });
      const url = window.URL.createObjectURL(
        new Blob([await fetchGenerate(file)], { type: "audio/wav" })
      );
      setDownloadURL(url);

      setRecordingState(RecordingState.Paused);
    };
    return recorder;
  };

  const handleButtonClick = () => {
    switch (recordingState) {
      case RecordingState.ReadyToRecord:
        mediaRecorder.current!.start();
        break;
      case RecordingState.Recording:
        mediaRecorder.current!.stop();
        break;
      case RecordingState.Paused:
        audioRef.current!.play();
        break;
      case RecordingState.Playing:
        audioRef.current!.pause();
        break;
      default:
        break;
    }
  };

  const handleAudioPlay = () => {
    setRecordingState(RecordingState.Playing);
  };
  const handleAudioPause = () => {
    setRecordingState(RecordingState.Paused);
  };
  const handleAudioEnd = () => {
    audioRef.current!.pause();
    audioRef.current!.currentTime = 0;
  };

  useEffect(() => {
    const resizeVisualizer = () => {
      visualizerRef.current!.width = containerRef.current!.offsetWidth;
      visualizerRef.current!.height = containerRef.current!.offsetHeight;
    };
    window.onresize = resizeVisualizer;
    resizeVisualizer();
  }, []);

  useEffect(() => {
    setTimeout(async () => {
      audioStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      visualizeAudioStream();
      mediaRecorder.current = await createMediaRecorder();
      setRecordingState(RecordingState.ReadyToRecord);
    }, 0);
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      data-state={recordingState.valueOf()}
    >
      <button
        className={cls("icon", styles.recordButton)}
        onClick={handleButtonClick}
        disabled={
          recordingState === RecordingState.Loading ||
          recordingState === RecordingState.Generating
        }
      />
      <canvas ref={visualizerRef} className={styles.visualizer} />
      <audio
        ref={audioRef}
        src={downloadURL}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={handleAudioEnd}
      />
    </div>
  );
};

export { Recorder };
