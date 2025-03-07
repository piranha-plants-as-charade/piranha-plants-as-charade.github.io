import { useRef, useEffect, useReducer } from "react";
import styles from "@/styles/Recorder.module.css";

enum RecordingState {
  Loading = "loading",
  ReadyToRecord = "readyToRecord",
  Recording = "recording",
  Generating = "generating",
  ReadyToPlay = "readyToPlay",
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
}

const Recorder = ({ bufferSize }: RecorderProps) => {
  const recordingStateRef = useRef<RecordingState>(RecordingState.Loading);
  const [recordingState, setRecordingState] = useReducer((prev, action) => {
    recordingStateRef.current = action;
    return action;
  }, RecordingState.Loading);

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
    return getComputedStyle(containerRef.current).getPropertyValue("--medium");
  }

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
        new Blob([await fetchGenerate(file)], { type: "audio/webm" })
      );
      audioRef.current!.src = url;

      setRecordingState(RecordingState.ReadyToPlay);

      recordedChunks.current = [];
    };
    return recorder;
  };

  const onClick = () => {
    switch (recordingState) {
      case RecordingState.ReadyToRecord:
        mediaRecorder.current!.start();
        break;
      case RecordingState.Recording:
        mediaRecorder.current!.stop();
        break;
      case RecordingState.ReadyToPlay:
        open(audioRef.current!.src, "_blank");
        break;
      default:
        break;
    }
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
        className={styles.recordButton}
        onClick={onClick}
        disabled={
          recordingState === RecordingState.Loading ||
          recordingState === RecordingState.Generating
        }
      />
      <canvas ref={visualizerRef} className={styles.visualizer} />
      <audio ref={audioRef} />
    </div>
  );
};

export { Recorder };
