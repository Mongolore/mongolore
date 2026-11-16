"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Flame, Heart, Lightbulb, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/lib/lessons";
import { sfx } from "@/lib/sounds";
import { LanguageToggle } from "../HeaderActions";
import { ListenButton } from "../ListenButton";
import { BackToPath, LearnBackdrop } from "./chrome";
import { answerLabel, correctLabel, grade, isAnswered, KIND_LABEL, QuestionView, type Answer } from "./QuestionView";

const HEARTS = 3;
const COMBO_EVERY = 3;
const COMBO_BONUS = 5;

export type Missed = { question: Question; given: string };

export type SessionSummary = {
  /** False only when a lesson ran out of hearts. */
  success: boolean;
  xp: number;
  solved: number;
  accuracy: number;
  seconds: number;
  maxCombo: number;
  /** Each question answered wrong at least once, with the last wrong answer. */
  missed: Missed[];
};

type QuizSessionProps = {
  questions: Question[];
  /**
   * "lesson": three hearts, missed questions return until answered right.
   * "review": no hearts, a missed question returns once.
   */
  mode: "lesson" | "review";
  /** Shown above each question, e.g. the era name. */
  heading: string;
  xpPerCorrect: number;
  exitHref?: string;
  /** Called as each answer is checked, so nothing is lost if the learner leaves early. */
  onAnswered?: (question: Question, right: boolean, given: string) => void;
  onFinish: (summary: SessionSummary) => void;
};

