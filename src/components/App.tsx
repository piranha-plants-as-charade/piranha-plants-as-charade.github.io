import { default as cls } from "classnames";
import { ReactNode } from "react";
import Head from "next/head";

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
  children?: ReactNode;
}

const App = (props: AppProps) => {
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
      <div
        className={cls(styles.container, openSans.variable, barrio.variable)}
      >
        {props.children}
      </div>
    </>
  );
};

export { App };
