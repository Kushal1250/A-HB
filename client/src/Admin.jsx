import MemoryVideosEditor from './MemoryVideosEditor';
import {assignUploadedSong} from '../../shared/song-plan.js';
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, request, uploadFile } from "./api";
import Birthday from "./Birthday";
import Modal from "./Modal";
import BlessingsEditor from "./BlessingsEditor";
import JourneyEditor from "./JourneyEditor";
import { normaliseBlessings } from "../../shared/blessings.js";
const fields = [
  ["name", "Recipient’s full name"],
  ["shortName", "Short name"],
  ["sender", "Your name"],
  ["birthday", "Birthday date (optional)", "date"],
  ["timezone", "Birthday timezone"],
  ["headline", "Birthday headline"],
  ["intro", "Welcome message", "textarea"],
  ["letter", "Birthday letter", "textarea"],
  ["finalMessage", "Final surprise message", "textarea"],
];
export default function Admin() {
  const [token, setToken] = useState(""),
    [expires, setExpires] = useState(0),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [draft, setDraft] = useState(null),
    [saved, setSaved] = useState(""),
    [revision, setRevision] = useState(0),
    [media, setMedia] = useState([]),
    [configured, setConfigured] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [errors, setErrors] = useState([]),
    [preview, setPreview] = useState(null),
    [progress, setProgress] = useState(null),
    [confirmation, setConfirmation] = useState(null);
  const uploadRef = useRef();
  const dirty = !!draft && JSON.stringify(draft) !== saved;
  function handleError(e) {
    if (e.status === 401) {
      setToken("");
      setPassword("");
    }
    setErrors(e.fields || []);
    setStatus(e.message);
  }
  async function call(path, options = {}) {
    try {
      return await request(path, { token, ...options });
    } catch (e) {
      handleError(e);
      throw e;
    }
  }
  async function refreshMedia(auth = token) {
    const result = await request("/admin/media", { token: auth });
    setMedia(result.media);
    setConfigured(result.configured);
  }
  async function load(auth) {
    const result = await request("/admin/draft", { token: auth });
    if (!draft) {
      setDraft(result.content);
      setSaved(JSON.stringify(result.content));
      setRevision(result.revision);
    }
    setConfigured(result.mediaConfigured);
    await refreshMedia(auth);
  }
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(
      () => {
        setToken("");
        setStatus(
          "Your session expired. Sign in again; your unsaved form is still here.",
        );
      },
      Math.max(0, expires - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [token, expires]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setStatus("Signing in…");
    try {
      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(result.token);
      setExpires(Date.parse(result.expiresAt));
      setPassword("");
      await load(result.token);
      setStatus("Signed in. Edits remain private until you publish.");
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setErrors([]);
    setStatus("Saving your draft…");
    try {
      const result = await call("/admin/draft", {
        method: "PUT",
        body: JSON.stringify({ content: draft, revision }),
      });
      setRevision(result.revision);
      setDraft(result.content);
      setSaved(JSON.stringify(result.content));
      setStatus("Draft saved. The published birthday has not changed.");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setConfirmation(null);
    setBusy(true);
    try {
      const result = await call("/admin/publish", {
        method: "POST",
        body: JSON.stringify({ revision }),
      });
      setRevision(result.revision);
      setStatus(
        "Published! Your saved changes are now visible on the birthday page.",
      );
      await refreshMedia();
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function showPreview() {
    setBusy(true);
    try {
      const result = await call("/admin/preview");
      setPreview(result.content);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function upload(file, destination = "memories") {
    if (!file) return;
    setProgress(0);
    setBusy(true);
    setStatus("Uploading…");
    try {
      const result = await uploadFile(file, token, setProgress);
      await refreshMedia();
      if (destination?.chapterId) {
        if(result.media.kind!=="audio")throw new Error("Choose an MP3 or WAV audio recording.");
        setDraft(d=>({...d,journey:assignUploadedSong(d.journey,destination.chapterId,result.media)}));
      } else if (destination === "blessings") {
        setDraft(d => {
          const b = normaliseBlessings(d.blessings);
          if (result.media.kind === 'video') return {...d, blessings: {...b, videoId: result.media.mediaId}};
          if (result.media.kind !== 'image') return d;
          return {...d, blessings: {...b, photos: [...b.photos, {id:crypto.randomUUID(), mediaId:result.media.mediaId, title:'A devotional moment', caption:'', alt:'Describe this devotional photograph', visible:true}]}};
        });
      } else if(result.media.kind === 'video'){
        setDraft(d=>({...d,memoryVideos:[...(d.memoryVideos||[]),{id:crypto.randomUUID(),mediaId:result.media.mediaId,title:'A little moment to replay',caption:'Some moments are worth pressing play for.',visible:true}]}));
      } else if (result.media.kind === "image") {
        setDraft((d) => ({
          ...d,
          photos: [
            ...d.photos,
            {
              id: crypto.randomUUID(),
              mediaId: result.media.mediaId,
              caption: "A favourite moment",
              alt: "Describe this photo before saving",
              date: "",
            },
          ],
        }));
      } else if (result.media.kind === "audio") setDraft((d) => ({ ...d, musicId: result.media.mediaId }));
      setStatus(
        destination?.chapterId ? "Song assigned to this chapter. Save the draft, then publish to update the birthday page." : "Upload complete. Add a caption and description, then save the draft.",
      );
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
      setProgress(null);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }
  function update(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function photoUpdate(id, key, value) {
    setDraft((d) => ({
      ...d,
      photos: d.photos.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  }
  function move(index, delta) {
    const list = [...draft.photos];
    [list[index], list[index + delta]] = [list[index + delta], list[index]];
    update("photos", list);
  }
  async function removeAsset(id) {
    setConfirmation(null);
    setBusy(true);
    try {
      await call(`/admin/media/${id}`, { method: "DELETE" });
      await refreshMedia();
      setStatus("File deleted.");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  const assets = new Map(media.map((m) => [m.mediaId, m]));
  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="brand">
          The Garden of October ❧
        </Link>
        <Link to="/">View birthday ↗</Link>
      </header>
      <main className="admin-main">
        <p className="eyebrow">YOUR LOCAL BIRTHDAY STUDIO</p>
        <h1>Make it personal.</h1>
        <p className="muted">
          A few thoughtful details make all the difference.
        </p>

        {status && (
          <p role="status" className="notice">
            {status}
          </p>
        )}
        {errors.length > 0 && (
          <ul className="validation-errors">
            {errors.map((e, i) => (
              <li key={i}>
                {e.field}: {e.message}
              </li>
            ))}
          </ul>
        )}
        {!token ? (
          <form onSubmit={login} className="login-panel">
            <h2>Administrator sign in</h2>
            <p>Use the account created with the administrator setup command.</p>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                maxLength="256"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy || !API_BASE}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {draft && (
              <p>
                Your unsaved changes are kept here. Sign in to continue editing.
              </p>
            )}
          </form>
        ) : !draft ? (
          <div>
            <p>Could not load the editor.</p>
            <button onClick={() => load(token).catch(handleError)}>
              Retry loading
            </button>
          </div>
        ) : (
          <>
            <div className="editor-toolbar">
              <span>{dirty ? "● Unsaved changes" : "✓ Draft saved"}</span>
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  try {
                    await call("/auth/logout", { method: "POST" });
                    setToken("");
                    setStatus("Signed out.");
                  } catch {}
                }}
              >
                Sign out
              </button>
            </div>
            <fieldset disabled={busy} className="editor-fieldset">
              <section className="editor-panel">
                <h2>The birthday story</h2>
                <p>
                  Use {"{name}"}, {"{shortName}"}, or {"{sender}"} in the
                  headline, letter, and final message.
                </p>
                <div className="editor-fields">
                  {fields.map(([key, label, type]) => (
                    <label
                      key={key}
                      className={type === "textarea" ? "full-width" : ""}
                    >
                      {label}
                      {type === "textarea" ? (
                        <textarea
                          rows={key === "letter" ? 14 : 3}
                          value={draft[key]}
                          onChange={(e) => update(key, e.target.value)}
                          maxLength={
                            key === "letter"
                              ? 12000
                              : key === "finalMessage"
                                ? 2000
                                : 500
                          }
                        />
                      ) : (
                        <input
                          type={type || "text"}
                          value={draft[key]}
                          onChange={(e) => update(key, e.target.value)}
                          required={key !== "birthday"}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>
              <section className="editor-panel">
                <h2>Colours & chapters</h2>
                <p>
                  Brown sets the warm text accents. Green sets leaves and
                  daylight buttons. Moonlight uses lighter colours for contrast.
                </p>
                <div className="button-row">
                  {Object.entries(draft.colors).map(([key, value]) => (
                    <label key={key}>
                      {key === "pink" ? "Brown accents" : "Green accents"}
                      <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          update("colors", {
                            ...draft.colors,
                            [key]: e.target.value,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                {Object.entries(draft.sections).map(([key, value]) => (
                  <label className="checkbox-label" key={key}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        update("sections", {
                          ...draft.sections,
                          [key]: e.target.checked,
                        })
                      }
                    />
                    Show {key}
                  </label>
                ))}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.noIndex}
                    onChange={(e) => update("noIndex", e.target.checked)}
                  />
                  Ask search engines not to index this page
                </label>
                <small>
                  This local app is available only on this computer. The setting
                  also asks search engines not to index the page.
                </small>
              </section>
              <JourneyEditor onUploadSong={(file,chapterId)=>upload(file,{chapterId})} uploadBusy={busy||!configured} uploadProgress={progress} value={draft.journey} media={media} onChange={j=>update('journey',j)} onLetter={text=>update('letter',text)} />
              <MemoryVideosEditor videos={draft.memoryVideos||[]} media={media} onChange={v=>update('memoryVideos',v)} onUpload={file=>upload(file)} busy={busy||!configured} progress={progress}/>
              <BlessingsEditor value={draft.blessings} media={media} onChange={b => update('blessings', b)} onUpload={file => upload(file, 'blessings')} progress={progress} />
              <section className="editor-panel">
                <h2>Photos & music</h2>
                <p>
                  Photos: JPEG, PNG, WebP up to 8 MB. Music: MP3 or WAV up to 15
                  MB.
                </p>
                {!configured && (
                  <p className="notice">
                    Local uploads are temporarily unavailable. Check the
                    terminal and refresh.
                  </p>
                )}
                <label className="upload-label">
                  Add a photo or music file
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav"
                    disabled={!configured || draft.photos.length >= 30}
                    onChange={(e) => upload(e.target.files[0])}
                  />
                </label>
                {progress !== null && (
                  <label>
                    Upload {progress}%<progress max="100" value={progress} />
                    {progress === 100 && " Processing securely…"}
                  </label>
                )}
                <label>
                  Birthday music (legacy layout)
                  <select
                    value={draft.musicId || ""}
                    onChange={(e) => update("musicId", e.target.value || null)}
                  >
                    <option value="">No music</option>
                    {media
                      .filter((m) => m.kind === "audio")
                      .map((m) => (
                        <option key={m.mediaId} value={m.mediaId}>
                          {m.originalName}
                        </option>
                      ))}
                  </select>
                </label>
                {!draft.photos.length && (
                  <p className="muted">
                    No photos yet. The visitor will see the intentional photo
                    placeholders.
                  </p>
                )}
                {draft.photos.map((p, i) => (
                  <div className="memory-editor" key={p.id}>
                    {assets.get(p.mediaId)?.thumbnail && (
                      <img
                        src={assets.get(p.mediaId).thumbnail}
                        alt="Uploaded memory preview"
                        width="100"
                        height="120"
                      />
                    )}
                    <div className="memory-fields">
                      <label>
                        Caption
                        <input
                          value={p.caption}
                          maxLength="180"
                          onChange={(e) =>
                            photoUpdate(p.id, "caption", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Image description
                        <input
                          value={p.alt}
                          maxLength="250"
                          required
                          onChange={(e) =>
                            photoUpdate(p.id, "alt", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Memory date (optional)
                        <input
                          type="date"
                          value={p.date}
                          onChange={(e) =>
                            photoUpdate(p.id, "date", e.target.value)
                          }
                        />
                      </label>
                      <div className="button-row">
                        <button
                          type="button"
                          disabled={i === 0}
                          aria-label={`Move photo ${i + 1} up`}
                          onClick={() => move(i, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={i === draft.photos.length - 1}
                          aria-label={`Move photo ${i + 1} down`}
                          onClick={() => move(i, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmation({ type: "detach", id: p.id })
                          }
                        >
                          Remove from draft
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <label>
                  Add an existing photo
                  <select
                    value=""
                    disabled={draft.photos.length >= 30}
                    onChange={(e) => {
                      if (e.target.value)
                        update("photos", [
                          ...draft.photos,
                          {
                            id: crypto.randomUUID(),
                            mediaId: e.target.value,
                            caption: "A favourite moment",
                            alt: "Describe this photo before saving",
                            date: "",
                          },
                        ]);
                    }}
                  >
                    <option value="">Choose an uploaded photo</option>
                    {media
                      .filter((m) => m.kind === "image")
                      .map((m) => (
                        <option key={m.mediaId} value={m.mediaId}>
                          {m.originalName}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="asset-list">
                  <h3>Uploaded files</h3>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => refreshMedia().catch(handleError)}
                  >
                    Refresh files & preview links
                  </button>
                  {media.map((m) => (
                    <div className="asset-row" key={m.mediaId}>
                      <span>
                        {m.originalName}{" "}
                        <small>
                          ·{" "}
                          {m.used ? "In saved content" : "Not in saved content"}
                        </small>
                      </span>
                      <button
                        type="button"
                        disabled={
                          m.used ||
                          draft.photos.some((p) => p.mediaId === m.mediaId) ||
                          draft.musicId === m.mediaId ||
                          draft.memoryVideos?.some(v=>v.mediaId===m.mediaId) ||
                          draft.journey?.chapters.some(ch=>ch.trackId===m.mediaId) ||
                          draft.blessings?.videoId === m.mediaId ||
                          draft.blessings?.photos.some(p => p.mediaId === m.mediaId)
                        }
                        onClick={() =>
                          setConfirmation({ type: "delete", id: m.mediaId })
                        }
                      >
                        Delete file
                      </button>
                    </div>
                  ))}
                </div>
                <small>
                  Removing a photo from the draft does not delete its file. Save
                  and publish the removal before deleting the uploaded file.
                </small>
              </section>
            </fieldset>
            <div className="save-bar">
              <button
                className="primary"
                disabled={busy || !dirty}
                onClick={save}
              >
                {busy ? "Working…" : "Save draft"}
              </button>
              <button disabled={busy || dirty} onClick={showPreview}>
                Preview saved draft
              </button>
              <button
                disabled={busy || dirty}
                onClick={() => setConfirmation({ type: "publish" })}
              >
                Publish saved draft ↗
              </button>
            </div>
            {dirty && (
              <p className="muted">Save your draft to preview or publish it.</p>
            )}
          </>
        )}
      </main>
      {preview && (
        <Modal
          title="Saved draft preview"
          onClose={() => setPreview(null)}
          wide
        >
          <Birthday content={preview} preview />
        </Modal>
      )}
      {confirmation && (
        <Modal
          title={
            confirmation.type === "publish"
              ? "Publish this birthday?"
              : confirmation.type === "delete"
                ? "Delete this file?"
                : "Remove this memory?"
          }
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation.type === "publish"
              ? "The saved draft will replace the birthday page that visitors see."
              : confirmation.type === "delete"
                ? "This permanently deletes the uploaded file from your local data folder."
                : "The photo will be removed from this draft. Its uploaded file will be kept."}
          </p>
          <div className="button-row">
            <button onClick={() => setConfirmation(null)}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                if (confirmation.type === "publish") publish();
                else if (confirmation.type === "delete")
                  removeAsset(confirmation.id);
                else {
                  update(
                    "photos",
                    draft.photos.filter((p) => p.id !== confirmation.id),
                  );
                  setConfirmation(null);
                }
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
