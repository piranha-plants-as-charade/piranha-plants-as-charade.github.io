import { default as cls } from "classnames";
import Head from "next/head";
import Script from "next/script";

import { Open_Sans, Barrio } from "next/font/google";
import { Recorder } from "@/components/Recorder";
import styles from "@/styles/Home.module.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const barrio = Barrio({
  variable: "--font-barrio",
  subsets: ["latin"],
  weight: "400",
});

const Home = () => {
  const handleInitTheme = async () => {
    eval("initTheme()");
  };

  return (
    <>
      <Head>
        <title>Piranha Plants as Charade</title>
        <meta
          name="description"
          content='Music generation in the style of "Piranha Plants on Parade".'
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script
        src="https://www.maxhuang.dev/src/scripts/theme.js"
        onLoad={handleInitTheme}
      />
      <div className={cls(styles.page, openSans.variable, barrio.variable)}>
        <main className={styles.main}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.logo}
            src="/hero.webp"
            alt="Logo"
            width={256 * (1036 / 884)}
            height={256}
          />
          <h1 className={styles.title}>Piranha Plants as Charade</h1>
          <Recorder bufferSize={Math.pow(2, 15)} />
        </main>
        <footer className={styles.footer}>
          <ul className={styles.links}>
            <li>
              <a href="https://example.com" target="_blank">
                Project Report
              </a>
            </li>
            <li>
              <a
                href="https://github.com/max-y-huang/piranha-plants-as-charade"
                target="_blank"
              >
                GitHub
              </a>
            </li>
          </ul>
        </footer>
      </div>
    </>
  );
};

export default Home;
