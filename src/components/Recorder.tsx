import { default as cls } from "classnames";
import { useRef, useEffect, useState, useReducer } from "react";
import styles from "@/styles/Recorder.module.css";

enum State {
  Loading = "loading",
  ReadyToRecord = "readyToRecord",
  Recording = "recording",
  Generating = "generating",
  Paused = "paused",
  Playing = "playing",
  Error = "error",
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
  const stateRef = useRef<State>(State.Loading);
  const [state, setState] = useReducer((prev, val: State) => {
    stateRef.current = val;
    return val;
  }, State.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const computedStyle = getComputedStyle(containerRef.current);
    return computedStyle.getPropertyValue("--button-color");
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

      if (stateRef.current !== State.Recording) {
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
      setState(State.Recording);
    };

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      setState(State.Generating);

      const file = createFileFromChunks(recordedChunks.current, "file.webm", {
        type: recorder.mimeType,
      });
      const url = window.URL.createObjectURL(
        new Blob([await fetchGenerate(file)], { type: "audio/wav" })
      );
      setDownloadURL(url);

      setState(State.Paused);
    };
    return recorder;
  };

  const handleButtonClick = () => {
    switch (state) {
      case State.ReadyToRecord:
        mediaRecorder.current!.start();
        break;
      case State.Recording:
        mediaRecorder.current!.stop();
        break;
      case State.Paused:
        audioRef.current!.play();
        break;
      case State.Playing:
        audioRef.current!.pause();
        break;
      default:
        break;
    }
  };

  const handleAudioPlay = () => {
    setState(State.Playing);
  };
  const handleAudioPause = () => {
    setState(State.Paused);
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
      try {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        visualizeAudioStream();
        mediaRecorder.current = await createMediaRecorder();
        setState(State.ReadyToRecord);
      } catch {
        setErrorMessage("Failed to initialize the recording process.");
        setState(State.Error);
      }
    }, 0);
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      data-state={state.valueOf()}
    >
      {state !== State.Error && (
        <button
          className={cls("icon", styles.recordButton)}
          onClick={handleButtonClick}
          disabled={state === State.Loading || state === State.Generating}
        />
      )}
      {state === State.Error && (
        <span className={cls("icon", styles.errorMessage)}>{errorMessage}</span>
      )}
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
