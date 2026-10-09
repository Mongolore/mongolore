"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Flame, Heart, Lock, RotateCcw, Star, Target, Trophy, X, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ERAS } from "@/data/eras";
import { useAuth } from "@/lib/auth";
import { buildQuestions, findLesson, previousLesson, type Question } from "@/lib/lessons";
import { levelInfo, useProgress, type AwardResult } from "@/lib/progress";
import { sfx } from "@/lib/sounds";
import { ListenButton } from "../ListenButton";
import { Confetti } from "./Confetti";
import { grade, isAnswered, KIND_LABEL, QuestionView, type Answer } from "./QuestionView";

const HEARTS = 3;
const XP_PER_CORRECT = 10;
const COMBO_EVERY = 3;
const COMBO_BONUS = 5;
const PERFECT_BONUS = 20;

type Phase = "answering" | "checked" | "done" | "failed";

type Result = {
  xp: number;
  stars: number;
  accuracy: number;
  seconds: number;
  maxCombo: number;
  award: AwardResult;
};

function starsFor(mistakes: number) {
  return mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
}

function Attempt({ lessonId, attempt, onRetry }: { lessonId: string; attempt: number; onRetry: () => void }) {
  const lesson = findLesson(lessonId)!;
  const era = ERAS.find((e) => e.id === lesson.eraId)!;
  const { award } = useProgress();
  const reduce = useReducedMotion();

  const [queue, setQueue] = useState<Question[]>(() => buildQuestions(lessonId, attempt));
  const total = useMemo(() => buildQuestions(lessonId, attempt).length, [lessonId, attempt]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [hearts, setHearts] = useState(HEARTS);
  const [solved, setSolved] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);

  const question = queue[index];

  const finish = useCallback(
    (success: boolean, finalXp: number, finalMistakes: number, finalMaxCombo: number) => {
      const stars = starsFor(finalMistakes);
      const bonus = success && finalMistakes === 0 ? PERFECT_BONUS : 0;
      const gained = finalXp + bonus;
      const awarded = award({ xp: gained, lesson: success ? { id: lessonId, stars } : undefined });
      const answeredCount = solved + finalMistakes;
      setResult({
        xp: gained,
        stars,
        accuracy: Math.round((solved / Math.max(answeredCount, 1)) * 100),
        seconds: Math.round((Date.now() - startedAt) / 1000),
        maxCombo: finalMaxCombo,
        award: awarded,
      });
      setPhase(success ? "done" : "failed");
      if (success) (awarded.leveledUp ? sfx.levelUp : sfx.complete)();
    },
    [award, lessonId, solved, startedAt],
  );

  const check = useCallback(() => {
    if (phase !== "answering" || !isAnswered(question, answer)) return;
    const right = grade(question, answer);
    setLastCorrect(right);
    setPhase("checked");
    if (right) {
      sfx.correct();
      const nextCombo = combo + 1;
      const gain = XP_PER_CORRECT + (nextCombo % COMBO_EVERY === 0 ? COMBO_BONUS : 0);
      setCombo(nextCombo);
      setMaxCombo(Math.max(maxCombo, nextCombo));
      setXp(xp + gain);
      setLastGain(gain);
      setSolved(solved + 1);
    } else {
      sfx.wrong();
      setCombo(0);
      setHearts(hearts - 1);
      setMistakes(mistakes + 1);
      setLastGain(0);
      // Missed questions come back at the end, Duolingo-style.
      setQueue([...queue, question]);
    }
  }, [answer, combo, hearts, maxCombo, mistakes, phase, question, queue, solved, xp]);

  const next = useCallback(() => {
    if (phase !== "checked") return;
    if (hearts <= 0) return finish(false, xp, mistakes, maxCombo);
    if (index + 1 >= queue.length) return finish(true, xp, mistakes, maxCombo);
    setIndex(index + 1);
    setAnswer(null);
    setPhase("answering");
  }, [finish, hearts, index, maxCombo, mistakes, phase, queue.length, xp]);

  // Keyboard: 1–4 pick an option, Enter checks / continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (phase === "answering") check();
        else if (phase === "checked") next();
        return;
      }
      if (phase !== "answering" || !question) return;
      const n = Number(e.key);
      if (question.kind === "choice" && n >= 1 && n <= question.options.length) {
        sfx.tap();
        setAnswer(n - 1);
      } else if (question.kind === "truefalse" && (n === 1 || n === 2)) {
        sfx.tap();
        setAnswer(n === 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check, next, phase, question]);

  if (result) {
    return <Results lessonTitle={lesson.title} eraName={era.name} success={phase === "done"} result={result} onRetry={onRetry} />;
  }

  const percent = Math.round((solved / total) * 100);
  const explain =
    question.kind === "choice" && lastCorrect && question.praise
      ? question.praise
      : question.kind === "choice" || question.kind === "truefalse"
        ? question.explain
        : undefined;
  const correctText =
    question.kind === "choice"
      ? question.options[question.answer]
      : question.kind === "truefalse"
        ? question.answer
          ? "Үнэн"
          : "Худал"
        : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar: quit, progress, combo, hearts */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 pt-6 sm:px-8">
        <Link
          href="/learn"
          aria-label="Хичээлээс гарах"
          className="rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
        >
          <X className="size-6" aria-hidden />
        </Link>
        <div
          className="relative h-4 flex-1 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Хичээлийн явц"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft"
            initial={{ width: "0%" }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          />
          <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/25" />
        </div>
        <AnimatePresence>
          {combo >= 2 && (
            <motion.span
              key={combo}
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-sm font-bold text-orange-300"
            >
              <Flame className="size-4 fill-orange-400/70" aria-hidden />
              {combo}x
            </motion.span>
          )}
        </AnimatePresence>
        <span className="flex items-center gap-1 font-bold text-rose-300" aria-label={`${hearts} амь үлдсэн`}>
          <Heart className="size-5 fill-rose-400 text-rose-400" aria-hidden />
          {hearts}
        </span>
      </div>

      {/* Question */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-48 sm:px-8">
        {/* No exit animation: a lingering old question would take clicks meant for the new one. */}
        <motion.div
          key={index}
          initial={reduce ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.16em] text-sky-soft uppercase">
              {era.name} · {KIND_LABEL[question.kind]}
            </p>
            <ListenButton target="lesson-question" />
          </div>
          <div id="lesson-question">
            <h1 className="mt-3 font-serif text-2xl leading-snug font-bold text-ink sm:text-3xl">{question.prompt}</h1>
            {question.kind === "choice" && question.context && (
              <p className="mt-4 rounded-2xl border-l-4 border-gold bg-gold/[0.07] px-5 py-4 text-[15px] leading-relaxed text-ink/90">
                {question.context}
              </p>
            )}
          </div>
          <div className="mt-7">
            <QuestionView question={question} answer={answer} onAnswer={setAnswer} checked={phase === "checked"} />
          </div>
        </motion.div>
      </main>

      {/* Bottom bar: check / feedback */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t-2 transition-colors ${
          phase === "checked"
            ? lastCorrect
              ? "border-emerald-400/40 bg-[#0f2a2a]"
              : "border-rose-400/40 bg-[#2a1522]"
            : "border-white/10 bg-navy-900/95 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div aria-live="assertive" className="min-h-6 min-w-0">
            {phase === "checked" && (
              <motion.div
                initial={reduce ? false : { y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-start gap-3"
               
              >
                {lastCorrect ? (
                  <CheckCircle2 className="size-9 shrink-0 text-emerald-300" aria-hidden />
                ) : (
                  <XCircle className="size-9 shrink-0 text-rose-300" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className={`text-lg font-bold ${lastCorrect ? "text-emerald-200" : "text-rose-200"}`}>
                    {lastCorrect
                      ? combo > 0 && combo % COMBO_EVERY === 0
                        ? `Гайхалтай! ${combo} дараалан зөв 🔥`
                        : ["Зөв!", "Сайн байна!", "Яг тийм!", "Мундаг!"][solved % 4]
                      : "Буруу байна"}
                    {lastGain > 0 && <span className="ml-2 text-sm font-semibold text-gold-soft">+{lastGain} XP</span>}
                  </p>
                  {!lastCorrect && correctText && (
                    <p className="mt-0.5 text-sm text-rose-100">
                      Зөв хариулт: <strong>{correctText}</strong>
                    </p>
                  )}
                  {explain && <p className="mt-1 line-clamp-3 text-sm text-ink/80">{explain}</p>}
                  {!lastCorrect && hearts > 0 && (
                    <p className="mt-1 text-xs text-faint">Энэ асуулт сүүлд дахин гарна.</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          <button
            type="button"
            onClick={phase === "answering" ? check : next}
            disabled={phase === "answering" && !isAnswered(question, answer)}
            className={`shrink-0 rounded-2xl px-10 py-3.5 text-base font-extrabold tracking-wide uppercase transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-faint disabled:shadow-none ${
              phase === "checked" && !lastCorrect
                ? "bg-rose-400 text-navy-950 shadow-[0_4px_0_#9f3550] hover:bg-rose-300"
                : phase === "checked"
                  ? "bg-emerald-400 text-navy-950 shadow-[0_4px_0_#1d7a55] hover:bg-emerald-300"
                  : "bg-gold text-navy-950 shadow-[0_4px_0_#a87a23] hover:bg-gold-soft"
            }`}
          >
            {phase === "answering" ? "Шалгах" : "Үргэлжлүүлэх"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Results({
  lessonTitle,
  eraName,
  success,
  result,
  onRetry,
}: {
  lessonTitle: string;
  eraName: string;
  success: boolean;
  result: Result;
  onRetry: () => void;
}) {
  const { progress } = useProgress();
  const reduce = useReducedMotion();
  const info = levelInfo(progress.xp);
  const minutes = Math.floor(result.seconds / 60);
  const secs = String(result.seconds % 60).padStart(2, "0");

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      {success && <Confetti />}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className={`grid size-28 place-items-center rounded-full ${success ? "bg-gold/15 ring-4 ring-gold/40" : "bg-rose-400/10 ring-4 ring-rose-400/30"}`}
      >
        {success ? <Trophy className="size-14 text-gold" aria-hidden /> : <Heart className="size-14 text-rose-300" aria-hidden />}
      </motion.div>

      <div>
        <h1 className="mt-6 font-serif text-4xl font-bold text-ink">
          {success ? "Хичээл дууслаа!" : "Амь дууслаа"}
        </h1>
        <p className="mt-2 text-muted">
          {eraName} · {lessonTitle}
          {!success && " — дахин оролдоод заавал давна!"}
        </p>
      </div>

      {success && (
        <div className="mt-5 flex gap-2" aria-label={`${result.stars} од`}>
          {[1, 2, 3].map((s) => (
            <motion.span
              key={s}
              initial={reduce ? false : { scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + s * 0.18, type: "spring", stiffness: 300, damping: 12 }}
            >
              <Star
                className={`size-12 ${s <= result.stars ? "fill-gold text-gold" : "text-white/20"}`}
                aria-hidden
              />
            </motion.span>
          ))}
        </div>
      )}

      <dl className="mt-8 grid w-full grid-cols-3 gap-3">
        {[
          { icon: Zap, label: "XP", value: `+${result.xp}`, tone: "border-gold/40 text-gold-soft" },
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
        <p className="mt-3 rounded-2xl bg-emerald-400/10 px-6 py-3 font-semibold text-emerald-200">
          🎯 Өдрийн зорилгодоо хүрлээ!
        </p>
      )}
      {success && result.award.streak > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-orange-200">
          <Flame className="size-4 fill-orange-400/60" aria-hidden />
          {result.award.streak} өдрийн цуваа
        </p>
      )}

      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-white/15 px-6 py-3.5 font-bold text-ink transition hover:border-white/30 hover:bg-white/5"
        >
          <RotateCcw className="size-4" aria-hidden />
          Дахин тоглох
        </button>
        <Link
          href="/learn"
          className="flex flex-1 items-center justify-center rounded-2xl bg-gold px-6 py-3.5 font-extrabold tracking-wide text-navy-950 uppercase shadow-[0_4px_0_#a87a23] transition hover:bg-gold-soft active:translate-y-1 active:shadow-none"
        >
          Үргэлжлүүлэх
        </Link>
      </div>
    </main>
  );
}

/** A lesson: checks it's unlocked, then runs attempts until the learner leaves. */
export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { progress, ready } = useProgress();
  const { user, loading, configured, openDialog } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const prev = previousLesson(lessonId);
  const locked = ready && prev !== undefined && !progress.completed[prev.id];

  if (!ready || loading) {
    return <div className="grid min-h-dvh place-items-center text-muted">Ачаалж байна…</div>;
  }

  // Lessons are for signed-in learners (guest mode only when Supabase isn't configured).
  if (configured && !user) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <Lock className="size-14 text-faint" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Нэвтэрч суралцаарай</h1>
        <p className="mt-2 text-muted">Хичээл үзэхийн тулд нэвтэрнэ үү эсвэл бүртгүүлнэ үү.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => openDialog("login")}
            className="rounded-2xl bg-gold px-8 py-3 font-bold text-navy-950 shadow-[0_4px_0_#a87a23] hover:bg-gold-soft"
          >
            Нэвтрэх
          </button>
          <button
            type="button"
            onClick={() => openDialog("signup")}
            className="rounded-2xl border border-white/15 px-8 py-3 font-bold text-ink hover:bg-white/5"
          >
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
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <Lock className="size-14 text-faint" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Энэ хичээл түгжээтэй</h1>
        <p className="mt-2 text-muted">Өмнөх «{prev.title}» хичээлээ дуусгаад нээгээрэй.</p>
        <Link
          href="/learn"
          className="mt-8 rounded-2xl bg-gold px-8 py-3 font-bold text-navy-950 shadow-[0_4px_0_#a87a23] hover:bg-gold-soft"
        >
          Замаа харах
        </Link>
      </main>
    );
  }

  return <Attempt key={attempt} lessonId={lessonId} attempt={attempt} onRetry={() => setAttempt((a) => a + 1)} />;
}