/** Runs a queue of questions one at a time: answer, check, read the explanation, continue. */
export function QuizSession({ questions, mode, heading, xpPerCorrect, exitHref, onAnswered, onFinish }: QuizSessionProps) {
  const reduce = useReducedMotion();
  const total = questions.length;
  const [queue, setQueue] = useState(questions);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [checked, setChecked] = useState(false);
  const [hearts, setHearts] = useState(HEARTS);
  const [solved, setSolved] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const [missed, setMissed] = useState<Missed[]>([]);
  const [startedAt] = useState(() => Date.now());

  const question = queue[index];

  const check = useCallback(() => {
    if (checked || !isAnswered(question, answer)) return;
    const right = grade(question, answer);
    const given = answerLabel(question, answer);
    setLastCorrect(right);
    setChecked(true);
    onAnswered?.(question, right, given);
    if (right) {
      sfx.correct();
      const nextCombo = combo + 1;
      const gain = xpPerCorrect + (mode === "lesson" && nextCombo % COMBO_EVERY === 0 ? COMBO_BONUS : 0);
      setCombo(nextCombo);
      setMaxCombo(Math.max(maxCombo, nextCombo));
      setXp(xp + gain);
      setLastGain(gain);
      setSolved(solved + 1);
    } else {
      sfx.wrong();
      setCombo(0);
      setWrongCount(wrongCount + 1);
      setLastGain(0);
      if (mode === "lesson") setHearts(hearts - 1);
      const seenBefore = missed.some((m) => m.question.id === question.id);
      setMissed([...missed.filter((m) => m.question.id !== question.id), { question, given }]);
      // Missed questions come back at the end; in review, only once.
      if (mode === "lesson" || !seenBefore) setQueue([...queue, question]);
    }
  }, [answer, checked, combo, hearts, maxCombo, missed, mode, onAnswered, question, queue, solved, wrongCount, xp, xpPerCorrect]);

  const next = useCallback(() => {
    if (!checked) return;
    const outOfHearts = mode === "lesson" && hearts <= 0;
    if (outOfHearts || index + 1 >= queue.length) {
      onFinish({
        success: !outOfHearts,
        xp,
        solved,
        accuracy: Math.round((solved / Math.max(solved + wrongCount, 1)) * 100),
        seconds: Math.round((Date.now() - startedAt) / 1000),
        maxCombo,
        missed,
      });
      return;
    }
    setIndex(index + 1);
    setAnswer(null);
    setChecked(false);
  }, [checked, hearts, index, maxCombo, missed, mode, onFinish, queue.length, solved, startedAt, wrongCount, xp]);

  // Keyboard: 1–4 pick an option, Enter checks / continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (checked) next();
        else check();
        return;
      }
      if (checked || !question) return;
      const n = Number(e.key);
      const options = question.kind === "choice" ? question.options.length : question.kind === "locate" ? question.pins.length : 0;
      if (n >= 1 && n <= options) {
        sfx.tap();
        setAnswer(n - 1);
      } else if (question.kind === "truefalse" && (n === 1 || n === 2)) {
        sfx.tap();
        setAnswer(n === 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check, checked, next, question]);

  const percent = Math.round((Math.min(solved, total) / total) * 100);
  const explain = question.kind === "choice" && lastCorrect && question.praise ? question.praise : question.explain;
  const showCorrect = !lastCorrect && (question.kind === "choice" || question.kind === "truefalse" || question.kind === "locate");
  const returning = index >= total;

  return (
    <div className="flex min-h-dvh flex-col">
      <LearnBackdrop />
      {/* Top bar: quit, progress, combo, hearts */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 pt-6 sm:gap-4 sm:px-8">
        <BackToPath href={exitHref} />
        <div
          className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Явц"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft"
            initial={{ width: "0%" }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          />
          <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/25" />
        </div>
        <span className="font-mono text-xs text-faint tabular-nums">
          {Math.min(solved, total)}/{total}
        </span>
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
        {mode === "lesson" && (
          <span className="flex items-center gap-0.5" aria-label={`${hearts} амь үлдсэн`}>
            {Array.from({ length: HEARTS }, (_, i) => (
              <Heart
                key={i}
                className={`size-5 transition ${i < hearts ? "fill-rose-400 text-rose-400" : "scale-90 text-white/20"}`}
                aria-hidden
              />
            ))}
          </span>
        )}
        <LanguageToggle />
      </div>

      {/* Question */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 pb-56 sm:px-8 sm:pt-10">
        {/* No exit animation: a lingering old question would take clicks meant for the new one. */}
        <motion.div
          key={index}
          initial={reduce ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.16em] text-sky-soft uppercase">
              {heading} · {KIND_LABEL[question.kind]}
              {returning && (
                <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] tracking-wide text-rose-200 normal-case">
                  Дахин оролдъё
                </span>
              )}
            </p>
            <ListenButton target="lesson-question" />
          </div>
          <div id="lesson-question">
            <h1 className="mt-3 font-serif text-2xl leading-snug font-bold text-balance text-ink sm:text-3xl">{question.prompt}</h1>
            {question.kind === "choice" && question.context && (
              <p className="mt-4 rounded-2xl border-l-4 border-gold bg-gold/[0.07] px-5 py-4 text-[15px] leading-relaxed text-ink/90">
                {question.context}
              </p>
            )}
          </div>
          <div className="mt-7" data-question-kind={question.kind}>
            <QuestionView question={question} answer={answer} onAnswer={setAnswer} checked={checked} />
          </div>
        </motion.div>
      </main>

      {/* Bottom bar: check / feedback */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t-2 transition-colors ${
          checked
            ? lastCorrect
              ? "border-emerald-400/40 bg-[#0f2a2a]"
              : "border-rose-400/40 bg-[#2a1522]"
            : "border-white/10 bg-navy-900/95 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div aria-live="assertive" className="min-h-6 min-w-0 flex-1">
            {checked && (
              <motion.div initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start gap-3">
                {lastCorrect ? (
                  <CheckCircle2 className="size-9 shrink-0 text-emerald-300" aria-hidden />
                ) : (
                  <XCircle className="size-9 shrink-0 text-rose-300" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-lg font-bold ${lastCorrect ? "text-emerald-200" : "text-rose-200"}`}>
                    {lastCorrect
                      ? mode === "lesson" && combo > 0 && combo % COMBO_EVERY === 0
                        ? `Гайхалтай! ${combo} дараалан зөв 🔥`
                        : ["Зөв!", "Сайн байна!", "Яг тийм!", "Мундаг!"][solved % 4]
                      : "Буруу байна"}
                    {lastGain > 0 && <span className="ml-2 text-sm font-semibold text-gold-soft">+{lastGain} XP</span>}
                  </p>
                  {showCorrect && (
                    <p className="mt-0.5 text-sm text-rose-100">
                      Зөв хариулт: <strong>{correctLabel(question)}</strong>
                    </p>
                  )}
                  {explain && (
                    <p className="mt-2 flex max-h-28 gap-2 overflow-y-auto rounded-xl bg-black/20 px-3 py-2 text-sm leading-relaxed whitespace-pre-line text-ink/85">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
                      <span>{explain}</span>
                    </p>
                  )}
                  {!lastCorrect && (
                    <p className="mt-1.5 text-xs text-faint">
                      {mode === "lesson" && hearts <= 0
                        ? "Алдааны дэвтэрт хадгаллаа."
                        : "Алдааны дэвтэрт хадгаллаа — энэ асуулт сүүлд дахин гарна."}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          <button
            type="button"
            onClick={checked ? next : check}
            disabled={!checked && !isAnswered(question, answer)}
            className={`btn-3d shrink-0 ${checked ? (lastCorrect ? "btn-3d-emerald" : "btn-3d-rose") : ""}`}
          >
            {checked ? "Үргэлжлүүлэх" : "Шалгах"}
          </button>
        </div>
      </div>
    </div>
  );
}
