import { useEffect, useRef, useState } from "react";
export function GiftPortal({ opened, onOpen, motion }) {
  const ref = useRef(),
    timer = useRef(),
    triggered = useRef(false);
  const [holding, setHolding] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  function stop() {
    clearTimeout(timer.current);
    setHolding(false);
  }
  function tilt(e) {
    if (!motion || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    ref.current?.style.setProperty(
      "--tilt-x",
      `${-(e.clientY - r.top - r.height / 2) / 25}deg`,
    );
    ref.current?.style.setProperty(
      "--tilt-y",
      `${(e.clientX - r.left - r.width / 2) / 25}deg`,
    );
  }
  return (
    <div
      className="portal-scene"
      onPointerMove={tilt}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--tilt-x", "0deg");
        ref.current?.style.setProperty("--tilt-y", "0deg");
        stop();
      }}
    >
      <div className="orbital-ring ring-one" />
      <div className="orbital-ring ring-two" />
      <span className="orbit-star orbit-a" aria-hidden="true">
        ✧
      </span>
      <span className="orbit-star orbit-b" aria-hidden="true">
        ✦
      </span>
      <span className="orbit-dot" aria-hidden="true" />
      <div className={`portal-gift ${opened ? "unwrapped" : ""}`} ref={ref}>
        <div className="portal-glow" />
        <div className="gift-cube" aria-hidden="true">
          <div className="cube-front" />
          <div className="cube-side" />
          <div className="cube-lid">
            <span className="cube-bow left-bow" />
            <span className="cube-bow right-bow" />
          </div>
          <span className="gift-ribbon" />
        </div>
        <span className="floating-label">made of little happy things</span>
      </div>
      {!opened && (
        <button
          className={`portal-open ${holding ? "holding" : ""}`}
          aria-label="Open my surprise"
          onPointerDown={() => {
            triggered.current = false;
            setHolding(true);
            timer.current = setTimeout(() => {
              triggered.current = true;
              setHolding(false);
              onOpen();
            }, 900);
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onClick={() => {
            stop();
            if (!triggered.current) onOpen();
            triggered.current = false;
          }}
        >
          <span>Open my surprise</span>
          <span aria-hidden="true">↗</span>
        </button>
      )}
      <span className="portal-caption">
        {opened
          ? "Your little universe is open."
          : "Tap to open. Hold for a little extra anticipation."}
      </span>
    </div>
  );
}
const balloonWords = ["Joy", "Courage", "Peace", "Adventure", "Friendship"];
export function BalloonGarden({ onComplete }) {
  const [popped, setPopped] = useState([]);
  function pop(i) {
    if (popped.includes(i)) return;
    const next = [...popped, i];
    setPopped(next);
    if (next.length === 5) onComplete?.();
  }
  return (
    <div className="balloon-game">
      <div className="balloon-row">
        {balloonWords.map((word, i) => (
          <div className="balloon-slot" key={word}>
            <button
              className={`happy-balloon balloon-${i} ${popped.includes(i) ? "popped" : ""}`}
              disabled={popped.includes(i)}
              aria-label={`Pop ${word.toLowerCase()} balloon`}
              onClick={() => pop(i)}
            >
              <span className="balloon-shell">
                <span aria-hidden="true">{["✦", "☀", "♡", "↗", "✳"][i]}</span>
              </span>
              <span className="balloon-string" aria-hidden="true" />
            </button>
            <span
              className={`balloon-word ${popped.includes(i) ? "unlocked" : ""}`}
            >
              {popped.includes(i) ? word : "a little surprise"}
            </span>
          </div>
        ))}
      </div>
      <div className="balloon-bottom">
        <p role="status">
          {popped.length === 5
            ? "A little sky full of good wishes. All for you."
            : `${popped.length} of 5 little wishes discovered`}
        </p>
        <button className="text-button" onClick={() => setPopped([])}>
          Bring the balloons back ↻
        </button>
      </div>
    </div>
  );
}
export function ScratchSurprise({ name, onReveal }) {
  const canvas = useRef(),
    down = useRef(false),
    cells = useRef(new Set()),
    callback = useRef(onReveal);
  callback.current = onReveal;
  const [revealed, setRevealed] = useState(false),
    [ready, setReady] = useState(false),
    [progress, setProgress] = useState(0);
  function reveal() {
    if (revealed) return;
    setRevealed(true);
    callback.current?.();
  }
  useEffect(() => {
    if (revealed || typeof CanvasRenderingContext2D === "undefined") return;
    const element = canvas.current;
    if (!element) return;
    function draw() {
      const rect = element.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = rect.width * ratio;
      element.height = rect.height * ratio;
      const ctx = element.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#68578d");
      gradient.addColorStop(0.5, "#c8afd8");
      gradient.addColorStop(1, "#756092");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#fff7ec";
      ctx.textAlign = "center";
      ctx.font = "32px Georgia";
      ctx.fillText("A little secret", rect.width / 2, rect.height / 2 - 8);
      ctx.font = "11px Arial";
      ctx.fillText(
        "SCRATCH TO REVEAL  ✧",
        rect.width / 2,
        rect.height / 2 + 24,
      );
      cells.current.clear();
      setProgress(0);
      setReady(true);
    }
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [revealed]);
  function scratch(e) {
    if (!down.current || !ready || revealed) return;
    const element = canvas.current,
      rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top,
      ctx = element.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    const cx = Math.floor((x / rect.width) * 24),
      cy = Math.floor((y / rect.height) * 12);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        if (cx + a >= 0 && cx + a < 24 && cy + b >= 0 && cy + b < 12)
          cells.current.add(`${cx + a}:${cy + b}`);
    const value = Math.min(100, Math.round((cells.current.size / 110) * 100));
    setProgress(value);
    if (value >= 100) reveal();
  }
  return (
    <div className={`scratch-wrap ${revealed ? "revealed" : ""}`}>
      <div className="scratch-card">
        <div className="secret-message" aria-hidden={!revealed}>
          <span aria-hidden="true">✧</span>
          <p>
            The world has room for
            <br />
            your kind of wonderful,
            <br />
            <em>{name}.</em>
          </p>
        </div>
        {!revealed && (
          <>
            {!ready && (
            <div className="scratch-fallback" aria-hidden="true">
              A little secret
              <br />
              <small>Something lovely is hiding here.</small>
            </div>
            )}
            <canvas
              ref={canvas}
              style={{ opacity: ready ? 1 : 0 }}
              aria-hidden="true"
              onPointerDown={(e) => {
                down.current = true;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                scratch(e);
              }}
              onPointerMove={scratch}
              onPointerUp={() => (down.current = false)}
              onPointerCancel={() => (down.current = false)}
            />
          </>
        )}
      </div>
      <div className="scratch-controls">
        <span>
          {revealed
            ? "A little reminder. Keep it with you."
            : `Scratch the card, or reveal it with a tap${progress ? ` · ${progress}%` : ""}.`}
        </span>
        {!revealed && (
          <button className="text-button" onClick={reveal}>
            Reveal my secret ↗
          </button>
        )}
      </div>
    </div>
  );
}
const wheelWishes = [
  [
    "A little adventure",
    "Try something that makes your world feel a little bigger.",
  ],
  ["A sweet moment", "Make time for one small thing that makes you happy."],
  ["A brave beginning", "Your next chapter can start with one tiny step."],
  [
    "A softer day",
    "Rest is allowed. You don’t have to earn a peaceful moment.",
  ],
  ["A lovely surprise", "Leave a little space for something you didn’t plan."],
  [
    "A slice of joy",
    "Celebrate the little wins. Cake is optional, but encouraged.",
  ],
];
export function FortuneWheel({ motion, onSpin }) {
  const [rotation, setRotation] = useState(0),
    [spinning, setSpinning] = useState(false),
    [result, setResult] = useState(-1);
  const timer = useRef(),
    pending = useRef(-1),
    round = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!motion && spinning) {
      clearTimeout(timer.current);
      setResult(pending.current);
      setSpinning(false);
      onSpin?.();
    }
  }, [motion, spinning, onSpin]);
  function spin() {
    if (spinning) return;
    const chosen = (round.current * 5 + Math.floor(Math.random() * 6)) % 6;
    round.current++;
    pending.current = chosen;
    const target = (360 - chosen * 60) % 360;
    setRotation((v) => (Math.ceil(v / 360) + 3) * 360 + target);
    setSpinning(true);
    if (!motion) {
      setResult(chosen);
      setSpinning(false);
      onSpin?.();
      return;
    }
    timer.current = setTimeout(() => {
      setResult(chosen);
      setSpinning(false);
      onSpin?.();
    }, 1850);
  }
  return (
    <div className="fortune-wheel-layout">
      <div className="wheel-stage">
        <span className="wheel-pointer" aria-hidden="true">
          ▼
        </span>
        <div
          className="fortune-wheel"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        >
          {wheelWishes.map(([name], i) => (
            <span className={`wheel-word word-${i}`} key={name}>
              {["✧", "☀", "↗", "☾", "✦", "♡"][i]}
            </span>
          ))}
          <span className="wheel-hub">✳</span>
        </div>
      </div>
      <div className="wheel-copy">
        <span className="micro-label">NO PREDICTIONS. JUST GOOD WISHES.</span>
        <div className="wheel-result" role="status">
          {result < 0 ? (
            <>
              <h3>
                What’s your
                <br />
                little birthday wish?
              </h3>
              <p>
                Give the wheel a spin. There’s something lovely in every
                direction.
              </p>
            </>
          ) : (
            <>
              <h3>{wheelWishes[result][0]}</h3>
              <p>{wheelWishes[result][1]}</p>
            </>
          )}
        </div>
        <button className="primary" onClick={spin} disabled={spinning}>
          {spinning
            ? "A little magic in motion…"
            : result < 0
              ? "Spin my birthday wish ↗"
              : "One more spin ↻"}
        </button>
      </div>
    </div>
  );
}
