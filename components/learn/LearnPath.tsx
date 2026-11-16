"use client";

import { ArrowRight, BookOpen, Check, Crown, Lock, Map as MapIcon, NotebookPen, Play, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { ERAS } from "@/data/eras";
import { ERA_STORIES } from "@/data/eraStories";
import { sceneFor } from "@/data/scenes";
import { useAuth } from "@/lib/auth";
import { LESSONS, UNITS, type Lesson } from "@/lib/lessons";
import { useMistakes } from "@/lib/mistakes";
import { useProgress } from "@/lib/progress";
import { SceneBanner } from "../scene/SceneBanner";

type NodeState = "done" | "current" | "locked";

const eraScene = (eraId: string) => sceneFor(eraId, 0, ERA_STORIES[eraId].hotspots[0].kind);

/** Lessons need an account when sign-in is set up: a click opens the login dialog instead. */
function useLessonGate() {
  const { user, configured, openDialog } = useAuth();
  return (e: MouseEvent) => {
    if (configured && !user) {
      e.preventDefault();
      openDialog("login");
    }
  };
}

/** Where the learner left off, as one big button — no hunting down the path. */
export function ContinueCard() {
  const { progress, ready } = useProgress();
  const gate = useLessonGate();
  const done = LESSONS.filter((l) => progress.completed[l.id]).length;
  const lesson = LESSONS.find((l) => !progress.completed[l.id]);

  if (!ready) return <div className="h-56 animate-pulse rounded-3xl bg-white/5" />;

  if (!lesson) {
    return (
      <section className="rounded-3xl border border-gold/40 bg-gold/[0.07] p-6 text-center sm:p-8">
        <Crown className="mx-auto size-12 text-gold" aria-hidden />
        <h2 className="mt-3 font-serif text-3xl font-bold text-ink">Бүх хичээлийг дуусгалаа!</h2>
        <p className="mt-2 text-muted">Хүннүгээс өнөөг хүртэлх {LESSONS.length} хичээл. Одоо гурван одтой болгож, алдаагаа давтаарай.</p>
      </section>
    );
  }

  const era = ERAS.find((e) => e.id === lesson.eraId)!;
  return (
    <section aria-labelledby="continue-title" className="relative isolate overflow-hidden rounded-3xl border border-gold/40 shadow-[0_30px_80px_-40px_rgb(232_176_75/0.6)]">
      <div className="absolute inset-0 -z-10">
        <SceneBanner scene={eraScene(era.id)} />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/10" />
      </div>
      <div className="flex min-h-56 flex-col justify-end p-6 sm:p-8">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          {done === 0 ? "Эндээс эхэл" : "Үргэлжлүүлэх"} · {done}/{LESSONS.length} хичээл
        </p>
        <h2 id="continue-title" className="mt-2 font-serif text-3xl leading-tight font-bold text-ink sm:text-4xl">
          {era.name}
        </h2>
        <p className="mt-1 text-ink/85">
          {lesson.index + 1}-р хичээл · {lesson.title} — {lesson.description}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link href={`/learn/${lesson.id}`} onClick={gate} className="btn-3d">
            <Play className="size-5 fill-current" aria-hidden />
            {done === 0 ? "Эхлэх" : "Үргэлжлүүлэх"}
          </Link>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <BookOpen className="size-4" aria-hidden /> Уншаад → шалгаад → алдаагаа зас
          </p>
        </div>
      </div>
    </section>
  );
}

/** The mistake notebook at a glance, linking to revision. */
export function NotebookCard() {
  const { notebook } = useMistakes();
  const count = notebook.open.length;
  return (
    <Link
      href="/learn/review"
      className={`group flex items-center gap-4 rounded-3xl border p-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent sm:p-5 ${
        count > 0 ? "border-rose-400/35 bg-rose-400/[0.06] hover:border-rose-400/60" : "border-white/10 bg-white/[0.03] hover:border-white/25"
      }`}
    >
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${count > 0 ? "bg-rose-400/15 text-rose-200" : "bg-emerald-400/10 text-emerald-300"}`}>
        {count > 0 ? <NotebookPen className="size-6" aria-hidden /> : <Sparkles className="size-6" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-lg font-bold text-ink">Алдааны дэвтэр</span>
        <span className="block text-sm text-muted">
          {count > 0 ? `${count} алдаа засахыг хүлээж байна — давтаад арилга.` : `Засах алдаа алга. Нийт ${notebook.fixed} алдаа зассан.`}
        </span>
      </span>
      {count > 0 && (
        <span className="hidden rounded-full bg-rose-400 px-3 py-1 text-sm font-extrabold text-navy-950 tabular-nums sm:block">{count}</span>
      )}
      <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-ink" aria-hidden />
    </Link>
  );
}

function LessonTile({ lesson, state, stars }: { lesson: Lesson; state: NodeState; stars: number }) {
  const gate = useLessonGate();
  const body = (
    <>
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-2xl border-b-4 ${
          state === "locked" ? "border-navy-950 bg-navy-700 text-faint" : "border-[#a87a23] bg-gold text-navy-950"
        }`}
      >
        {state === "done" ? (
          stars === 3 ? <Crown className="size-5" aria-hidden /> : <Check className="size-5" strokeWidth={3} aria-hidden />
        ) : state === "locked" ? (
          <Lock className="size-4.5" aria-hidden />
        ) : (
          <Play className="size-5 fill-current" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-bold ${state === "locked" ? "text-faint" : "text-ink"}`}>
          {lesson.index + 1}. {lesson.title}
        </span>
        {state === "done" ? (
          <span className="mt-0.5 flex gap-0.5" aria-label={`${stars} од`}>
            {[1, 2, 3].map((s) => (
              <Star key={s} className={`size-3.5 ${s <= stars ? "fill-gold text-gold" : "text-white/20"}`} aria-hidden />
            ))}
          </span>
        ) : (
          <span className="block truncate text-xs text-faint">{state === "current" ? "Эхлэхэд бэлэн" : lesson.description}</span>
        )}
      </span>
    </>
  );
  const shell = "flex h-full items-center gap-3 rounded-2xl border p-3 text-left";

  if (state === "locked") {
    return (
      <div className={`${shell} border-white/5 bg-white/[0.02] opacity-70`} aria-label={`${lesson.title} — түгжээтэй`}>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={`/learn/${lesson.id}`}
      onClick={gate}
      className={`${shell} transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent ${
        state === "current"
          ? "border-gold/60 bg-gold/10 shadow-[0_12px_30px_-16px_rgb(232_176_75/0.9)] hover:bg-gold/15"
          : "border-white/10 bg-white/[0.03] hover:border-white/30"
      }`}
    >
      {body}
    </Link>
  );
}

/** Every era as a unit card: its scene, its three lessons, and how far the learner has got. */
export function LearnPath() {
  const { progress, ready } = useProgress();
  const firstOpen = LESSONS.findIndex((l) => !progress.completed[l.id]);

  return (
    <ol className="space-y-5">
      {UNITS.map((unit, u) => {
        const finished = unit.lessons.filter((l) => progress.completed[l.id]).length;
        const unitDone = finished === unit.lessons.length;
        const unitLocked = ready ? firstOpen !== -1 && LESSONS.indexOf(unit.lessons[0]) > firstOpen : u > 0;
        return (
          <li key={unit.era.id}>
            <article className={`overflow-hidden rounded-3xl border bg-navy-950/40 transition ${unitLocked ? "border-white/5" : "border-white/10"}`}>
              <div className={`relative h-28 sm:h-32 ${unitLocked ? "opacity-45 grayscale" : ""}`}>
                <SceneBanner scene={eraScene(unit.era.id)} still />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/35 to-transparent" />
                <p className="absolute top-3 left-4 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[11px] tracking-wide text-gold-soft backdrop-blur">
                  Бүлэг {u + 1} · {unit.era.period}
                </p>
                <p
                  className={`absolute top-3 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ${
                    unitDone ? "bg-gold text-navy-950" : "bg-black/45 text-ink"
                  }`}
                >
                  {unitDone ? <Crown className="size-3.5" aria-hidden /> : unitLocked ? <Lock className="size-3.5" aria-hidden /> : null}
                  {finished}/{unit.lessons.length}
                </p>
              </div>
              <div className="-mt-9 px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="relative flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl font-bold text-ink drop-shadow-[0_2px_10px_rgb(9_15_34/0.9)] sm:text-3xl">{unit.era.name}</h2>
                    <p className="mt-0.5 font-serif text-sm text-gold-soft italic">{ERA_STORIES[unit.era.id]?.hook.title}</p>
                  </div>
                  <Link
                    href={`/map?era=${unit.era.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-sky-soft transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
                  >
                    <MapIcon className="size-3.5" aria-hidden />
                    Газрын зураг дээр
                  </Link>
                </div>
                <ol className="mt-4 grid gap-2.5 sm:grid-cols-3">
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
                      <li key={lesson.id}>
                        <LessonTile lesson={lesson} state={state} stars={progress.completed[lesson.id] ?? 0} />
                      </li>
                    );
                  })}
                </ol>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
