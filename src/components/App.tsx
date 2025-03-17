import { default as cls } from "classnames";
import Head from "next/head";
import Script from "next/script";
import { Demo } from "@/components/Demo";
import { Blog } from "@/components/Blog";

import { Open_Sans, Barrio } from "next/font/google";
import styles from "@/styles/Home.module.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const barrio = Barrio({
  variable: "--font-barrio",
  subsets: ["latin"],
  weight: "400",
});

interface AppProps {
  showBlog?: boolean;
}

const App = ({ showBlog }: AppProps) => {
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
        <link rel="icon" href="favicon.png" />
      </Head>
      <Script
        src="https://www.maxhuang.dev/src/scripts/theme.js"
        onLoad={handleInitTheme}
      />
      <div
        className={cls(styles.container, openSans.variable, barrio.variable)}
      >
        <Demo showLearnMoreButton={showBlog} />
        {showBlog && <Blog />}
      </div>
    </>
  );
};

export { App };
