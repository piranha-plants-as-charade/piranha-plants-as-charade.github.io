import { default as cls } from "classnames";
import { ImgHTMLAttributes } from "react";

import styles from "@/styles/Logo.module.css";

const Logo = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <div {...props} className={cls(styles.container, props.className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="//cdn.jsdelivr.net/gh/piranha-plants-as-charade/.github/branding/logo-light.svg"
        alt="Logo"
        className={styles.darkLogo}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="//cdn.jsdelivr.net/gh/piranha-plants-as-charade/.github/branding/logo-color.svg"
        alt="Logo"
        className={styles.lightLogo}
      />
    </div>
  );
};

export { Logo };
