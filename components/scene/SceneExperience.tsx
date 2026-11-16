"use client";

import { useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { Hotspot } from "@/data/eraStories";
import { sceneFor } from "@/data/scenes";
import { SCENE, STORY } from "@/data/site";
import { useNarration } from "@/lib/narration";
import { ListenButton } from "../ListenButton";
import { drawScene, type SceneCamera } from "./sceneEngine";

type SceneExperienceProps = {
  eraId: string;
  eraName: string;
  period: string;
  hotspot: Hotspot;
  index: number;
  count: number;
  onClose: () => void;
  onNext: () => void;
};

const INTRO_MS = 3200;

/** Splits the card text into subtitle-sized beats. */
function beats(text: string) {
  const sentences = text.match(/[^.!?…]+[.!?…»"]*\s*/g) ?? [text];
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last && (last + s).length < 90) out[out.length - 1] = last + s;
    else out.push(s);
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Wind over the steppe, synthesized: filtered noise that swells and fades. */
function startWind() {
  try {
    const ac = new AudioContext();
    const buffer = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
      data[i] = last * 3.2;
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    const gain = ac.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.5, ac.currentTime + 1.5);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.13;
    const depth = ac.createGain();
    depth.gain.value = 220;
    lfo.connect(depth).connect(filter.frequency);
    source.connect(filter).connect(gain).connect(ac.destination);
    source.start();
    lfo.start();
    return () => {
      gain.gain.cancelScheduledValues(ac.currentTime);
      gain.gain.setTargetAtTime(0, ac.currentTime, 0.15);
      setTimeout(() => void ac.close(), 600);
    };
  } catch {
    return () => {};
  }
}

/**
 * Full-screen "you are there" view for one story hotspot: an animated scene
 * with depth, the card's text delivered as subtitles, wind, and narration.
 */
export function SceneExperience({ eraId, eraName, period, hotspot, index, count, onClose, onNext }: SceneExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const { stop: stopNarration } = useNarration();
  const lines = useMemo(() => beats(hotspot.text), [hotspot.text]);
  /** -1 is the title card, `lines.length` the closing card. */
  const [step, setStep] = useState(-1);
  const [sound, setSound] = useState(true);
  const stepRef = useRef(step);
  const scene = sceneFor(eraId, index, hotspot.kind);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const close = useCallback(() => {
    stopNarration();
    onClose();
  }, [onClose, stopNarration]);

  // Lock the page behind, and give the keyboard the same controls as tapping.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        close();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setStep((s) => Math.min(lines.length, s + 1));
      } else if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [close, lines.length]);

  // Subtitles advance on their own, paced by how long each takes to read.
  useEffect(() => {
    if (step >= lines.length) return;
    const ms = step < 0 ? INTRO_MS : Math.max(3800, lines[step].length * 62);
    const timer = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(timer);
  }, [step, lines]);

  useEffect(() => {
    if (!sound) return;
    return startWind();
  }, [sound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (reduceMotion) paint(4000);
    };
    const camera: SceneCamera = { x: -14, px: 0, py: 0 };
    const paint = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(ctx, width, height, time, camera, scene);
    };
    const start = performance.now();
    let last = start;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Each subtitle is a new "shot": the camera drifts on to a fresh spot.
      const shot = Math.max(0, stepRef.current);
      const goal = -14 + ((shot * 13) % 34) + Math.sin(now / 5200) * 3;
      const ease = 1 - Math.exp(-dt * 0.9);
      camera.x += (goal - camera.x) * ease;
      camera.px += (pointer.current.x - camera.px) * (1 - Math.exp(-dt * 4));
      camera.py += (pointer.current.y - camera.py) * (1 - Math.exp(-dt * 4));
      paint(now - start);
    };
    resize();
    window.addEventListener("resize", resize);
    if (!reduceMotion) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [scene, reduceMotion]);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    pointer.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: (e.clientY / window.innerHeight) * 2 - 1,
    };
  };

  const ended = step >= lines.length;
  const iconButton =
    "grid size-10 place-items-center rounded-full border border-white/15 bg-black/40 text-white/85 backdrop-blur transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={hotspot.title}
      onPointerMove={onPointerMove}
      className="scene-enter fixed inset-0 z-[90] overflow-hidden bg-black text-white"
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />

      {/* Tap zones: left half goes back, right half goes on */}
      {!ended && (
        <div className="absolute inset-0 flex">
          <button type="button" tabIndex={-1} aria-label={SCENE.previous} className="h-full w-1/3 cursor-w-resize" onClick={() => setStep((s) => Math.max(0, s - 1))} />
          <button type="button" tabIndex={-1} aria-label={SCENE.next} className="h-full flex-1 cursor-e-resize" onClick={() => setStep((s) => s + 1)} />
        </div>
      )}

      {/* Cinema bars */}
      <div aria-hidden className="scene-bar-top pointer-events-none absolute inset-x-0 top-0 h-[9vh] bg-black" />
      <div aria-hidden className="scene-bar-bottom pointer-events-none absolute inset-x-0 bottom-0 h-[9vh] bg-black" />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
            {period} · {eraName}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="grid size-5 place-items-center rounded-full bg-gold font-mono text-[10px] font-bold text-navy-950">{index + 1}</span>
            {STORY.hotspotKinds[hotspot.kind]}
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] tracking-wide text-white/60 uppercase">{SCENE.badge}</span>
          </p>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <ListenButton target="scene-full-text" className="!border-white/20 !bg-black/40 !py-2 backdrop-blur" />
          <button type="button" onClick={() => setSound((s) => !s)} aria-label={sound ? SCENE.soundOff : SCENE.soundOn} aria-pressed={sound} className={iconButton}>
            {sound ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
          </button>
          <button ref={closeRef} type="button" onClick={close} aria-label={STORY.close} className={iconButton}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      {/* The whole text, for narration and screen readers */}
      <div id="scene-full-text" className="sr-only">
        <h2>{hotspot.title}</h2>
        <p>{hotspot.text}</p>
      </div>

      {step < 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
          <div className="scene-title max-w-3xl">
            {hotspot.place && <p className="font-mono text-xs tracking-[0.3em] text-gold-soft uppercase">{hotspot.place}</p>}
            <p className="mt-3 font-serif text-4xl leading-tight font-bold text-balance drop-shadow-[0_4px_30px_rgb(0_0_0/0.9)] sm:text-6xl">
              {hotspot.title}
            </p>
            <p className="mt-6 text-xs text-white/60">{SCENE.hint}</p>
          </div>
        </div>
      )}

      {step >= 0 && !ended && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[9vh] px-5 pb-6 sm:pb-10">
          <div className="mx-auto max-w-3xl">
            <p
              key={step}
              className="scene-line text-center font-serif text-xl leading-snug text-balance text-white drop-shadow-[0_2px_14px_rgb(0_0_0/1)] sm:text-3xl"
            >
              {lines[step]}
            </p>
            <div className="mx-auto mt-6 flex max-w-md gap-1.5">
              {lines.map((_, i) => (
                <span key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
                  <span
                    className={i === step ? "scene-progress block h-full bg-gold" : `block h-full ${i < step ? "bg-gold" : ""}`}
                    style={i === step ? { animationDuration: `${Math.max(3800, lines[step].length * 62)}ms` } : undefined}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 grid place-items-center bg-black/55 px-6 text-center backdrop-blur-[2px]">
          <div className="scene-title max-w-xl">
            <p className="font-serif text-4xl font-bold sm:text-5xl">{SCENE.endTitle}</p>
            <p className="mt-3 font-serif text-lg text-gold-soft italic">{hotspot.title}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep(-1)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <RotateCcw className="size-4" aria-hidden />
                {SCENE.replay}
              </button>
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    stopNarration();
                    onNext();
                  }}
                  className="btn-gold group inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {SCENE.nextScene}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              )}
            </div>
            <button type="button" onClick={close} className="mt-6 text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
              {SCENE.backToMap}
            </button>
          </div>
        </div>
      )}

      {step >= 0 && !ended && (
        <div className="absolute inset-y-0 right-3 hidden items-center sm:flex">
          <button type="button" onClick={() => setStep((s) => s + 1)} aria-label={SCENE.next} className={iconButton}>
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      )}
      {step > 0 && !ended && (
        <div className="absolute inset-y-0 left-3 hidden items-center sm:flex">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label={SCENE.previous} className={iconButton}>
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
