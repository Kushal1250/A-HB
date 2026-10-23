import PersonalApology from "./PersonalApology";
import { useEffect, useId, useRef, useState } from "react";
import Modal from "./Modal";
import KeyedBirthday from "./KeyedBirthday";
import DivineBlessings from "./DivineBlessings";
import {
  BotanicalSprig,
  GreenhouseGate,
  WishGarden,
  FireflyJar,
  LeafLetters,
  MemoryJar,
  WishBoat,
  BirthdayClock,
} from "./GardenWidgets";
const wishes = [
  ["Joy", "More days that make you smile for no particular reason."],
  ["Courage", "The confidence to try what you’ve been dreaming about."],
  ["Peace", "Quiet moments that help you feel at home with yourself."],
  ["Adventure", "New places, new experiences, and wonderful surprises."],
  ["Friendship", "People who show up, listen, and celebrate you."],
];
const personal = (text, c) =>
  text
    .replaceAll("{name}", c.name)
    .replaceAll("{shortName}", c.shortName)
    .replaceAll("{sender}", c.sender);
function Photo({ photo, large = false }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [photo?.src]);
  return photo?.src && !bad ? (
    <img
      src={large ? photo.src : photo.thumbnail || photo.src}
      alt={photo.alt}
      width="640"
      height="800"
      loading={large ? "eager" : "lazy"}
      onError={() => setBad(true)}
    />
  ) : (
    <div className="photo-placeholder">
      <span aria-hidden="true">✧</span>
      <small>
        {photo?.src ? "Photo temporarily unavailable" : "Your photo here"}
      </small>
      <p>
        {photo?.src
          ? "Please try again later."
          : "A favourite memory will go here."}
      </p>
    </div>
  );
}
function Music({ music, audioRef, onPlay }) {
  const ownRef = useRef();
  const ref = audioRef || ownRef;
  const [playing, setPlaying] = useState(false),
    [muted, setMuted] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const a = ref.current;
    setPlaying(false);
    setError("");
    return () => {
      if (a) {
        a.pause();
      }
    };
  }, [music?.src]);
  if (!music?.src)
    return <span className="music-empty">♫ A quiet little garden</span>;
  async function toggle() {
    const audio = ref.current;
    try {
      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch {
      setError("Music could not play. Try again.");
    }
  }
  return (
    <div className="music-controls">
      <audio
        ref={ref}
        onPause={() => setPlaying(false)}
        onPlay={() => { setPlaying(true); onPlay?.(); }}
        src={music.src}
        loop
        preload="none"
        onLoadedMetadata={() => {
          if (ref.current) ref.current.volume = 0.35;
        }}
        onError={() => {
          setPlaying(false);
          setError("Music is unavailable right now.");
        }}
      />
      <button className="music" onClick={toggle}>
        {playing
          ? "Ⅱ Pause music"
          : `♫ Play ${music.originalName?.startsWith("October Light") ? "October Light" : "music"}`}
      </button>
      <button
        className="music"
        aria-pressed={muted}
        onClick={() => {
          ref.current.muted = !muted;
          setMuted(!muted);
        }}
      >
        {muted ? "Unmute" : "Mute"}
      </button>
      {error && <small role="status">{error}</small>}
    </div>
  );
}
function Confetti({ burst }) {
  if (!burst) return null;
  return (
    <div className="confetti-layer" key={burst} aria-hidden="true">
      {Array.from({ length: 42 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: ["#8c9f65", "#d6c894", "#ad8562", "#657b50"][i % 4],
            animationDelay: `${(i % 7) * 0.08}s`,
            transform: `rotate(${i * 21}deg)`,
          }}
        />
      ))}
    </div>
  );
}
export async function createKeepsake(content) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot create the keepsake.");
  const reverse=content.keepsakePalette==='green';
  ctx.fillStyle = reverse?"#E3E8D5":"#F3E8D5";
  ctx.fillRect(0, 0, 1200, 1600);
  ctx.strokeStyle = "#526546";
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 50, 1100, 1500);
  ctx.textAlign = "center";
  ctx.fillStyle = reverse?"#49372C":"#153D2C";
  ctx.font = "24px Arial";
  ctx.fillText("THE GARDEN OF OCTOBER — A BIRTHDAY KEEPSAKE", 600, 180);
  ctx.fillStyle = reverse?"#49372C":"#153D2C";
  ctx.font = "64px Georgia";
  ctx.fillText("Happy Birthday,", 600, 330);
  let size = 76;
  do {
    ctx.font = `${size--}px Georgia`;
  } while (ctx.measureText(content.name).width > 980 && size > 18);
  ctx.fillStyle = reverse?"#49372C":"#153D2C";
  ctx.fillText(content.name, 600, 440);
  const text = personal(content.finalMessage, content);
  function wrap(size) {
    ctx.font = `${size}px Georgia`;
    const lines = [];
    for (const paragraph of text.split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (ctx.measureText(word).width > 960) {
          if (line) {
            lines.push(line);
            line = "";
          }
          let part = "";
          for (const ch of word) {
            if (ctx.measureText(part + ch).width > 960) {
              lines.push(part);
              part = ch;
            } else part += ch;
          }
          line = part;
          continue;
        }
        const attempt = line ? line + " " + word : word;
        if (ctx.measureText(attempt).width > 960) {
          lines.push(line);
          line = word;
        } else line = attempt;
      }
      lines.push(line);
    }
    return lines;
  }
  let sizeBody = 38,
    lines = wrap(sizeBody);
  while (lines.length * sizeBody * 1.5 > 650 && sizeBody > 10) {
    sizeBody--;
    lines = wrap(sizeBody);
  }
  ctx.font = `${sizeBody}px Georgia`;
  let y = 660;
  ctx.fillStyle = reverse?"#49372C":"#153D2C";
  for (const line of lines) {
    ctx.fillText(line, 600, y);
    y += sizeBody * 1.5;
  }
  let senderSize = 30;
  ctx.font = `${senderSize}px Georgia`;
  while (
    ctx.measureText("— " + content.sender).width > 960 &&
    senderSize > 10
  ) {
    senderSize--;
    ctx.font = `${senderSize}px Georgia`;
  }
  ctx.fillText("— " + content.sender, 600, 1430);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not create the card. Please retry.")),
      "image/png",
    ),
  );
}
const starPoints = [
  [18, 26],
  [48, 15],
  [76, 35],
  [66, 78],
  [25, 75],
];
export default function Birthday(props) {
 return props.content.journey?.enabled ? <KeyedBirthday {...props} createKeepsake={createKeepsake}/> : <LegacyBirthday {...props}/>;
}
function LegacyBirthday({ content: c, preview = false, status = "" }) {
  const [opened, setOpened] = useState(false),
    [lit, setLit] = useState([true, true, true]),
    [letter, setLetter] = useState(false),
    [final, setFinal] = useState(false),
    [lightbox, setLightbox] = useState(null),
    [burst, setBurst] = useState(0),
    [night, setNight] = useState(false),
    [motion, setMotion] = useState(
      () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    ),
    [gardenBloomed, setGardenBloomed] = useState(false),
    [lightsDone, setLightsDone] = useState(false),
    [downloadError, setDownloadError] = useState(""),
    [downloading, setDownloading] = useState(false);
  const musicRef = useRef();
  const root = useRef(),
    timer = useRef(),
    nextRef = useRef();
  const namespace = useId().replaceAll(":", "");
  const id = (s) => `${namespace}-${s}`;
  const out = lit.every((v) => !v);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (opened) nextRef.current?.focus();
  }, [opened]);
  useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const listener = (e) => {
      if (e.matches) setMotion(false);
    };
    q?.addEventListener?.("change", listener);
    return () => q?.removeEventListener?.("change", listener);
  }, []);
  useEffect(() => {
    if (!opened || !motion || !("IntersectionObserver" in window)) return;
    const nodes = root.current.querySelectorAll(".scene-reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    nodes.forEach((n) => {
      n.dataset.ready = "true";
      io.observe(n);
    });
    return () => {
      io.disconnect();
      nodes.forEach((n) => delete n.dataset.ready);
    };
  }, [opened, motion]);
  function celebrate() {
    if (
      !motion ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    clearTimeout(timer.current);
    setBurst((v) => v + 1);
    timer.current = setTimeout(() => setBurst(0), 4200);
  }
  function go(s) {
    root.current
      ?.querySelector(`[data-scene="${s}"]`)
      ?.scrollIntoView({
        behavior: motion ? "smooth" : "instant",
        block: "start",
      });
  }
  function reset() {
    setOpened(false);
    setLit([true, true, true]);
    setLetter(false);
    setFinal(false);
    setGardenBloomed(false);
    setLightsDone(false);
    setBurst(0);
    go("welcome");
  }
  async function saveCard() {
    setDownloading(true);
    setDownloadError("");
    try {
      const blob = await createKeepsake(c);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `birthday-garden-${c.shortName.replace(/[^a-z0-9]/gi, "-")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setDownloading(false);
    }
  }
  const photos = c.photos.length
    ? c.photos
    : [0, 1, 2].map((i) => ({
        id: `empty-${i}`,
        caption: [
          "A laugh we’ll want to remember",
          "A place with a story to tell",
          "An ordinary day made special",
        ][i],
        src: "",
      }));
  const formattedDate = c.birthday
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(c.birthday + "T12:00:00Z"))
    : "";
  return (
    <div
      ref={root}
      className="birthday october-garden"
      data-theme={night ? "moonlight" : "daylight"}
      data-motion={motion ? "on" : "off"}
      style={{ "--earth": c.colors.pink, "--moss": c.colors.lavender }}
    >
      <a className="skip-link" href={`#${id("main")}`}>
        Skip to birthday garden
      </a>
      {preview && (
        <div className="preview-ribbon">
          SAVED DRAFT · Your little garden, before it is shared
        </div>
      )}
      <PersonalApology position="top" />
    <header className="site-header">
        <a className="garden-brand" href={`#${id("welcome")}`}>
          <span aria-hidden="true">❧</span>
          <span>
            The Garden
            <br />
            <i>of October.</i>
          </span>
        </a>
        <span className="header-dedication">
          FOR {c.name} · BY {c.sender}
        </span>
        <nav className="experience-settings" aria-label="Garden settings">
          <button
            className="theme-button"
            aria-label={night ? "Switch to daylight" : "Switch to moonlight"}
            onClick={() => setNight((v) => !v)}
          >
            {night ? "☀" : "☾"}
          </button>
          <button
            className="motion-button"
            aria-label={motion ? "Pause animations" : "Resume animations"}
            aria-pressed={!motion}
            onClick={() => setMotion((v) => !v)}
          >
            {motion ? "Ⅱ Pause motion" : "▷ Resume motion"}
          </button>
          <Music music={c.music} audioRef={musicRef} onPlay={() => root.current?.querySelectorAll("video").forEach(v => v.pause())} />
        </nav>
      </header>
      {status && (
        <p className="connection-note" role="status">
          {status}
        </p>
      )}
      <main id={id("main")}>
        <figure className="top-bouquet">
          <img
            src="/birthday-bouquet.jpeg"
            alt={`A birthday bouquet of pink, red and white roses for ${c.name}`}
            width="720"
            height="1280"
            fetchpriority="high"
          />
        </figure>
        <section
          className="garden-hero"
          id={id("welcome")}
          data-scene="welcome"
        >
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="small-leaf" aria-hidden="true">
                ❧
              </span>{" "}
              A BIRTHDAY KEEPSAKE · {formattedDate || "MADE JUST FOR YOU"}
            </p>
            <h1>
              {opened ? (
                <>
                  Happy Birthday,
                  <br />
                  <em>{c.shortName}.</em>
                </>
              ) : (
                <>
                  For {c.shortName}.<br />
                  For joy.
                  <br />
                  For everything
                  <br />
                  <em>still to bloom.</em>
                </>
              )}
            </h1>
            <p className="hero-description">
              {opened
                ? "A little place where the wishes are yours, the light is gentle, and every small thing has been made with care."
                : c.intro}
            </p>
            {opened ? (
              <button
                className="primary"
                ref={nextRef}
                onClick={() => go(c.blessings?.enabled ? "blessings" : "plant")}
              >
                {c.blessings?.enabled ? "Begin with a little blessing" : "Let’s plant a little happiness"} <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <p className="hero-hint">
                <span aria-hidden="true">↗</span> There’s a little world behind
                that door.
              </p>
            )}
            <div className="hero-signature">
              a small garden of good wishes,
              <br />
              <strong>from {c.sender}.</strong>
            </div>
          </div>
          <div className="hero-garden-art">
            <span className="handwritten-note">
              some gifts aren’t things.
              <br />
              <em>they’re little places to feel happy.</em>
            </span>
            <GreenhouseGate
              opened={opened}
              onOpen={() => {
                setOpened(true);
                celebrate();
              }}
              name={c.name}
            />
          </div>
          <BotanicalSprig className="hero-sprig" />
          <span className="hero-edition">
            A GIFT TO RETURN TO, WHENEVER YOU LIKE.
          </span>
        </section>
        <section className="date-ribbon">
          <span className="ribbon-number">
            {c.birthday
              ? new Date(c.birthday + "T12:00:00Z").getUTCDate()
              : "❧"}
          </span>
          <div>
            <span className="eyebrow">{formattedDate || "YOUR BIRTHDAY"}</span>
            <p>
              One very special day.
              <br />
              One very special human.
            </p>
          </div>
          <BirthdayClock birthday={c.birthday} timeZone={c.timezone} />
          <span className="ribbon-leaf" aria-hidden="true">
            ❧
          </span>
        </section>
        {opened && (
          <>
            <nav className="garden-nav" aria-label="Birthday chapters">
              {c.blessings?.enabled && <button onClick={() => go("blessings")}>The blessings</button>}
              <button onClick={() => go("plant")}>01 · The wishes</button>
              <button onClick={() => go("lights")}>
                02 · The little lights
              </button>
              {c.sections.memories && (
                <button onClick={() => go("memories")}>03 · The moments</button>
              )}
              {c.sections.letter && (
                <button onClick={() => setLetter(true)}>04 · The letter</button>
              )}
              <span>
                {[gardenBloomed, lightsDone, out, final].filter(Boolean).length}
                /4 little wonders
              </span>
            </nav>
            <DivineBlessings value={c.blessings} fullName={c.name} name={c.shortName} sender={c.sender} motion={motion} onContinue={() => go("plant")} onVideoPlay={() => musicRef.current?.pause()} />
            <section
              className="garden-section plant-section scene-reveal"
              id={id("plant")}
              data-scene="plant"
            >
              <div className="chapter-marker">
                <span>01 / GOOD THINGS TAKE A LITTLE CARE</span>
                <i />
              </div>
              <div className="section-intro">
                <span className="botanical-symbol" aria-hidden="true">
                  ❧
                </span>
                <h2>
                  Let’s grow something
                  <br />
                  <em>lovely for you.</em>
                </h2>
                <p>
                  Choose a seed. Give it a little rain.
                  <br />
                  Not everything beautiful has to arrive all at once.
                </p>
              </div>
              <WishGarden
                onBloom={() => {
                  setGardenBloomed(true);
                  celebrate();
                }}
              />
            </section>
            {c.sections.constellation && (
              <section className="leaves-section scene-reveal">
                <div className="garden-section">
                  <div className="chapter-marker">
                    <span>WORDS FOR THE DAYS AHEAD</span>
                    <i />
                  </div>
                  <div className="leaves-heading">
                    <h2>
                      A few wishes,
                      <br />
                      <em>pressed between leaves.</em>
                    </h2>
                    <p>
                      Turn one over.
                      <br />
                      There’s a little thought on the other side.
                    </p>
                  </div>
                  <LeafLetters />
                </div>
              </section>
            )}
            <section
              className="lantern-section scene-reveal"
              id={id("lights")}
              data-scene="lights"
            >
              <div className="garden-section">
                <div className="chapter-marker">
                  <span>02 / KEEP A LITTLE LIGHT FOR LATER</span>
                  <i />
                </div>
                <div className="section-intro">
                  <span className="lantern-star" aria-hidden="true">
                    ✧
                  </span>
                  <h2>
                    Some kinds of light
                    <br />
                    <em>are worth keeping.</em>
                  </h2>
                  <p>
                    Gather the fireflies, one gentle tap at a time.
                    <br />A little brightness for the days that need it.
                  </p>
                </div>
                <FireflyJar
                  onComplete={() => {
                    setLightsDone(true);
                    celebrate();
                  }}
                />
              </div>
            </section>
            <section className="garden-section cake-section scene-reveal">
              <div className="garden-cake-layout">
                <div>
                  <p className="eyebrow">
                    A BIRTHDAY STILL NEEDS A LITTLE CAKE
                  </p>
                  <h2>
                    One quiet moment.
                    <br />
                    <em>One little wish.</em>
                  </h2>
                  <p className="body-copy">
                    Close your eyes, if you like.
                    <br />
                    Think of something that would make your heart happy.
                  </p>
                  <button
                    className="primary"
                    disabled={out}
                    onClick={() => {
                      setLit([false, false, false]);
                      celebrate();
                    }}
                  >
                    {out
                      ? "Your wish is on its way"
                      : "Make a wish & blow out the candles"}
                  </button>
                  <p className="wish-status" role="status">
                    {out
                      ? `May your wish come true, ${c.shortName}.`
                      : "Or tap the candles, one wish at a time."}
                  </p>
                  {out && (
                    <button
                      className="text-button"
                      onClick={() => setLit([true, true, true])}
                    >
                      Relight the candles ↻
                    </button>
                  )}
                </div>
                <div className="woodland-cake-stage">
                  <BotanicalSprig className="cake-sprig" />
                  <div className="woodland-cake">
                    <div className="cake-icing" />
                    <div className="cake-leaf-decoration" aria-hidden="true">
                      ❧ &nbsp; ❧
                    </div>
                    <div className="cake-candles">
                      {lit.map((value, i) => (
                        <button
                          key={i}
                          className={`candle ${value ? "lit" : "out"}`}
                          aria-label={`Blow out candle ${i + 1}`}
                          disabled={!value}
                          onClick={() => {
                            setLit((v) =>
                              v.map((x, j) => (j === i ? false : x)),
                            );
                            if (lit.filter(Boolean).length === 1) celebrate();
                          }}
                        >
                          <span className="flame" />
                          <span className="candle-stick" />
                        </button>
                      ))}
                    </div>
                    <span className="cake-tag" aria-hidden="true">
                      for {c.shortName}, with good wishes.
                    </span>
                  </div>
                  <div className="wooden-cake-stand" />
                  <span className="cake-handwritten">
                    make it a lovely one ↙
                  </span>
                </div>
              </div>
            </section>
            {c.sections.memories && (
              <section
                className="memory-section scene-reveal"
                id={id("memories")}
                data-scene="memories"
              >
                <div className="garden-section">
                  <div className="chapter-marker">
                    <span>03 / A PLACE FOR THE STORIES WE KEEP</span>
                    <i />
                  </div>
                  <div className="memory-heading">
                    <h2>
                      Some days become
                      <br />
                      <em>little forevers.</em>
                    </h2>
                    <p>
                      {c.photos.length
                        ? "Your real photographs, and the stories that belong to them."
                        : "These pages are waiting for your real photos and stories."}
                      <br />
                      No perfect poses required. Just something worth
                      remembering.
                    </p>
                  </div>
                  <div className="memory-grid">
                    {photos.map((p, i) => (
                      <figure className="memory-card" key={p.id}>
                        <div className="memory-page-label">
                          PAGE {String(i + 1).padStart(2, "0")}{" "}
                          <span aria-hidden="true">❧</span>
                        </div>
                        {p.src ? (
                          <button
                            className="photo-button"
                            aria-label={`Open photo: ${p.alt}`}
                            onClick={() => setLightbox(i)}
                          >
                            <Photo photo={p} />
                          </button>
                        ) : (
                          <div className="memory-placeholder">
                            <BotanicalSprig variant={i % 2} />
                            <span>Your photo here</span>
                            <small>Add a real moment and its story.</small>
                          </div>
                        )}
                        <figcaption>
                          {p.caption}
                          {p.date && <small>{p.date}</small>}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  <MemoryJar />
                </div>
              </section>
            )}
            <section className="garden-section wish-boat-section scene-reveal">
              <WishBoat />
            </section>
            {c.sections.letter && (
              <section className="letter-section scene-reveal">
                <div className="garden-section garden-letter-layout">
                  <div className="letter-intro">
                    <p className="eyebrow">
                      04 / FROM {c.sender}, WITH WARM WISHES
                    </p>
                    <h2>
                      Not just a birthday
                      <br />
                      message.
                      <br />
                      <em>A little letter to keep.</em>
                    </h2>
                    <p className="body-copy">
                      Some things deserve more than a passing notification.
                      <br />
                      These words have a little more room.
                    </p>
                    <button className="primary" onClick={() => setLetter(true)}>
                      Unfold your letter <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                  <button
                    className="pressed-flower-letter"
                    aria-label="Open your birthday letter"
                    onClick={() => setLetter(true)}
                  >
                    <span className="paper-fold" />
                    <BotanicalSprig />
                    <span className="letter-string" />
                    <span className="letter-wax" aria-hidden="true">
                      K
                    </span>
                    <span className="letter-address">
                      For {c.shortName},<small>{formattedDate}</small>
                    </span>
                    <span className="letter-postage" aria-hidden="true">
                      HANDLE
                      <br />
                      WITH CARE
                    </span>
                  </button>
                </div>
              </section>
            )}
            <section className="garden-finale scene-reveal">
              <BotanicalSprig className="finale-branch left-branch" />
              <BotanicalSprig className="finale-branch right-branch" />
              <span className="eyebrow">
                SOME GIFTS FIT IN A BOX. THIS ONE IS A PLACE TO RETURN TO.
              </span>
              <h2>
                May there always be
                <br />
                something beautiful
                <br />
                <em>still to bloom.</em>
              </h2>
              {!final ? (
                <button
                  className="primary"
                  onClick={() => {
                    setFinal(true);
                    celebrate();
                  }}
                >
                  One last little wish for you ↗
                </button>
              ) : (
                <div className="final-message-panel">
                  <p className="final-message">{personal(c.finalMessage, c)}</p>
                  <p className="final-sender">
                    With warm wishes,<strong>{c.sender}</strong>
                  </p>
                  <div className="final-actions">
                    <button
                      className="primary"
                      disabled={downloading}
                      onClick={saveCard}
                    >
                      {downloading
                        ? "Creating your keepsake…"
                        : "Save your birthday keepsake ↗"}
                    </button>
                    <button className="text-button" onClick={celebrate}>
                      A little shower of petals ❧
                    </button>
                    <button className="text-button" onClick={reset}>
                      Walk through the garden again ↶
                    </button>
                  </div>
                  {downloadError && <p role="alert">{downloadError}</p>}
                </div>
              )}
              <span className="finale-date">
                {formattedDate} · MADE FOR {c.name}
              </span>
            </section>
          </>
        )}
      </main>
      <footer>
        <a className="garden-brand" href={`#${id("welcome")}`}>
          <span aria-hidden="true">❧</span>
          <span>
            The Garden <i>of October.</i>
          </span>
        </a>
        <p>
          For {c.name}. From {c.sender}.<br />A small garden of good wishes.
        </p>
        {!preview && (
          <a href="/admin" className="admin-link">
            Personalise this keepsake ↗
          </a>
        )}
      </footer>
    <PersonalApology position="bottom" />
      <Confetti burst={burst} />
      {letter && (
        <Modal
          title={`A letter from ${c.sender}`}
          onClose={() => setLetter(false)}
          wide
        >
          <article className="garden-letter">
            <span className="letter-date">
              {formattedDate} · A LITTLE NOTE FOR {c.shortName.toUpperCase()}
            </span>
            <div className="letter-body">
              {personal(c.letter, c)
                .split("\n\n")
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
            <span className="letter-closing-sprig" aria-hidden="true">
              ❧
            </span>
          </article>
        </Modal>
      )}
      {lightbox !== null && (
        <Modal
          title="A favourite memory"
          onClose={() => setLightbox(null)}
          wide
        >
          <div className="lightbox">
            <Photo photo={photos[lightbox]} large />
            <p>{photos[lightbox].caption}</p>
            <div className="button-row">
              <button
                onClick={() =>
                  setLightbox((lightbox - 1 + photos.length) % photos.length)
                }
              >
                ← Previous
              </button>
              <span>
                {lightbox + 1} / {photos.length}
              </span>
              <button
                onClick={() => setLightbox((lightbox + 1) % photos.length)}
              >
                Next →
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
