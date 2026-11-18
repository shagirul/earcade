import { useLayoutEffect, useRef, useState } from "react";
import { ArcadeBrand } from "../../ui/arcade/ArcadeBrand";
import { InstallButton } from "../../pwa/InstallButton";
import "./home.css";

const previews = [
  {
    title: "Intervals",
    subtitle: "Hear the distance",
    description: "Compare two notes and identify the musical interval.",
    art: <>
      <path d="M5 36H43M7 33V22H14V33M20 33V14H27V33M33 33V6H40V33" />
      <path d="M10 13H22L25 8H39" strokeDasharray="2 4" />
    </>,
  },
  {
    title: "Note memory",
    subtitle: "Recall the sequence",
    description: "Listen to a sequence of notes, then reproduce them in the correct order.",
    art: <>
      <path d="M5 9H43M5 17H43M5 25H43M5 33H43" opacity=".35" />
      <path d="M10 30V16L20 13V26M28 19V5L38 2V15" />
      <ellipse cx="7" cy="30" rx="3" ry="2.5" fill="currentColor" />
      <ellipse cx="17" cy="26" rx="3" ry="2.5" fill="currentColor" />
      <ellipse cx="25" cy="19" rx="3" ry="2.5" fill="currentColor" />
      <ellipse cx="35" cy="15" rx="3" ry="2.5" fill="currentColor" />
    </>,
  },
  {
    title: "Pitch match",
    subtitle: "Sing on target",
    description: "Match a target note with your voice and see how close you are.",
    art: <>
      <path d="M3 23H8L12 13L17 34L22 5L27 38L32 14L37 26H44" />
      <path d="M4 6V2H12M36 2H44V6M4 38V42H12M36 42H44V38" opacity=".45" />
    </>,
  },
  {
    title: "Scale sense",
    subtitle: "Recognize patterns",
    description: "Learn to recognize scale patterns and tonal relationships by ear.",
    art: <>
      <path d="M4 7H44V37H4Z M12 7V37M20 7V37M28 7V37M36 7V37" />
      <path d="M9 7H15V24H9ZM17 7H23V24H17ZM33 7H39V24H33Z" fill="currentColor" />
    </>,
  },
];

const trainingGuide = {
  status: "Training guide",
  title: "How to play",
  description: "Choose Note Rush, then start a round. Listen to each note and tap the matching piano key. Fast correct answers add up to 3 seconds. A wrong answer costs 2 seconds. Each timed round picks a sound. Tap the timer to choose one in endless practice. Your best score is saved on this device. Rotate to landscape to play.",
};

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 145 104" fill="none" aria-hidden="true">
      <defs>
        <pattern id="heroGrid" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" stroke="currentColor" opacity=".14" strokeWidth=".7" />
        </pattern>
      </defs>
      <path d="M9 4H135V100H9Z" fill="url(#heroGrid)" />
      <path d="M9 17V4H22M122 4H135V17M135 87V100H122M22 100H9V87" stroke="currentColor" opacity=".6" />
      <g transform="translate(29 17) rotate(-9 48 36)">
        <path d="M0 0H96V68H0Z" fill="var(--bg)" stroke="currentColor" />
        <path d="M4 4H15V62H4Z M17 4H28V62H17Z M30 4H41V62H30Z M43 4H54V62H43Z M56 4H67V62H56Z M69 4H80V62H69Z M82 4H92V62H82Z" fill="var(--white)" />
        <path d="M43 4H54V62H43Z" fill="currentColor" />
        <path d="M12 4H20V38H12Z M25 4H33V38H25Z M51 4H59V38H51Z M64 4H72V38H64Z M77 4H85V38H77Z" fill="var(--bg)" />
      </g>
      <path d="M115 8L104 30H114L109 45L132 23H120L126 8Z" fill="currentColor" stroke="var(--bg)" strokeWidth="3" />
      <path d="M15 92H37M18 97H30" stroke="currentColor" opacity=".5" />
    </svg>
  );
}

