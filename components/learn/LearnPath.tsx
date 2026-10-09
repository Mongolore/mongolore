"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Check, Crown, Lock, Map as MapIcon, Star } from "lucide-react";
import Link from "next/link";
import { ERA_STORIES } from "@/data/eraStories";
import { useAuth } from "@/lib/auth";
import { LESSONS, UNITS, type Lesson } from "@/lib/lessons";
import { useProgress } from "@/lib/progress";

/** Unit accent colours, cycling through the palette. */
const ACCENTS = [
  "from-gold/25 border-gold/40 text-gold-soft",
  "from-sky-accent/25 border-sky-accent/40 text-sky-soft",
  "from-orange-400/25 border-orange-400/40 text-orange-200",
  "from-emerald-400/20 border-emerald-400/40 text-emerald-200",
  "from-violet-400/25 border-violet-400/40 text-violet-200",
];

type NodeState = "done" | "current" | "locked";

function LessonNode({ lesson, state, stars, offset }: { lesson: Lesson; state: NodeState; stars: number; offset: number }) {
  const reduce = useReducedMotion();
  const { user, configured, openDialog } = useAuth();
  const Icon = state === "done" ? (stars === 3 ? Crown : Check) : state === "locked" ? Lock : BookOpen;
  const circle = (
    <span
      className={`relative grid size-20 place-items-center rounded-full border-b-[6px] transition ${
        state === "done"
          ? "border-[#a87a23] bg-gold text-navy-950 group-hover:brightness-110"
          : state === "current"
            ? "border-[#a87a23] bg-gold text-navy-950 ring-8 ring-gold/20 group-hover:brightness-110"
            : "border-navy-950 bg-navy-700 text-faint"
      }`}
    >
      <Icon className="size-8" strokeWidth={2.4} aria-hidden />
      {state === "current" && !reduce && (
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-gold/30 [animation-duration:2s]" />
      )}
    </span>
  );

  const label = (
    <span className="mt-2 block text-center">
      <span className={`block text-sm font-semibold ${state === "locked" ? "text-faint" : "text-ink"}`}>{lesson.title}</span>
      {state === "done" ? (
        <span className="mt-0.5 flex justify-center gap-0.5" aria-label={`${stars} од`}>
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`size-3.5 ${s <= stars ? "fill-gold text-gold" : "text-white/20"}`} aria-hidden />
          ))}
        </span>
      ) : (
        <span className="block text-xs text-faint">{lesson.description}</span>
      )}
    </span>
  );

  return (
    <li className="flex justify-center" style={{ transform: `translateX(${offset}px)` }}>
      {state === "locked" ? (
        <div className="flex w-40 flex-col items-center opacity-70" aria-label={`${lesson.title} — түгжээтэй`}>
          {circle}
          {label}
        </div>
      ) : (
        <Link
          href={`/learn/${lesson.id}`}
          onClick={(e) => {
            if (configured && !user) {
              e.preventDefault();
              openDialog("login");
            }
          }}
          className="group relative flex w-40 flex-col items-center rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
        >
          {state === "current" && (
            <motion.span
              initial={reduce ? false : { y: 0 }}
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-11 rounded-xl border-2 border-gold/60 bg-navy-800 px-3 py-1.5 text-xs font-extrabold tracking-wider text-gold uppercase shadow-lg after:absolute after:top-full after:left-1/2 after:-ml-1.5 after:border-[6px] after:border-transparent after:border-t-gold/60"
            >
              Эхлэх
            </motion.span>
          )}
          {circle}
          {label}
        </Link>
      )}
    </li>
  );
}

export function LearnPath() {
  const { progress, ready } = useProgress();
  const firstOpen = LESSONS.findIndex((l) => !progress.completed[l.id]);

  return (
    <ol className="space-y-14">
      {UNITS.map((unit, u) => {
        const accent = ACCENTS[u % ACCENTS.length];
        const unitDone = unit.lessons.every((l) => progress.completed[l.id]);
        return (
          <li key={unit.era.id}>
            <header className={`rounded-3xl border bg-gradient-to-br to-transparent p-5 sm:p-6 ${accent}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs tracking-wide">
                    Бүлэг {u + 1} · {unit.era.period}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">{unit.era.name}</h2>
                  <p className="mt-1 text-sm text-muted">{ERA_STORIES[unit.era.id]?.hook.title}</p>
                </div>
                {unitDone && (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-navy-950" title="Бүлэг дууссан">
                    <Crown className="size-5" aria-hidden />
                  </span>
                )}
              </div>
              <Link
                href={`/map?era=${unit.era.id}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-950/40 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-navy-950/70"
              >
                <MapIcon className="size-3.5" aria-hidden />
                Газрын зураг дээр судлах
              </Link>
            </header>

            <ol className="mt-12 space-y-10">
              {unit.lessons.map((lesson) => {
                const i = LESSONS.indexOf(lesson);
                const state: NodeState = !ready
                  ? i === 0
                    ? "current"
                    : "locked"
                  : progress.completed[lesson.id]
                    ? "done"
                    : i === firstOpen
                      ? "current"
                      : "locked";
                return (
                  <LessonNode
                    key={lesson.id}
                    lesson={lesson}
                    state={state}
                    stars={progress.completed[lesson.id] ?? 0}
                    offset={Math.round(Math.sin(i * 1.1) * 64)}
                  />
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
