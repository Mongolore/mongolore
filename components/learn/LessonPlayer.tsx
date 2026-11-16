"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Flame, Heart, Lock, NotebookPen, RotateCcw, Star, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ERAS } from "@/data/eras";
import { useAuth } from "@/lib/auth";
import { buildQuestions, buildStudy, findLesson, LESSONS, previousLesson, type Lesson, type Question } from "@/lib/lessons";
import { useMistakes } from "@/lib/mistakes";
import { levelInfo, useProgress, type AwardResult } from "@/lib/progress";
import { sfx } from "@/lib/sounds";
import { LearnBackdrop, ScreenBar } from "./chrome";
import { Confetti } from "./Confetti";
import { MistakeList } from "./MistakeList";
import { QuizSession, type SessionSummary } from "./QuizSession";
import { ReviewSession } from "./ReviewSession";
import { StudyDeck } from "./StudyDeck";

const XP_PER_CORRECT = 10;
const PERFECT_BONUS = 20;

type Result = SessionSummary & { stars: number; gained: number; award: AwardResult };

function starsFor(mistakes: number) {
  return mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
}

/**
 * One run through a lesson: read the study cards, answer the questions, then
 * look over what went wrong — and fix it on the spot.
 */
function Attempt({ lesson, attempt, skipStudy, onRetry }: { lesson: Lesson; attempt: number; skipStudy: boolean; onRetry: (study: boolean) => void }) {
  const era = ERAS.find((e) => e.id === lesson.eraId)!;
  const { award } = useProgress();
  const { record } = useMistakes();
  const cards = useMemo(() => buildStudy(lesson.id), [lesson.id]);
  const questions = useMemo(() => buildQuestions(lesson.id, attempt), [lesson.id, attempt]);
  const [phase, setPhase] = useState<"study" | "quiz" | "results" | "fix">(skipStudy ? "quiz" : "study");
  const [result, setResult] = useState<Result | null>(null);

  const onAnswered = useCallback(
    (question: Question, right: boolean, given: string) => {
      if (!right) record(question, given);
    },
    [record],
  );

  const onFinish = useCallback(
    (summary: SessionSummary) => {
      const stars = starsFor(summary.missed.length);
      const gained = summary.xp + (summary.success && summary.missed.length === 0 ? PERFECT_BONUS : 0);
      const awarded = award({ xp: gained, lesson: summary.success ? { id: lesson.id, stars } : undefined });
      setResult({ ...summary, stars, gained, award: awarded });
      setPhase("results");
      if (summary.success) (awarded.leveledUp ? sfx.levelUp : sfx.complete)();
    },
    [award, lesson.id],
  );

  if (phase === "study") {
    return <StudyDeck cards={cards} heading={`${era.name} · ${lesson.title}`} onDone={() => setPhase("quiz")} />;
  }
  if (phase === "quiz" || !result) {
    return (
      <QuizSession
        questions={questions}
        mode="lesson"
        heading={era.name}
        xpPerCorrect={XP_PER_CORRECT}
        onAnswered={onAnswered}
        onFinish={onFinish}
      />
    );
  }
  if (phase === "fix") {
    return (
      <ReviewSession
        questions={result.missed.map((m) => m.question)}
        exitHref="/learn"
        exitLabel="Дүн рүү буцах"
        onExit={() => setPhase("results")}
      />
    );
  }
  return <Results lesson={lesson} eraName={era.name} result={result} onRetry={onRetry} onFix={() => setPhase("fix")} />;
}

