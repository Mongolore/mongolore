"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, ChevronLeft, FastForward } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SCENE } from "@/data/site";
import type { StudyCard, StudyVisual } from "@/lib/lessons";
import { LanguageToggle } from "../HeaderActions";
import { ListenButton } from "../ListenButton";
import { SceneBanner } from "../scene/SceneBanner";
import { BackToPath, LearnBackdrop } from "./chrome";
import { MiniMap } from "./MiniMap";

function Visual({ visual }: { visual: StudyVisual }) {
  switch (visual.type) {
    case "scene":
      return (
        <div className="relative aspect-[16/8] overflow-hidden rounded-2xl border border-white/10">
          <SceneBanner scene={visual.scene} />
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] tracking-wide text-white/70 uppercase backdrop-blur">
            {SCENE.badge}
          </span>
        </div>
      );
    case "map":
      return <MiniMap pins={visual.pins} />;
    case "people":
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visual.names.map((name) => (
            <li key={name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/15 font-serif text-base font-bold text-gold-soft ring-1 ring-gold/40">
                {name.trim()[0]}
              </span>
              <span className="text-sm font-medium text-ink">{name}</span>
            </li>
          ))}
        </ul>
      );
    case "timeline":
      return (
        <ol className="relative ml-2 space-y-4 border-l-2 border-gold/30 pl-6">
          {visual.events.map((event) => (
            <li key={event.year + event.text} className="relative">
              <span aria-hidden className="absolute top-1.5 -left-[31px] size-3 rounded-full bg-gold ring-4 ring-navy-900" />
              <p className="font-mono text-sm font-semibold text-gold">{event.year}</p>
              <p className="mt-0.5 text-[15px] leading-relaxed text-ink/90">{event.text}</p>
            </li>
          ))}
        </ol>
      );
  }
}

type StudyDeckProps = {
  cards: StudyCard[];
  heading: string;
  /** Start the questions. */
  onDone: () => void;
};

/** The "learn" half of a lesson: a few cards to read, look at and listen to before being asked anything. */
export function StudyDeck({ cards, heading, onDone }: StudyDeckProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const card = cards[index];
  const last = index === cards.length - 1;
  // Lists read better under their heading; pictures sit above it.
  const textFirst = card.visual?.type === "timeline" || card.visual?.type === "people";

  const forward = useCallback(() => {
    if (last) onDone();
    else setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }, [last, onDone]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        forward();
      } else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, forward]);

  return (
    <div className="flex min-h-dvh flex-col">
      <LearnBackdrop />
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 pt-6 sm:px-8">
        <BackToPath />
        <ol className="flex flex-1 gap-1.5" aria-label={`Карт ${index + 1} / ${cards.length}`}>
          {cards.map((c, i) => (
            <li key={c.title} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? "bg-sky-accent" : "bg-white/12"}`} />
          ))}
        </ol>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
        >
          <FastForward className="size-4" aria-hidden />
          <span className="hidden sm:inline">Асуулт руу</span>
        </button>
        <LanguageToggle />
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 pb-36 sm:px-8">
        <motion.article
          key={index}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-sky-soft uppercase">
              <BookOpen className="size-4" aria-hidden />
              {heading} · Уншиж танилц
            </p>
            <ListenButton target="study-card" />
          </div>

          {card.visual && !textFirst && (
            <div className="mt-5">
              <Visual visual={card.visual} />
            </div>
          )}

          <div id="study-card" className="mt-6">
            <p className="font-mono text-xs tracking-wide text-gold">{card.kicker}</p>
            <h1 className="mt-1.5 font-serif text-3xl leading-tight font-bold text-balance text-ink sm:text-4xl">{card.title}</h1>
            {card.bullets ? (
              <ul className="mt-4 space-y-2.5">
                {card.body.map((line) => (
                  <li key={line} className="flex gap-3 text-[17px] leading-relaxed text-ink/90">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              card.body.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-[17px] leading-relaxed text-ink/90 sm:text-lg">
                  {paragraph}
                </p>
              ))
            )}
            {card.visual && textFirst && (
              <div className="mt-6">
                <Visual visual={card.visual} />
              </div>
            )}
          </div>
        </motion.article>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8">
          <button type="button" onClick={back} disabled={index === 0} className="btn-ghost px-4 disabled:pointer-events-none disabled:opacity-30" aria-label="Өмнөх карт">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <p className="hidden text-sm text-faint sm:block">
            {last ? "Бэлэн үү? Одоо уншсанаа шалгая." : `${index + 1} / ${cards.length}`}
          </p>
          <button type="button" onClick={forward} className={`btn-3d ${last ? "" : "btn-3d-sky"}`}>
            {last ? "Шалгаж үзье" : "Дараах"}
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
