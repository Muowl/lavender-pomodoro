import { useEffect, useEffectEvent, useState } from "react";
import "./App.css";

type ModeId = "focus" | "shortBreak" | "longBreak";
type Theme = "light" | "dark";

type ModeConfig = {
  label: string;
  minutes: number;
  description: string;
  cue: string;
};

const modes: Record<ModeId, ModeConfig> = {
  focus: {
    label: "Focus",
    minutes: 25,
    description: "Single-task work with calm momentum.",
    cue: "Settle in and begin one quiet, intentional task.",
  },
  shortBreak: {
    label: "Short Break",
    minutes: 5,
    description: "Step back, breathe, and reset your eyes.",
    cue: "Let your shoulders drop and keep the break light.",
  },
  longBreak: {
    label: "Long Break",
    minutes: 15,
    description: "Recover fully before the next deep cycle.",
    cue: "Pause longer, stretch, and let the pace soften.",
  },
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [selectedMode, setSelectedMode] = useState<ModeId>("focus");
  const [timeLeft, setTimeLeft] = useState(modes.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [statusText, setStatusText] = useState(modes.focus.cue);

  const currentMode = modes[selectedMode];
  const totalSeconds = currentMode.minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const longBreakIn = completedFocusSessions % 4 === 0 ? 4 : 4 - (completedFocusSessions % 4);

  const applyMode = useEffectEvent((modeId: ModeId, message?: string) => {
    setSelectedMode(modeId);
    setTimeLeft(modes[modeId].minutes * 60);
    setStatusText(message ?? modes[modeId].cue);
  });

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    document.title = `${formatTime(timeLeft)} - ${currentMode.label} | Lavender Pomodoro`;
  }, [currentMode.label, timeLeft]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  useEffect(() => {
    if (timeLeft !== 0) {
      return;
    }

    if (selectedMode === "focus") {
      const nextCount = completedFocusSessions + 1;
      const nextMode = nextCount % 4 === 0 ? "longBreak" : "shortBreak";

      setCompletedFocusSessions(nextCount);
      applyMode(nextMode, `Focus block complete. Ease into a ${modes[nextMode].label.toLowerCase()}.`);
      return;
    }

    applyMode("focus", "Break complete. Your next focus block is ready.");
  }, [applyMode, completedFocusSessions, selectedMode, timeLeft]);

  function handleModeSelect(modeId: ModeId) {
    setIsRunning(false);
    applyMode(modeId, `Switched to ${modes[modeId].label.toLowerCase()} mode.`);
  }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setStatusText(`Reset ${currentMode.label.toLowerCase()} and begin again when ready.`);
  }

  function handleAdvance() {
    if (selectedMode === "focus") {
      const nextCount = completedFocusSessions + 1;
      const nextMode = nextCount % 4 === 0 ? "longBreak" : "shortBreak";

      setCompletedFocusSessions(nextCount);
      setIsRunning(false);
      applyMode(nextMode, `Focus block saved. Move into a ${modes[nextMode].label.toLowerCase()}.`);
      return;
    }

    setIsRunning(false);
    applyMode("focus", "Break closed. Return to a fresh focus block.");
  }

  function handleFreshStart() {
    setIsRunning(false);
    setCompletedFocusSessions(0);
    applyMode("focus", "Fresh start ready. Begin again from a quiet zero.");
  }

  return (
    <main className="app-shell">
      <div className="bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <section className="workspace">
        <article className="panel timer-panel">
          <div className="topbar">
            <p className="eyebrow">Lavender Pomodoro</p>
            <div className="topbar-actions">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
                aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              >
                {theme === "light" ? "\u263E" : "\u2600"}
              </button>
              <button type="button" className="toolbar-button subtle" onClick={handleFreshStart}>
                Fresh Start
              </button>
            </div>
          </div>

          <div className="hero-copy">
            <h1>A softer rhythm for focused work.</h1>
          </div>

          <div className="mode-switch" aria-label="Pomodoro modes">
            {(
              Object.entries(modes) as [ModeId, ModeConfig][]
            ).map(([modeId, mode]) => (
              <button
                key={modeId}
                type="button"
                className={modeId === selectedMode ? "mode-button active" : "mode-button"}
                onClick={() => handleModeSelect(modeId)}
              >
                <span>{mode.label}</span>
                <small>{mode.minutes} min</small>
              </button>
            ))}
          </div>

          <div className="timer-card">
            <div className="timer-meta">
              <div>
                <p className="label">Current flow</p>
                <strong>{currentMode.label}</strong>
              </div>
              <p>{currentMode.description}</p>
            </div>

            <div
              className={`time-readout${isRunning ? " is-running" : timeLeft < totalSeconds ? " is-paused" : ""}`}
              aria-live="polite"
            >
              {formatTime(timeLeft)}
            </div>

            <div className="progress-block" aria-hidden="true">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-labels">
                <span>{Math.round(progress)}% complete</span>
                <span>{currentMode.minutes} minute ritual</span>
              </div>
            </div>

            <div className="control-row">
              <button type="button" className="primary-button" onClick={() => setIsRunning((value) => !value)}>
                {isRunning ? "Pause" : "Start"}
              </button>
              <button type="button" className="secondary-button" onClick={handleReset}>
                Reset
              </button>
              <button type="button" className="secondary-button" onClick={handleAdvance}>
                {selectedMode === "focus" ? "Finish Session" : "Back to Focus"}
              </button>
            </div>
          </div>

          <div className="status-strip">
            <p className="label">Session note</p>
            <p>{statusText}</p>
            <p className="status-summary">
              {completedFocusSessions} completed focus session{completedFocusSessions === 1 ? "" : "s"}.
              {" "}
              Long break in {longBreakIn} block{longBreakIn === 1 ? "" : "s"}.
            </p>
            <div className="session-dots" aria-label={`${completedFocusSessions % 4} of 4 sessions in current cycle`}>
              {Array.from({ length: 4 }, (_, i) => (
                <span
                  key={i}
                  className={`session-dot${i < completedFocusSessions % 4 ? " filled" : ""}${i === completedFocusSessions % 4 && selectedMode === "focus" ? " current" : ""}`}
                />
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
