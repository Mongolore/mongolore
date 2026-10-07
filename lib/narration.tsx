"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage, type Lang } from "./i18n";

/**
 * On-demand read-aloud, like Wikipedia's "Listen" — nothing plays until a
 * <ListenButton> is pressed. Uses neural voices from /api/tts: a real
 * Mongolian voice (mn-MN-YesuiNeural) and an English one. If the voice
 * service is unreachable, English falls back to the browser's own voice;
 * Mongolian only falls back to a browser voice that is actually Mongolian,
 * never Russian.
 *
 * The text is read from the page after translation settles, so in English
 * mode the English version is spoken.
 */

export type NarrationState = { key: string; status: "loading" | "playing" } | null;

type NarrationContextValue = {
  /** Which block is being read, if any. */
  now: NarrationState;
  /** Set when the AI voice couldn't be reached for the current block. */
  fallbackVoice: boolean;
  /** Reads `el`'s text aloud, replacing anything already playing. */
  play: (key: string, el: HTMLElement) => void;
  stop: () => void;
};

const NarrationContext = createContext<NarrationContextValue | null>(null);
/** Short pieces start playing sooner and keep each TTS request small. */
const CHUNK = 220;

function chunks(text: string): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…»"]*\s*/g) ?? [text];
  const out: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > CHUNK && current) {
      out.push(current.trim());
      current = "";
    }
    current += s;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** The visible text of `el`, minus listen buttons and anything marked `data-listen-skip`. */
function readableText(el: HTMLElement) {
  let text = el.innerText;
  el.querySelectorAll<HTMLElement>("[data-listen-skip]").forEach((skip) => {
    if (skip.innerText) text = text.replace(skip.innerText, " ");
  });
  return text.replace(/\s+/g, " ").trim();
}

/** A browser voice for `lang`, only if one really exists. */
function browserVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  return voices.find((v) => /natural|neural|google|online/i.test(v.name)) ?? voices[0] ?? null;
}

async function fetchAudio(text: string, lang: Lang, signal: AbortSignal): Promise<string> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
    signal,
  });
  if (!res.ok) throw new Error(`tts ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

export function NarrationProvider({ children }: { children: ReactNode }) {
  const { lang, whenReady } = useLanguage();
  const [now, setNow] = useState<NarrationState>(null);
  const [fallbackVoice, setFallbackVoice] = useState(false);

  const langRef = useRef(lang);
  const highlighted = useRef<HTMLElement | null>(null);
  /** Bumped on every stop so a cut-off playback loop knows to quit. */
  const generation = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const highlight = (el: HTMLElement | null) => {
    highlighted.current?.removeAttribute("data-narrating");
    highlighted.current = el;
    el?.setAttribute("data-narrating", "true");
  };

  /** Cuts off whatever is playing without touching React state. */
  const halt = useCallback(() => {
    generation.current++;
    abort.current?.abort();
    audio.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    highlight(null);
  }, []);

  const stop = useCallback(() => {
    halt();
    setNow(null);
  }, [halt]);

  /** Plays one audio clip; resolves when it ends or is cut off. */
  const playClip = (url: string) =>
    new Promise<void>((resolve, reject) => {
      const el = (audio.current ??= new Audio());
      el.src = url;
      el.onended = () => resolve();
      el.onpause = () => resolve();
      el.onerror = () => reject(new Error("audio error"));
      el.play().catch(reject);
    });

  /** Browser speech, used only when the AI voice can't be reached. */
  const speakWithBrowser = (text: string, lang: Lang) =>
    new Promise<void>((resolve) => {
      const voice = browserVoice(lang);
      if (!voice) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });

  const play = useCallback(
    (key: string, el: HTMLElement) => {
      halt();
      const gen = generation.current;
      setNow({ key, status: "loading" });
      setFallbackVoice(false);

      void (async () => {
        await whenReady();
        if (gen !== generation.current) return;
        const text = readableText(el);
        const parts = text ? chunks(text) : [];
        if (parts.length === 0) return setNow(null);

        const lang = langRef.current;
        const controller = new AbortController();
        abort.current = controller;
        highlight(el);

        // Fetch the next clip while the current one plays, so there are no gaps.
        let pending = fetchAudio(parts[0], lang, controller.signal);
        pending.catch(() => {});
        for (let i = 0; i < parts.length; i++) {
          const current = pending;
          if (i + 1 < parts.length) {
            pending = fetchAudio(parts[i + 1], lang, controller.signal);
            pending.catch(() => {});
          }
          try {
            const url = await current;
            if (gen !== generation.current) return URL.revokeObjectURL(url);
            setNow({ key, status: "playing" });
            await playClip(url);
            URL.revokeObjectURL(url);
            if (gen !== generation.current) return;
          } catch {
            if (gen !== generation.current) return;
            setFallbackVoice(true);
            setNow({ key, status: "playing" });
            await speakWithBrowser(parts.slice(i).join(" "), lang);
            break;
          }
        }
        if (gen === generation.current) {
          highlight(null);
          setNow(null);
        }
      })();
    },
    [halt, whenReady],
  );

  // Switching language mid-sentence would read the old text; just stop.
  const [prevLang, setPrevLang] = useState(lang);
  if (lang !== prevLang) {
    setPrevLang(lang);
    setNow(null);
  }
  useEffect(() => halt, [lang, halt]);

  return (
    <NarrationContext.Provider value={{ now, fallbackVoice, play, stop }}>{children}</NarrationContext.Provider>
  );
}

export function useNarration() {
  const ctx = useContext(NarrationContext);
  if (!ctx) throw new Error("useNarration must be used inside <NarrationProvider>");
  return ctx;
}
