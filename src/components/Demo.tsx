import { default as cls } from "classnames";
import { useState } from "react";
import { Recorder } from "@/components/Recorder";

import styles from "@/styles/Demo.module.css";

interface DemoProps {
  showLearnMoreButton?: boolean;
}

const Demo = ({ showLearnMoreButton }: DemoProps) => {
  const [downloadURL, setDownloadURL] = useState<string | undefined>(undefined);
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        {/* Image source: https://www.pinclipart.com/downpngs/iomoxw_super-mario-clipart-piranha-plant-mario-piranha-plant/ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero.png" alt="Logo" />
        <h1>Piranha Plants as Charade</h1>
      </div>
      <div className={styles.recorderWrapper}>
        <Recorder
          bufferSize={Math.pow(2, 15)}
          downloadURL={downloadURL}
          setDownloadURL={setDownloadURL}
        />
        {downloadURL && (
          <a
            className={cls("icon", styles.downloadLink)}
            href={downloadURL}
            download="output.webm"
          >
            Download
          </a>
        )}
      </div>
      <div style={{ flexGrow: 1 }}></div>
      {showLearnMoreButton && (
        <a className={styles.learnMoreButton} href="#details">
          Learn more
        </a>
      )}
      <ul id="details" className={cls("link-section", styles.links)}>
        <li>
          <a
            className={cls("icon", styles.report)}
            href="//example.com"
            target="_blank"
          >
            Project report
          </a>
        </li>
        <li>
          <a
            className={cls("icon", styles.github)}
            href="//github.com/max-y-huang/piranha-plants-as-charade"
            target="_blank"
          >
            GitHub
          </a>
        </li>
      </ul>
    </div>
  );
};

export { Demo };
