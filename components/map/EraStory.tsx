"use client";

import { Check, Compass, Crown, MapPin, RotateCcw, Swords, X } from "lucide-react";
import { useState } from "react";
import type { Era } from "@/data/eras";
import type { EraStory as Story } from "@/data/eraStories";
import { STORY } from "@/data/site";
import { useProgress } from "@/lib/progress";
import { sfx } from "@/lib/sounds";
import { ListenButton } from "../ListenButton";

const QUIZ_XP = 10;

type EraStoryProps = {
  era: Era;
  story: Story;
  /** Opens hotspot `index` on the map and scrolls the map into view. */
  onShowHotspot: (index: number) => void;
};

const FACT_ICONS = { leaders: Crown, size: Compass, goal: Swords } as const;

function Quiz({ eraId, quiz }: { eraId: string; quiz: Story["quiz"] }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [gained, setGained] = useState(0);
  const { award } = useProgress();
  const answered = picked !== null;
  const right = picked === quiz.answer;

  const choose = (i: number) => {
    setPicked(i);
    if (i === quiz.answer) {
      sfx.correct();
      // Paid once per era, so retrying doesn't farm XP.
      setGained(award({ xp: QUIZ_XP, claim: `map-quiz:${eraId}` }).granted ? QUIZ_XP : 0);
    } else {
      sfx.wrong();
    }
  };

  return (
    <section aria-labelledby="quiz-title" className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-5 sm:p-7">
      <p id="quiz-title" className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
        {STORY.quizTitle}
      </p>
      <p className="mt-2 font-serif text-xl font-semibold text-ink sm:text-2xl">{quiz.question}</p>
      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {quiz.options.map((option, i) => {
          const isAnswer = i === quiz.answer;
          const state = !answered ? "idle" : isAnswer ? "right" : i === picked ? "wrong" : "muted";
          return (
            <li key={option}>
              <button
                type="button"
                disabled={answered}
                onClick={() => choose(i)}
                data-state={state}
                className="flex w-full items-center gap-3 rounded-xl border border-white/15 bg-navy-950/60 px-4 py-3 text-left text-[15px] text-ink transition enabled:hover:border-gold/60 enabled:hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent data-[state=muted]:opacity-45 data-[state=right]:border-emerald-400/70 data-[state=right]:bg-emerald-400/10 data-[state=wrong]:border-rose-400/70 data-[state=wrong]:bg-rose-400/10"
              >
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full border border-white/20 font-mono text-[11px] text-muted"
                >
                  {state === "right" ? (
                    <Check className="size-3.5 text-emerald-300" />
                  ) : state === "wrong" ? (
                    <X className="size-3.5 text-rose-300" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                {option}
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className="mt-4 min-h-6">
        {answered && (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p
             
              className={`max-w-2xl text-[15px] leading-relaxed ${right ? "text-emerald-200" : "text-rose-100"}`}
            >
              {right ? quiz.correct : `${STORY.quizWrong} «${quiz.options[quiz.answer]}».`}
              {gained > 0 && <span className="ml-2 font-semibold whitespace-nowrap text-gold-soft">+{gained} XP</span>}
            </p>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {STORY.quizRetry}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** The story layer under the map: hook, fast facts, hotspot cards, then vs now and a quiz. */
export function EraStory({ era, story, onShowHotspot }: EraStoryProps) {
  return (
    <div id="details" className="mx-auto max-w-7xl scroll-mt-20 px-5 pt-12 sm:px-8 lg:pt-16">
      <header id="story-hook" className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs tracking-wide text-gold">
            {era.period} · {era.name}
          </p>
          <ListenButton target="story-hook" />
        </div>
        <h2 className="mt-2 font-serif text-4xl leading-[1.05] font-bold text-ink sm:text-5xl">{story.hook.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted sm:text-xl">{story.hook.summary}</p>
      </header>

      <section id="story-facts" aria-labelledby="nutshell-title" className="mt-10">
        <div className="flex items-center gap-3">
          <h3 id="nutshell-title" className="text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">
            {STORY.nutshell}
          </h3>
          <ListenButton target="story-facts" />
        </div>
        <dl className="mt-3 grid gap-3 md:grid-cols-3">
          {(["leaders", "size", "goal"] as const).map((fact) => {
            const Icon = FACT_ICONS[fact];
            return (
              <div key={fact} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <dt className="flex items-center gap-2 text-sm font-semibold text-gold-soft">
                  <Icon className="size-4" aria-hidden />
                  {STORY.facts[fact]}
                </dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-ink/90">{story.facts[fact]}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="hotspots-title" className="mt-12">
        <h3 id="hotspots-title" className="font-serif text-2xl font-semibold text-ink">
          {STORY.hotspotsTitle}
        </h3>
        <p className="mt-1 text-sm text-faint">{STORY.hotspotsIntro}</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {story.hotspots.map((hotspot, i) => (
            <li key={hotspot.title} className="flex flex-col rounded-2xl border border-white/10 bg-navy-950/50 p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-gold font-mono text-xs font-bold text-navy-950"
                >
                  {i + 1}
                </span>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-sky-soft uppercase">
                  {STORY.hotspotKinds[hotspot.kind]}
                </p>
              </div>
              <div id={`story-hotspot-${i}`} className="flex-1">
                <h4 className="mt-3 font-serif text-lg leading-snug font-semibold text-ink">{hotspot.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{hotspot.text}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onShowHotspot(i)}
                  className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-gold transition-colors hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
                >
                  <MapPin className="size-4" aria-hidden />
                  {STORY.showOnMap}
                </button>
                <ListenButton target={`story-hotspot-${i}`} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          id="story-then-now"
          aria-labelledby="then-now-title"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="then-now-title" className="font-serif text-xl font-semibold text-ink">
              {STORY.thenNow}
            </h3>
            <ListenButton target="story-then-now" />
          </div>
          <ul className="mt-4 space-y-3">
            {story.thenNow.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                <MapPin className="mt-1 size-4 shrink-0 text-sky-soft" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </section>
        <Quiz key={era.id} eraId={era.id} quiz={story.quiz} />
      </div>
    </div>
  );
}
