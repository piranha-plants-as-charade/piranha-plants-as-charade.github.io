import { default as cls } from "classnames";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Logo } from "@/components/Logo";

import styles from "@/styles/Blog.module.css";

interface SampleRowProps {
  url: string;
  title: string;
  directory: string;
}

const SampleRow = (props: SampleRowProps) => {
  return (
    <tr>
      <td>
        <a href={props.url} target="_blank">
          {props.title}
        </a>
      </td>
      <td>
        <AudioPlayer
          src={`//cdn.jsdelivr.net/gh/piranha-plants-as-charade/results/${props.directory}/input.wav`}
        />
      </td>
      <td>
        <AudioPlayer
          src={`//cdn.jsdelivr.net/gh/piranha-plants-as-charade/results/${props.directory}/output.wav`}
        />
      </td>
    </tr>
  );
};

const Blog = () => {
  return (
    <>
      <header className={styles.header}>
        <Logo className={styles.logo} />
      </header>
      <div className={styles.container}>
        <h2>Behind Piranha Plants on Charade</h2>
        <h3>Summary</h3>
        <p>
          The premise of Piranha Plants as Charade is to transform a melody into
          a full-fledged song in the style of{" "}
          <a href="//www.youtube.com/watch?v=3EkzTUPoWMU" target="_blank">
            &ldquo;Piranha Plants on Parade&rdquo;
          </a>{" "}
          from the video game <em>Super Mario Bros. Wonder</em>. We developed a
          four-step music generation algorithm to transform the input melody.
        </p>
        <h3>Sample Results</h3>

        <figure>
          <div>
            <table className={styles.resultsTable}>
              <tbody>
                <tr>
                  <th>Song</th>
                  <th>Input</th>
                  <th>Output</th>
                </tr>
                <SampleRow
                  title="Piranha Plants on Parade"
                  url="//youtu.be/3EkzTUPoWMU?feature=shared&t=11"
                  directory="piranha"
                />
                <SampleRow
                  title="Saria's Song"
                  url="//youtu.be/fER8zIAhRD0?feature=shared&t=2"
                  directory="zelda"
                />
                <SampleRow
                  title="Eine Kleine Nachtmusik"
                  url="//youtu.be/oy2zDJPIgwc?feature=shared&t=4"
                  directory="mozart"
                />
                <SampleRow
                  title="Cherokee"
                  url="//youtu.be/M283JFxesic?feature=shared&t=33"
                  directory="cherokee"
                />
              </tbody>
            </table>
          </div>
        </figure>

        <p>
          To contrast, here&apos;s what the &ldquo;Piranha Plants on
          Parade&rdquo; melody sounds like with random chords:
        </p>

        <AudioPlayer src={`/sample-audio/bad-chords.wav`} />

        <h3>How it Works</h3>
        <figure className="card theme-light">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.architectureFigure}
              src="/architecture-figure.svg"
              alt="Architecture flowchart"
            />
          </div>
          <figcaption>
            An overview of the architecture of Piranha Plants as Charade.
          </figcaption>
        </figure>
        <p>
          The core of Piranha Plants as Charade follows a four-step process:
        </p>
        <ol className={styles.howItWorksSteps}>
          <li>
            <strong>Extract the melody.</strong> In order to analyze our input
            in musical terms, we need to represent it with a suitable
            abstraction. This involves extracting, among other information, the
            pitch, start time, and duration of each note in the input &mdash;
            for which we use various librosa tools.
          </li>
          <li>
            <strong>Generate the chord progression.</strong> To generate a
            pleasing musical accompaniment, we use a framework based around
            chord progressions, a common technique employed by composers and
            songwriters. We model the problem using a hidden Markov model, and
            we solve for the chord progression with Viterbi&apos;s algorithm.
          </li>
          <li>
            <strong>Generate the musical arrangement.</strong> Our melodic and
            harmonic contexts are sufficient to create a convincing
            accompaniment. We handle each part (e.g. piano, voice, etc.)
            independently, and with the aforementioned contexts, we model a
            virtual musician for each part using the appropriate musical
            conventions. Our musician models follow rule-based approaches to
            generate their respective contributions to the output, represented
            by musical structures.
          </li>
          <li>
            <strong>Export the arrangment as a digital signal.</strong> With our
            output formalized in musical terms, the last step is to convert it
            into a digital signal. First, we convert the non-vocal parts into a
            digital signal by interfacing with pre-existing programs. For the
            vocal parts, we splice together modified voice samples from{" "}
            <em>Animal Crossing: New Horizons</em>. We combine the results from
            our two processes to get our final output.
          </li>
        </ol>
      </div>
      <ul className={cls("link-section", styles.footer)}>
        <li>
          <a
            className={cls("icon", styles.report)}
            href="/report.pdf"
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
    </>
  );
};

export { Blog };
