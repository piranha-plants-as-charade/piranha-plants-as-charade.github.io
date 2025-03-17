import { default as cls } from "classnames";
import { useRef, useEffect, useState, useReducer, ReactNode } from "react";
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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BE_BASE_URL!}/generate`,
    {
      headers: {
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_BE_AUTH_TOKEN!, // FIXME: secure this?
        "Access-Control-Allow-Origin": "*",
      },
      method: "POST",
      body: formData,
    }
  );
  if (response.status !== 200) {
    throw new Error("Failed to generate accompaniment.");
  }
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
  const [errorMessage, setErrorMessage] = useState<ReactNode>(<></>);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const generate = async (getFileFn: () => File) => {
    setState(State.Generating);
    try {
      const file = getFileFn();
      const generated = await fetchGenerate(file);
      const url = window.URL.createObjectURL(
        new Blob([generated], { type: "audio/wav" })
      );
      setDownloadURL(url);
      setState(State.Paused);
    } catch {
      setErrorMessage(
        <span>
          Something went wrong.{" "}
          <button
            className="ghost-button"
            onClick={() => {
              setState(State.ReadyToRecord);
            }}
          >
            Try again?
          </button>
        </span>
      );
      setState(State.Error);
    }
  };

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
      const { width, height } = visualizerRef.current!;

      canvasCtx.clearRect(0, 0, width, height);

      if (stateRef.current !== State.Recording) {
        return;
      }

      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.lineWidth = 2;
      canvasCtx.lineJoin = "round";
      canvasCtx.strokeStyle = getLineColor();

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
      generate(() => {
        return createFileFromChunks(recordedChunks.current, "file.webm", {
          type: mediaRecorder.current!.mimeType,
        });
      });
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

  useEffect(() => {
    if (state == State.Recording) {
      visualizeAudioStream();
    }
  }, [state]);

  useEffect(() => {
    const resizeVisualizer = () => {
      visualizerRef.current!.width = mainRef.current!.offsetWidth;
      visualizerRef.current!.height = mainRef.current!.offsetHeight;
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
        mediaRecorder.current = await createMediaRecorder();
        setState(State.ReadyToRecord);
      } catch {
        setErrorMessage(
          <>
            Failed to initialize the recording process.{" "}
            <button
              className="ghost-button"
              onClick={() => {
                inputFileRef.current!.click();
              }}
            >
              Upload a file instead?
            </button>
          </>
        );
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
      <div ref={mainRef} className={styles.main}>
        {state !== State.Error && (
          <button
            className={styles.recordButton}
            onClick={handleButtonClick}
            disabled={state === State.Loading || state === State.Generating}
          >
            <span className={styles.text} />
          </button>
        )}
        {state === State.Error && (
          <span className={cls("icon", styles.errorMessage)}>
            {errorMessage}
          </span>
        )}
        <canvas ref={visualizerRef} className={styles.visualizer} />
      </div>
      {state === State.ReadyToRecord && (
        <button
          className={cls("icon", "ghost-button", styles.uploadFileButton)}
          onClick={() => {
            inputFileRef.current!.click();
          }}
        >
          Or upload a file
        </button>
      )}
      <input
        ref={inputFileRef}
        type="file"
        accept="audio/*"
        required={true}
        multiple={false}
        style={{ display: "none" }}
        onChange={(event) => {
          generate(() => {
            return event.target.files![0];
          });
        }}
      />
      <audio
        ref={audioRef}
        src={downloadURL}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
      />
    </div>
  );
};

export { Recorder };