export function HomeScreen({
  best,
  focusPlay,
  onOpenExercise,
}: {
  best: number;
  focusPlay: boolean;
  onOpenExercise: () => void;
}) {
  const [preview, setPreview] = useState<typeof trainingGuide | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (focusPlay) playButton.current?.focus({ preventScroll: true });
  }, [focusPlay]);

  useLayoutEffect(() => {
    if (preview && !dialog.current?.open) dialog.current?.showModal();
  }, [preview]);

  return (
    <main className="home" aria-label="Earcade training home">
      <header className="home-header">
        <ArcadeBrand subtitle="Ear training arcade" />
        <div className="home-actions">
          <InstallButton />
          <button type="button" className="icon-button" aria-label="How to play" onClick={() => setPreview(trainingGuide)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.1 9a3 3 0 0 1 5.9.6c0 2-3 2.5-3 4.4M12 17h.01" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <section className="home-intro">
        <div>
          <div className="eyebrow">Training arena</div>
          <h1 className="display">TRAIN YOUR EAR.</h1>
          <p>Pick an exercise. Sharpen your hearing.</p>
        </div>
        <span className="head-index">01–06</span>
      </section>

      <section className="bracket hero-frame" aria-label="Featured exercise">
        <div className="panel hero-card">
          <div className="hero-top">
            <span className="meta accent-text">■ / 01 &nbsp; SPEED CHALLENGE</span>
            <span className="tag">30 SEC</span>
          </div>
          <div className="hero-content">
            <div className="hero-copy">
              <h2 className="display">NOTE RUSH</h2>
              <p>Hear the note. Hit the key.<br />Beat your best score.</p>
            </div>
            <HeroArt />
          </div>
          <div className="hero-bottom">
            <button type="button" className="primary" ref={playButton} onClick={onOpenExercise}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4l14 8-14 8Z" />
              </svg>
              {" PLAY"}
            </button>
            <div className="record">
              <strong className="display">{best}</strong>
              <span className="meta">Personal best</span>
            </div>
          </div>
        </div>
      </section>

      <a className="panel instrument-card" href={import.meta.env.BASE_URL + "synth-lab/"}>
        <span className="instrument-art" aria-hidden="true">
          <svg viewBox="0 0 64 44" fill="none">
            <path d="M8 22h48M20 7v30M32 7v30M44 7v30" stroke="currentColor" opacity=".2" />
            <path d="M4 22h9l6-12 9 24 8-24 7 12h17" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </span>
        <span className="instrument-copy">
          <span className="display">Synth Lab</span>
          <span>Shape sounds and play them on the keys.</span>
        </span>
        <span className="meta instrument-action" aria-hidden="true">Open lab <Chevron /></span>
      </a>

      <section className="library" aria-label="More exercises">
        <div className="section-head">
          <h2 className="display section-label">MORE EXERCISES</h2>
          <span className="meta">04 IN DEVELOPMENT</span>
        </div>
        <div className="tile-grid">
          {previews.map(({ title, subtitle, description, art }, index) => (
            <button
              key={title}
              type="button"
              className="exercise-tile"
              aria-label={title + ", preview"}
              onClick={() => setPreview({ title, description, status: "Coming soon" })}
            >
              <span className="tile-top"><span className="meta">/0{index + 3}</span><Chevron /></span>
              <span className="tile-main">
                <svg className="tile-art" viewBox="0 0 48 44" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                  {art}
                </svg>
                <span className="tile-copy">
                  <span className="display">{title}</span>
                  <span className="tile-description">{subtitle}</span>
                </span>
              </span>
              <span className="tile-foot">Coming soon</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <span className="meta">■ &nbsp; 02 PLAYABLE MODES</span>
        <button type="button" onClick={onOpenExercise}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 5H21V19H3Z M9 5V19M15 5V19M7 5V12H11V5M13 5V12H17V5" />
          </svg>
          {" Piano warm-up "}<Chevron />
        </button>
      </footer>

      <dialog ref={dialog} className="home-dialog" aria-labelledby="mode-title" onClose={() => setPreview(null)}>
        <div className="dialog-top">
          <span className="tag">{preview?.status}</span>
          <button type="button" className="icon-button" aria-label="Close" onClick={() => dialog.current?.close()}>×</button>
        </div>
        <h2 className="display" id="mode-title">{preview?.title}</h2>
        <p>{preview?.description}</p>
        <button type="button" className="secondary" onClick={() => dialog.current?.close()}>Back to exercises</button>
      </dialog>
    </main>
  );
}
