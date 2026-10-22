import { useEffect, useId, useRef, useState } from "react";
export function BotanicalSprig({ className = "", variant = 0 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 300"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M88 286 C70 215 120 143 88 20"
        stroke="currentColor"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g
          key={i}
          transform={`translate(${i % 2 ? 91 : 86} ${250 - i * 38}) rotate(${i % 2 ? -25 : 25})`}
        >
          <path
            d={
              i % 2
                ? "M0 0 C12 -38 51 -40 47 -58 C60 -25 27 -5 0 0"
                : "M0 0 C-12 -38 -51 -40 -47 -58 C-60 -25 -27 -5 0 0"
            }
            fill={variant ? "#a1ad7d" : "currentColor"}
            fillOpacity={0.4 + i * 0.06}
          />
          <path
            d={i % 2 ? "M0 0 L42 -49" : "M0 0 L-42 -49"}
            stroke="currentColor"
            strokeWidth="1"
          />
        </g>
      ))}
    </svg>
  );
}
export function GreenhouseGate({ opened, onOpen, name, portraitSrc }) {
  const [portraitMissing,setPortraitMissing]=useState(false);
  const glassId = useId();
  return (
    <div className={`greenhouse ${opened ? "gate-is-open" : ""}`}>
      <div className="greenhouse-sun" />
      <svg
        className="greenhouse-frame"
        viewBox="0 0 470 540"
        aria-hidden={portraitSrc ? undefined : "true"}
        role={portraitSrc ? "img" : undefined}
        aria-label={portraitSrc ? "Garden gate with the supplied birthday portrait in place of the flower pot" : undefined}
      >
        <defs>
          <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e3d5af" stopOpacity=".8" />
            <stop offset="1" stopColor="#a7b191" stopOpacity=".5" />
          </linearGradient>
        </defs>
        <path
          d="M50 490 V220 A185 185 0 0 1 370 95 Q420 150 420 220 V490Z"
          fill={`url(#${glassId})`}
          stroke="#66533d"
          strokeWidth="8"
        />
        <path
          d="M235 35V489 M50 220H420 M68 150H403 M56 350H416"
          stroke="#766145"
          strokeWidth="4"
        />
        <path
          d="M100 490V220 Q100 72 235 36 Q370 72 370 220V490"
          stroke="#766145"
          strokeWidth="3"
          fill="none"
        />
        <path d="M30 490H440L452 511H18Z" fill="#776047" />
        <path d="M17 511H453V527H17Z" fill="#9b8260" />
        <path
          d="M88 460Q112 415 155 438T245 438T370 455L405 487H60Z"
          fill="#526c43"
        />
        <path d="M72 474Q145 427 219 465T392 473L406 487H58Z" fill="#73834f" />
        {[90, 135, 185, 280, 330, 376].map((x, i) => (
          <g key={x} transform={`translate(${x} ${460 - (i % 2) * 20})`}>
            <path d="M0 15Q-8 -20 8 -50" stroke="#52643a" strokeWidth="3" />
            <ellipse
              cx="-10"
              cy="-5"
              rx="8"
              ry="22"
              fill="#69854f"
              transform="rotate(-40 -10 -5)"
            />
            <ellipse
              cx="10"
              cy="-22"
              rx="7"
              ry="19"
              fill="#7e9259"
              transform="rotate(35 10 -22)"
            />
          </g>
        ))}
        {portraitSrc ? <g className="greenhouse-portrait">
          <rect x="123" y="196" width="224" height="296" rx="5" fill="#f3e8d5" stroke="#9b8260" strokeWidth="3" />
          {!portraitMissing ? <image href={portraitSrc} x="127" y="200" width="216" height="288" preserveAspectRatio="xMidYMid meet" onError={()=>setPortraitMissing(true)} /> : <text x="235" y="340" textAnchor="middle" fill="#153d2c" fontSize="13">Your garden portrait</text>}
        </g> : <>
        <g className="greenhouse-flower" transform="translate(235 340)">
          <path d="M0 115V0" stroke="#536f40" strokeWidth="4" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-17"
              rx="11"
              ry="23"
              fill="#ead8a3"
              transform={`rotate(${a})`}
            />
          ))}
          <circle r="13" fill="#92713d" />
        </g>
        <path d="M190 451H280L267 489H204Z" fill="#a37d54" />
        <path d="M184 448H285V459H184Z" fill="#b28d65" />
        </>}
      </svg>
      <div className="gate-door left-door" aria-hidden="true">
        <span className="gate-pane" />
        <span className="gate-knob" />
      </div>
      <div className="gate-door right-door" aria-hidden="true">
        <span className="gate-pane" />
        <span className="gate-knob" />
      </div>
      <div className="garden-plaque">
        <span>A PRIVATE LITTLE GARDEN</span>
        <strong>{name}</strong>
      </div>
      <span className="gate-butterfly butterfly-one" aria-hidden="true">
        ❧
      </span>
      <span className="gate-butterfly butterfly-two" aria-hidden="true">
        ❧
      </span>
      {!opened && (
        <button className="gate-key" onClick={onOpen}>
          <svg viewBox="0 0 50 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M20 12H46M35 12V20M42 12V17" />
          </svg>
          <span>Unlock the garden</span>
          <span aria-hidden="true">↗</span>
        </button>
      )}
      <span className="greenhouse-caption">
        {opened
          ? "A little place, made entirely for you."
          : "One little key. So much still to discover."}
      </span>
    </div>
  );
}
const seedInfo = [
  ["Courage", "For the first step, even before the whole path is clear."],
  ["Joy", "For small, ordinary moments that turn into your favourite days."],
  ["Peace", "For a life with room to breathe, rest, and feel at home."],
];
export function WishGarden({ onBloom }) {
  const [selected, setSelected] = useState(0),
    [growth, setGrowth] = useState([0, 0, 0]);
  function water() {
    if (growth[selected] >= 3) return;
    const next = growth.map((g, i) => (i === selected ? g + 1 : g));
    setGrowth(next);
    if (next.every((g) => g === 3)) onBloom?.();
  }
  return (
    <div className="wish-garden-layout">
      <div className="wish-garden-art">
        <svg viewBox="0 0 570 390" aria-hidden="true">
          <defs>
            <linearGradient id="soilTint" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#816448" />
              <stop offset="1" stopColor="#4b392b" />
            </linearGradient>
          </defs>
          <ellipse cx="285" cy="316" rx="246" ry="35" fill="#d7d8b7" />
          <path
            d="M40 300Q280 273 530 300V357Q283 398 40 357Z"
            fill="url(#soilTint)"
          />
          <ellipse cx="285" cy="300" rx="245" ry="27" fill="#9b7c55" />
          {growth.some(g=>g>0)&&<g key={growth.join('-')} data-anim="rain-fall" fill="#b9d2c3"><ellipse cx={140+selected*145} cy="220" rx="3" ry="8"/><ellipse cx={130+selected*145} cy="205" rx="2" ry="5"/></g>}
          {seedInfo.map(([title], i) => (
            <g
              key={title}
              transform={`translate(${140 + i * 145} 290)`}
              className={`growing-plant growth-${growth[i]}`}
            >
              <ellipse cx="0" cy="7" rx="20" ry="6" fill="#62472e" />
              {growth[i] === 0 && (
                <ellipse data-anim="seed-drop" cy="0" rx="6" ry="3" fill="#d3b274" />
              )}
              <g
                className="plant-stem"
                style={{
                  opacity: growth[i] > 0 ? 1 : 0,
                  transform: `scaleY(${growth[i] >= 2 ? 1 : 0.45})`,
                  transformOrigin: "0px 0px",
                }}
              >
                <path
                  data-anim={growth[i]>0?"stem-grow":undefined}
                  d="M0 0Q-8 -70 0 -141"
                  stroke="#4e6a3f"
                  strokeWidth="5"
                  fill="none"
                />
                <path
                  data-anim={growth[i]>=2?"leaf-unfurl":undefined}
                  d="M-2 -52Q-49 -96 -50 -53Q-28 -25 -2 -52"
                  fill="#6d874b"
                />
                <path d="M-3 -93Q46 -132 48 -88Q22 -68 -3 -93" fill="#8b9b5c" />
              </g>
              <g
                className="plant-blossom"
                style={{
                  opacity: growth[i] >= 3 ? 1 : 0,
                  transform: `translate(0px,-149px) scale(${growth[i] >= 3 ? 1 : 0.1})`,
                  transformOrigin: "0px 0px",
                }}
                transform="translate(0 -149)"
              >
                <g data-anim={growth[i]>=3?"flower-bloom":undefined}>{[0, 60, 120, 180, 240, 300].map((a) => (
                  <ellipse
                    key={a}
                    cx="0"
                    cy="-18"
                    rx="12"
                    ry="23"
                    transform={`rotate(${a})`}
                    fill={["#dec78b", "#c6cdaa", "#d6b893"][i]}
                  />
                ))}
                <circle r="14" fill="#8b6a3e" />
                <circle r="7" fill="#c09a55" /></g>
              </g>
            </g>
          ))}
        </svg>
        <div className="garden-plant-labels">
          {seedInfo.map(([title], i) => (
            <button
              key={title}
              className={selected === i ? "selected" : ""}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              {title}
              <span>
                {growth[i] === 3 ? "in bloom" : `${growth[i]}/3 drops`}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="garden-widget-copy">
        <span className="eyebrow">PLANT SOMETHING YOU WANT MORE OF</span>
        <h3>
          A little {seedInfo[selected][0].toLowerCase()}.<br />A little care.
        </h3>
        <p>{seedInfo[selected][1]}</p>
        <button
          className="primary"
          onClick={water}
          disabled={growth[selected] >= 3}
        >
          {growth[selected] >= 3
            ? "This little wish is blooming"
            : "Water this wish"}{" "}
          <span aria-hidden="true">♧</span>
        </button>
        <p className="widget-status" role="status" data-anim={growth[selected]>=3?"wish-rise":undefined}>
          {growth.every((g) => g === 3)
            ? "Three little wishes. A whole garden of possibility."
            : growth[selected] >= 3
              ? "Choose another seed to keep your garden growing."
              : "Choose a seed, then give it three little drops of care."}
        </p>
        <button className="text-button" onClick={() => setGrowth([0, 0, 0])}>
          Plant a fresh garden ↻
        </button>
      </div>
    </div>
  );
}
const fireflyNotes = [
  "A little courage.",
  "A quiet kind of happiness.",
  "Room for a new beginning.",
  "A reason to laugh.",
  "A memory worth keeping.",
  "Something beautiful still to come.",
];
export function FireflyJar({ onComplete }) {
  const [caught, setCaught] = useState([]);
  function catchOne(i) {
    if (caught.includes(i)) return;
    const next = [...caught, i];
    setCaught(next);
    if (next.length === 6) onComplete?.();
  }
  return (
    <div className="firefly-experience">
      <div className="firefly-field">
        <svg
          viewBox="0 0 540 350"
          aria-hidden="true"
          className="firefly-landscape"
        >
          <path d="M0 320Q130 265 260 310T540 286V350H0Z" fill="#304b33" />
          <path d="M0 340Q110 290 230 325T540 310V350H0Z" fill="#1f3727" />
          {[45, 85, 145, 390, 435, 490].map((x, i) => (
            <path
              key={x}
              d={`M${x} 340q${i % 2 ? 25 : -25} -65 0 -110q${i % 2 ? -20 : 20} 20 ${i % 2 ? -28 : 28} 42`}
              stroke="#7f9c6c"
              strokeWidth="2"
              fill="none"
              opacity=".5"
            />
          ))}
        </svg>
        {fireflyNotes.map((note, i) => (
          <button
            key={note}
            className={`firefly fly-${i} ${caught.includes(i) ? "caught" : ""}`}
            data-anim={caught.includes(i)?"firefly-catch":undefined}
            disabled={caught.includes(i)}
            aria-label={`Collect firefly ${i + 1}`}
            onClick={() => catchOne(i)}
          >
            <span aria-hidden="true" />
            <small>{caught.includes(i) ? "kept" : "a little light"}</small>
          </button>
        ))}
        <div className="glass-jar" aria-hidden="true">
          <div className="jar-lid" />
          <div className="jar-neck" />
          <div className="jar-body" key={caught.length} data-anim={caught.length?"jar-glow":undefined}>
            {caught.map((i, index) => (
              <i
                key={i}
                style={{
                  left: `${20 + ((index * 29) % 65)}%`,
                  top: `${15 + ((index * 31) % 65)}%`,
                }}
              />
            ))}
          </div>
          <div className="jar-label">little lights</div>
        </div>
      </div>
      <div className="firefly-status">
        <p role="status">
          {caught.length === 6
            ? "You do not have to shine loudly to make the world feel warmer."
            : caught.length
              ? fireflyNotes[caught.at(-1)]
              : "Tap the fireflies. Keep a little light for later."}
        </p>
        <span>{caught.length}/6 lights collected</span>
        <button className="text-button" onClick={() => setCaught([])}>
          Let them wander again ↗
        </button>
      </div>
    </div>
  );
}
const leafMessages = [
  [
    "For your brave days",
    "May you trust the quiet little voice that says, “I would like to try.”",
  ],
  [
    "For your quiet days",
    "May rest feel like a beginning, not something you need to apologise for.",
  ],
  [
    "For new beginnings",
    "May the things meant for you have room to grow, even if they arrive slowly.",
  ],
  [
    "For your joy",
    "May happiness find you in ordinary places, and may you pause long enough to notice.",
  ],
];
export function LeafLetters() {
  const [open, setOpen] = useState([]);
  return (
    <div className="leaf-notes">
      {leafMessages.map(([title, text], i) => (
        <button
          className={`leaf-note note-${i} ${open.includes(i) ? "is-open" : ""}`}
          key={title}
          aria-expanded={open.includes(i)}
          onClick={() =>
            setOpen((v) =>
              v.includes(i) ? v.filter((n) => n !== i) : [...v, i],
            )
          }
        >
          <span className="leaf-front" aria-hidden={open.includes(i)}>
            <span aria-hidden="true">❧</span>
            <strong>{title}</strong>
            <small>turn this little leaf ↗</small>
          </span>
          <span className="leaf-back" aria-hidden={!open.includes(i)} data-anim={open.includes(i)?"leaf-flip":undefined}>
            <small>{title}</small>
            <span>{text}</span>
            <i aria-hidden="true">↶</i>
          </span>
        </button>
      ))}
    </div>
  );
}
const futureIdeas = [
  "A slow coffee and a long conversation",
  "A sunrise or sunset worth watching",
  "A photo day with no perfect poses",
  "A little place neither of us has explored",
];
export function MemoryJar() {
  const [selected, setSelected] = useState([]);
  return (
    <div className="memory-jar-layout">
      <div>
        <span className="eyebrow">MEMORIES WE CAN STILL MAKE</span>
        <h3>
          Let’s leave room
          <br />
          for <em>what comes next.</em>
        </h3>
        <p>
          These are ideas for future moments, not stories that have already
          happened. Pick the ones you’d like to keep.
        </p>
      </div>
      <div className="memory-idea-list">
        {futureIdeas.map((idea, i) => (
          <button
            className={selected.includes(i) ? "kept" : ""}
            data-anim={selected.includes(i)?"memory-turn":undefined}
            key={idea}
            aria-pressed={selected.includes(i)}
            onClick={() =>
              setSelected((v) =>
                v.includes(i) ? v.filter((n) => n !== i) : [...v, i],
              )
            }
          >
            <span aria-hidden="true">{selected.includes(i) ? "✓" : "+"}</span>
            {idea}
          </button>
        ))}
        <p className="widget-status" role="status">
          {selected.length
            ? `${selected.length} little idea${selected.length === 1 ? "" : "s"} for a future memory.`
            : "Nothing scheduled. Just lovely possibilities."}
        </p>
      </div>
    </div>
  );
}
export function WishBoat() {
  const wishId = useId();
  const [text, setText] = useState(""),
    [sealed, setSealed] = useState(false);
  return (
    <div className="wish-boat">
      <div className="wish-boat-copy">
        <span className="eyebrow">A WISH YOU DON’T HAVE TO EXPLAIN</span>
        <h3>
          Fold it gently.
          <br />
          <em>Let it find its way.</em>
        </h3>
        <p>
          Your words stay in this page. They are not saved or sent, and
          disappear when you leave.
        </p>
        {!sealed ? (
          <>
            <label htmlFor={wishId}>
              Your little wish
              <textarea
                id={wishId}
                maxLength={240}
                rows={3}
                placeholder="Something you hope for…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <button
              className="primary"
              onClick={() => setSealed(true)}
              disabled={!text.trim()}
            >
              Fold my wish into a boat ↗
            </button>
          </>
        ) : (
          <>
            <p className="sealed-confirmation" role="status">
              A little wish, held gently. May it find a beautiful shore.
            </p>
            <button className="text-button" onClick={() => setSealed(false)}>
              Unfold and edit my wish ↶
            </button>
          </>
        )}
      </div>
      <div
        className={`paper-stream ${sealed ? "boat-released" : ""}`}
        aria-hidden="true"
      >
        <div className="stream-line line-one" />
        <div className="stream-line line-two" />
        <div className="stream-line line-three" />
        <div className="paper-boat">
          <div className="boat-sail" />
          <div className="boat-fold" />
          <div className="boat-hull" />
        </div>
        <span className="stream-leaf">❧</span>
        <span className="stream-caption">some wishes travel quietly.</span>
      </div>
    </div>
  );
}
export function dateAtMidnight(date, timeZone) {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const p = Object.fromEntries(
      parts
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, Number(p.value)]),
    );
    guess +=
      target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  }
  return guess;
}
export function BirthdayClock({ birthday, timeZone }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  if (!birthday) return null;
  const target = dateAtMidnight(birthday, timeZone);
  const remaining = target - now;
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  const p = Object.fromEntries(localDate.map((x) => [x.type, x.value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  if (remaining <= 0)
    return (
      <p className="birthday-clock-note">
        {today === birthday
          ? "Today, this little garden blooms for you."
          : "A little garden to return to, whenever you need a smile."}
      </p>
    );
  const mins = Math.floor(remaining / 60000);
  return (
    <div className="birthday-clock">
      <span>UNTIL YOUR LITTLE CELEBRATION</span>
      <div>
        <strong>
          {Math.floor(mins / 1440)}
          <small>days</small>
        </strong>
        <i>:</i>
        <strong>
          {Math.floor(mins / 60) % 24}
          <small>hours</small>
        </strong>
        <i>:</i>
        <strong>
          {mins % 60}
          <small>minutes</small>
        </strong>
      </div>
    </div>
  );
}
