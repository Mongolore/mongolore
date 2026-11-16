"use client";

import { motion, useReducedMotion } from "framer-motion";
import { NotebookPen, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { reshuffled, type Question } from "@/lib/lessons";
import { useMistakes } from "@/lib/mistakes";
import { useProgress } from "@/lib/progress";
import { sfx } from "@/lib/sounds";
import { ScreenBar, LearnBackdrop } from "./chrome";
import { Confetti } from "./Confetti";
import { MistakeList } from "./MistakeList";
import { QuizSession, type SessionSummary } from "./QuizSession";

const REVIEW_XP = 5;

type ReviewSessionProps = {
  /** The missed questions to go through again. */
  questions: Question[];
  /** Where "back" and "done" lead. */
  exitHref: string;
  exitLabel: string;
  /** Called instead of following `exitHref` when the review is embedded in another screen. */
  onExit?: () => void;
};

/** Revision: missed questions again, without hearts. A right answer clears it from the notebook. */
export function ReviewSession({ questions, exitHref, exitLabel, onExit }: ReviewSessionProps) {
  const { record, resolve, notebook } = useMistakes();
  const { award } = useProgress();
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [pending, setPending] = useState(questions);
  // New option order every round, so the position can't be memorised.
  const queue = useMemo(() => pending.map((q) => reshuffled(q, `review-${round}`)), [pending, round]);

  const onAnswered = useCallback(
    (question: Question, right: boolean, given: string) => {
      if (right) resolve(question.id);
      else record(question, given);
    },
    [record, resolve],
  );

  const onFinish = useCallback(
    (result: SessionSummary) => {
      if (result.xp > 0) award({ xp: result.xp });
      setSummary(result);
      if (result.solved > 0) sfx.complete();
    },
    [award],
  );

  if (!summary) {
    return (
      <QuizSession
        key={round}
        questions={queue}
        mode="review"
        heading="Алдаа засах"
        xpPerCorrect={REVIEW_XP}
        exitHref={exitHref}
        onAnswered={onAnswered}
        onFinish={onFinish}
      />
    );
  }

  // Still wrong after its second chance this round.
  const stillOpen = summary.missed.filter((m) => notebook.open.some((o) => o.question.id === m.question.id));
  const fixed = pending.length - stillOpen.length;
  const exit = onExit ? (
    <button type="button" onClick={onExit} className="btn-ghost flex-1">
      {exitLabel}
    </button>
  ) : (
    <Link href={exitHref} className="btn-ghost flex-1">
      {exitLabel}
    </Link>
  );

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-2xl flex-col items-center px-5 pt-24 pb-16 text-center">
      <LearnBackdrop />
      <ScreenBar href={exitHref} />
      {stillOpen.length === 0 && <Confetti count={50} />}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="grid size-24 place-items-center rounded-full bg-emerald-400/10 ring-4 ring-emerald-400/30"
      >
        {stillOpen.length === 0 ? (
          <Sparkles className="size-12 text-emerald-300" aria-hidden />
        ) : (
          <NotebookPen className="size-12 text-emerald-300" aria-hidden />
        )}
      </motion.div>
      <h1 className="mt-6 font-serif text-4xl font-bold text-ink">
        {stillOpen.length === 0 ? "Бүх алдаагаа заслаа!" : `${fixed} алдаа заслаа`}
      </h1>
      <p className="mt-2 text-muted">
        {stillOpen.length === 0
          ? "Эдгээр асуулт дэвтрээс чинь арилсан. Мундаг!"
          : `${stillOpen.length} асуулт дэвтэрт үлдлээ — зөв хариултыг нь уншаад дахин оролдоорой.`}
        {summary.xp > 0 && <span className="ml-2 font-semibold whitespace-nowrap text-gold-soft">+{summary.xp} XP</span>}
      </p>

      {stillOpen.length > 0 && (
        <div className="mt-8 w-full">
          <MistakeList items={stillOpen} />
        </div>
      )}

      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
        {exit}
        {stillOpen.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPending(stillOpen.map((m) => m.question));
              setSummary(null);
              setRound((r) => r + 1);
            }}
            className="btn-3d flex-1"
          >
            Дахин оролдох
          </button>
        )}
      </div>
    </main>
  );
}
