import { default as cls } from "classnames";
import { useState, useRef, useEffect } from "react";
import styles from "@/styles/AudioPlayer.module.css";

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer = ({ src }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const timelineRef = useRef<HTMLSpanElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);

  const toDisplayTime = (time: number) => {
    if (Number.isNaN(time)) {
      return "--";
    }
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time) % 60;
    return `${mins.toString()}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => {
    setPlaying(true);
  };
  const handlePause = () => {
    setPlaying(false);
  };
  const handleEnd = () => {
    audioRef.current!.pause();
    audioRef.current!.currentTime = 0;
  };
  const handleTimeUpdate = () => {
    const time = audioRef.current!.currentTime;
    const duration = audioRef.current!.duration;
    timeRef.current!.innerHTML =
      toDisplayTime(time) + " / " + toDisplayTime(duration);
    timelineRef.current!.style.width =
      ((time / duration) * 100).toString() + "%";
    timelineRef.current!.style.visibility = time === 0 ? "hidden" : "visible";
  };

  const handleButtonClick = () => {
    if (playing) {
      audioRef.current!.pause();
    } else {
      audioRef.current!.play();
    }
  };

  useEffect(() => {
    handleTimeUpdate();
  }, [audioRef]);

  return (
    <>
      <button
        className={cls(styles.button, playing ? styles.playing : null)}
        onClick={handleButtonClick}
      >
        <span ref={timeRef} className={styles.time}></span>
        <span ref={timelineRef} className={styles.timeline} />
      </button>
      <audio
        ref={audioRef}
        src={src}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnd}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleTimeUpdate}
      />
    </>
  );
};

export { AudioPlayer };
