import { default as cls } from "classnames";
import { useState } from "react";
import { Recorder } from "@/components/Recorder";
import { Logo } from "@/components/Logo";

import styles from "@/styles/Demo.module.css";


const Demo = () => {
  const [downloadURL, setDownloadURL] = useState<string | undefined>(undefined);
  return (
    <div className={styles.container}>
      <Logo className={styles.logo} />
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
      <ul className={cls("link-section", styles.links)}>
        <li>
          <a
            className={cls("icon", styles.report)}
            href="//github.com/piranha-plants-as-charade/report/releases/v0.1.0/report.pdf"
            download={false}
            target="_blank"
          >
            Project report
          </a>
        </li>
        <li>
          <a
            className={cls("icon", styles.github)}
            href="//github.com/piranha-plants-as-charade"
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