function Results({
  lesson,
  eraName,
  result,
  onRetry,
  onFix,
}: {
  lesson: Lesson;
  eraName: string;
  result: Result;
  onRetry: (study: boolean) => void;
  onFix: () => void;
}) {
  const { progress } = useProgress();
  const { notebook } = useMistakes();
  const reduce = useReducedMotion();
  const info = levelInfo(progress.xp);
  const minutes = Math.floor(result.seconds / 60);
  const secs = String(result.seconds % 60).padStart(2, "0");
  const { success } = result;
  const next = LESSONS[LESSONS.indexOf(lesson) + 1];
  const nextEra = next && ERAS.find((e) => e.id === next.eraId);
  // Mistakes from this run that haven't been fixed since.
  const open = result.missed.filter((m) => notebook.open.some((o) => o.question.id === m.question.id));

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-2xl flex-col items-center px-5 pt-24 pb-16 text-center">
      <LearnBackdrop />
      <ScreenBar />
      {success && <Confetti />}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className={`grid size-28 place-items-center rounded-full ${success ? "bg-gold/15 ring-4 ring-gold/40" : "bg-rose-400/10 ring-4 ring-rose-400/30"}`}
      >
        {success ? <Trophy className="size-14 text-gold" aria-hidden /> : <Heart className="size-14 text-rose-300" aria-hidden />}
      </motion.div>

      <h1 className="mt-6 font-serif text-4xl font-bold text-ink">{success ? "Хичээл дууслаа!" : "Амь дууслаа"}</h1>
      <p className="mt-2 text-muted">
        {eraName} · {lesson.title}
        {!success && " — алдаагаа хараад дахин оролдоорой, заавал давна!"}
      </p>

      {success && (
        <div className="mt-5 flex gap-2" aria-label={`${result.stars} од`}>
          {[1, 2, 3].map((s) => (
            <motion.span
              key={s}
              initial={reduce ? false : { scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + s * 0.18, type: "spring", stiffness: 300, damping: 12 }}
            >
              <Star className={`size-12 ${s <= result.stars ? "fill-gold text-gold" : "text-white/20"}`} aria-hidden />
            </motion.span>
          ))}
        </div>
      )}

      <dl className="mt-8 grid w-full grid-cols-3 gap-3">
        {[
          { icon: Zap, label: "XP", value: `+${result.gained}`, tone: "border-gold/40 text-gold-soft" },
          { icon: Target, label: "Оновчлол", value: `${result.accuracy}%`, tone: "border-emerald-400/40 text-emerald-200" },
          { icon: Flame, label: "Шилдэг цуваа", value: `${result.maxCombo}x`, tone: "border-orange-400/40 text-orange-200" },
        ].map(({ icon: Icon, label, value, tone }, i) => (
          <motion.div
            key={label}
            initial={reduce ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className={`rounded-2xl border-2 bg-white/[0.03] px-3 py-4 ${tone}`}
          >
            <dt className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-wider uppercase">
              <Icon className="size-3.5" aria-hidden />
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-extrabold text-ink">{value}</dd>
          </motion.div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-faint">
        Хугацаа {minutes}:{secs}
      </p>

      {result.award.leveledUp && (
        <motion.p
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 rounded-2xl bg-gradient-to-r from-gold/25 to-orange-400/20 px-6 py-3 font-bold text-gold-soft"
        >
          🎉 Түвшин ахилаа! Та одоо {info.level}-р түвшин — «{info.title}»
        </motion.p>
      )}
      {result.award.goalReached && (
        <p className="mt-3 rounded-2xl bg-emerald-400/10 px-6 py-3 font-semibold text-emerald-200">🎯 Өдрийн зорилгодоо хүрлээ!</p>
      )}
      {success && result.award.streak > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-orange-200">
          <Flame className="size-4 fill-orange-400/60" aria-hidden />
          {result.award.streak} өдрийн цуваа
        </p>
      )}

      {/* What went wrong, and a way to put it right straight away */}
      {result.missed.length > 0 && (
        <section aria-labelledby="mistakes-title" className="mt-10 w-full rounded-3xl border border-rose-400/25 bg-rose-400/[0.04] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-left">
            <div>
              <h2 id="mistakes-title" className="flex items-center gap-2 font-serif text-xl font-bold text-ink">
                <NotebookPen className="size-5 text-rose-200" aria-hidden />
                Алдаагаа харъя
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {open.length > 0
                  ? `${result.missed.length} асуултад алдсан — зөв хариулт, тайлбарыг нь уншаад засаарай.`
                  : "Энэ хичээлийн бүх алдаагаа зассан байна. 👏"}
              </p>
            </div>
            {open.length > 0 && (
              <button type="button" onClick={onFix} className="btn-3d btn-3d-rose px-5 py-2.5 text-sm">
                Алдаагаа засах
                <ArrowRight className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <div className="mt-4">
            <MistakeList items={result.missed} />
          </div>
        </section>
      )}

      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => onRetry(false)} className="btn-ghost flex-1">
          <RotateCcw className="size-4" aria-hidden />
          Дахин тоглох
        </button>
        {success && next ? (
          <Link href={`/learn/${next.id}`} className="btn-3d flex-1">
            Дараагийн хичээл
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        ) : success ? (
          <Link href="/learn" className="btn-3d flex-1">
            Үргэлжлүүлэх
          </Link>
        ) : (
          <button type="button" onClick={() => onRetry(true)} className="btn-3d flex-1">
            <BookOpen className="size-5" aria-hidden />
            Дахин уншаад оролдох
          </button>
        )}
      </div>
      {success && next && (
        <p className="mt-3 text-xs text-faint">
          Дараа нь: {nextEra?.name} · {next.title}
        </p>
      )}
      <Link href="/learn" className="mt-5 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
        Хичээлийн зам руу буцах
      </Link>
    </main>
  );
}

/** A lesson: checks it's unlocked, then runs attempts until the learner leaves. */
export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { progress, ready } = useProgress();
  const { user, loading, configured, openDialog } = useAuth();
  const [run, setRun] = useState({ attempt: 0, skipStudy: false });
  const lesson = findLesson(lessonId)!;
  const prev = previousLesson(lessonId);
  const locked = ready && prev !== undefined && !progress.completed[prev.id];

  if (!ready || loading) {
    return (
      <div className="relative grid min-h-dvh place-items-center text-muted">
        <ScreenBar />
        Ачаалж байна…
      </div>
    );
  }

  // Lessons are for signed-in learners (guest mode only when Supabase isn't configured).
  if (configured && !user) {
    return (
      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <LearnBackdrop />
        <ScreenBar />
        <Lock className="size-14 text-faint" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Нэвтэрч суралцаарай</h1>
        <p className="mt-2 text-muted">Хичээл үзэхийн тулд нэвтэрнэ үү эсвэл бүртгүүлнэ үү.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => openDialog("login")} className="btn-3d">
            Нэвтрэх
          </button>
          <button type="button" onClick={() => openDialog("signup")} className="btn-ghost">
            Бүртгүүлэх
          </button>
        </div>
        <Link href="/learn" className="mt-6 text-sm text-muted hover:text-ink">
          Замаа харах
        </Link>
      </main>
    );
  }

  if (locked) {
    return (
      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <LearnBackdrop />
        <ScreenBar />
        <Lock className="size-14 text-faint" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Энэ хичээл түгжээтэй</h1>
        <p className="mt-2 text-muted">Өмнөх «{prev.title}» хичээлээ дуусгаад нээгээрэй.</p>
        <Link href="/learn" className="btn-3d mt-8">
          Замаа харах
        </Link>
      </main>
    );
  }

  return (
    <Attempt
      key={run.attempt}
      lesson={lesson}
      attempt={run.attempt}
      skipStudy={run.skipStudy}
      onRetry={(study) => setRun((r) => ({ attempt: r.attempt + 1, skipStudy: !study }))}
    />
  );
}
