import { useEffect, useState } from "react";
import defaults from "../../shared/defaults.json";
import { defaultJourney, newLetter } from "../../shared/journey.js";
import Birthday from "./Birthday";
import { API_BASE, request } from "./api";
export default function PublicPage() {
  const [content, setContent] = useState({ ...defaults, letter:newLetter, music: null, journey:defaultJourney }),
    [status, setStatus] = useState(
      API_BASE ? "Loading your birthday story…" : "",
    );
  useEffect(() => {
    let alive = true;
    let controller;
    async function load() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        if (!API_BASE) return;
        const data = await request("/birthday", { signal: controller.signal });
        if (alive) {
          setContent(data.content);
          setStatus("");
        }
      } catch {
        if (alive)
          setStatus(
            "Showing the original birthday wishes. Personal updates are temporarily unavailable.",
          );
      } finally {
        clearTimeout(timeout);
      }
    }
    load();
    const timer = setInterval(load, 8 * 60 * 1000);
    return () => {
      alive = false;
      controller?.abort();
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    document.title = `The Garden of October — For ${content.shortName}`;
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute(
        "content",
        content.noIndex ? "noindex,nofollow" : "index,follow",
      );
  }, [content]);
  return <Birthday content={content} status={status} />;
}
