"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Question } from "@/lib/lessons";
import { sfx } from "@/lib/sounds";

/**
 * Renders one lesson question. Controlled: the player owns the answer and
 * decides when it is checked.
 *
 * Answer shapes:
 * - choice: option index
 * - truefalse: boolean
 * - order: indices into the shuffled pool, in the order tapped
 * - match: number of wrong pairings so far, set once every pair is matched
 */
export type Answer = number | boolean | number[] | { misses: number } | null;

export function isAnswered(q: Question, a: Answer) {
  if (a === null) return false;
  if (q.kind === "order") return Array.isArray(a) && a.length === q.items.length;
  return true;
}

/** Shuffled tiles for an order question, stable for the question. */
export function orderPool(q: Extract<Question, { kind: "order" }>) {
  const idx = q.items.map((_, i) => i);
  // Deterministic but scrambled: reverse-interleave, never the solved order.
  const pool = idx.filter((i) => i % 2 === 1).reverse().concat(idx.filter((i) => i % 2 === 0));
  return pool.every((v, i) => v === i) ? [...idx].reverse() : pool;
}

export function grade(q: Question, a: Answer): boolean {
  switch (q.kind) {
    case "choice":
      return a === q.answer;
    case "truefalse":
      return a === q.answer;
    case "order": {
      const pool = orderPool(q);
      return Array.isArray(a) && a.every((p, i) => pool[p] === i);
    }
    case "match":
      return typeof a === "object" && a !== null && "misses" in a && a.misses <= 1;
  }
}

type ViewProps = {
  question: Question;
  answer: Answer;
  onAnswer: (a: Answer) => void;
  /** After "Check": reveal right and wrong. */
  checked: boolean;
};

const tile =
  "relative w-full rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] leading-snug text-ink transition shadow-[0_3px_0_rgb(0_0_0/0.35)] active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent disabled:active:translate-y-0";

function tileState(selected: boolean, checked: boolean, isRight: boolean) {
  if (checked && isRight) return "border-emerald-400 bg-emerald-400/15";
  if (checked && selected) return "border-rose-400 bg-rose-400/15 animate-[shake_0.4s_ease]";
  if (selected) return "border-sky-accent bg-sky-accent/15";
  return "border-white/15 bg-navy-800/60 enabled:hover:border-white/35 enabled:hover:bg-navy-800";
}

function Choice({ question, answer, onAnswer, checked }: ViewProps & { question: Extract<Question, { kind: "choice" }> }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {question.options.map((option, i) => (
        <li key={option}>
          <button
            type="button"
            disabled={checked}
            onClick={() => {
              sfx.tap();
              onAnswer(i);
            }}
            className={`${tile} flex items-center gap-3 ${tileState(answer === i, checked, i === question.answer)}`}
          >
            <kbd className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/20 font-mono text-xs text-muted">
              {checked && i === question.answer ? <Check className="size-4 text-emerald-300" /> : i + 1}
            </kbd>
            <span>{option}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TrueFalse({ question, answer, onAnswer, checked }: ViewProps & { question: Extract<Question, { kind: "truefalse" }> }) {
  return (
    <div>
      <blockquote className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-serif text-lg leading-relaxed whitespace-pre-line text-ink">
        {question.statement}
      </blockquote>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[true, false].map((value, i) => (
          <button
            key={String(value)}
            type="button"
            disabled={checked}
            onClick={() => {
              sfx.tap();
              onAnswer(value);
            }}
            className={`${tile} flex items-center justify-center gap-2 py-4 text-center font-semibold ${tileState(answer === value, checked, value === question.answer)}`}
          >
            <kbd className="grid size-6 place-items-center rounded-md border border-white/20 font-mono text-[11px] text-muted">{i + 1}</kbd>
            {value ? (
              <>
                <Check className="size-5 text-emerald-300" aria-hidden /> Үнэн
              </>
            ) : (
              <>
                <X className="size-5 text-rose-300" aria-hidden /> Худал
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Order({ question, answer, onAnswer, checked }: ViewProps & { question: Extract<Question, { kind: "order" }> }) {
  const pool = useMemo(() => orderPool(question), [question]);
  const picked = Array.isArray(answer) ? answer : [];

  return (
    <div>
      <ol className="min-h-24 space-y-2 rounded-2xl border-2 border-dashed border-white/15 p-3">
        {picked.length === 0 && <li className="py-6 text-center text-sm text-faint">Доорх хэсгүүдээс дарааллаар нь сонго</li>}
        {picked.map((p, slot) => {
          const right = pool[p] === slot;
          return (
            <li key={p}>
              <button
                type="button"
                disabled={checked}
                onClick={() => {
                  sfx.tap();
                  onAnswer(picked.filter((x) => x !== p));
                }}
                className={`${tile} flex items-center gap-3 py-2.5 ${checked ? (right ? "border-emerald-400 bg-emerald-400/15" : "border-rose-400 bg-rose-400/15") : "border-gold/50 bg-gold/10"}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-navy-950">{slot + 1}</span>
                {question.items[pool[p]]}
              </button>
            </li>
          );
        })}
      </ol>
      {checked && !grade(question, answer) && (
        <ol className="mt-3 space-y-1 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-100">
          {question.items.map((item, i) => (
            <li key={item}>
              {i + 1}. {item}
            </li>
          ))}
        </ol>
      )}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {pool.map((itemIndex, p) => (
          <li key={itemIndex}>
            <button
              type="button"
              disabled={checked || picked.includes(p)}
              onClick={() => {
                sfx.tap();
                onAnswer([...picked, p]);
              }}
              className={`${tile} py-2.5 text-sm ${picked.includes(p) ? "invisible" : "border-white/15 bg-navy-800/60 hover:border-white/35"}`}
            >
              {question.items[itemIndex]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Match({ question, onAnswer, checked }: ViewProps & { question: Extract<Question, { kind: "match" }> }) {
  // Right column is shown in a different order from the left.
  const right = useMemo(() => orderPool({ kind: "order", prompt: "", items: question.pairs.map((p) => p[1]) }), [question]);
  const [leftPick, setLeftPick] = useState<number | null>(null);
  const [rightPick, setRightPick] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<[number, number] | null>(null);

  const tryPair = (l: number | null, r: number | null) => {
    setLeftPick(l);
    setRightPick(r);
    if (l === null || r === null) return;
    if (right[r] === l) {
      sfx.correct();
      const next = [...matched, l];
      setMatched(next);
      if (next.length === question.pairs.length) onAnswer({ misses });
    } else {
      sfx.wrong();
      setMisses(misses + 1);
      setFlash([l, r]);
      window.setTimeout(() => setFlash(null), 450);
    }
    setLeftPick(null);
    setRightPick(null);
  };

  const cls = (done: boolean, picked: boolean, wrong: boolean) =>
    done
      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100 opacity-60"
      : wrong
        ? "border-rose-400 bg-rose-400/15 animate-[shake_0.4s_ease]"
        : picked
          ? "border-sky-accent bg-sky-accent/15"
          : "border-white/15 bg-navy-800/60 hover:border-white/35";

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,5fr)] gap-3">
        <ul className="space-y-2">
          {question.pairs.map(([year], i) => (
            <li key={year + i}>
              <button
                type="button"
                disabled={checked || matched.includes(i)}
                onClick={() => {
                  sfx.tap();
                  tryPair(i, rightPick);
                }}
                className={`${tile} min-h-16 text-center font-mono text-sm font-semibold ${cls(matched.includes(i), leftPick === i, flash?.[0] === i)}`}
              >
                {year}
              </button>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {right.map((pairIndex, r) => (
            <li key={pairIndex}>
              <button
                type="button"
                disabled={checked || matched.includes(pairIndex)}
                onClick={() => {
                  sfx.tap();
                  tryPair(leftPick, r);
                }}
                className={`${tile} min-h-16 py-2 text-[13px] ${cls(matched.includes(pairIndex), rightPick === r, flash?.[1] === r)}`}
              >
                {question.pairs[pairIndex][1]}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-center text-xs text-faint" aria-live="polite">
        {matched.length}/{question.pairs.length} хос · {misses} алдаа
      </p>
    </div>
  );
}

export function QuestionView(props: ViewProps) {
  const { question } = props;
  switch (question.kind) {
    case "choice":
      return <Choice {...props} question={question} />;
    case "truefalse":
      return <TrueFalse {...props} question={question} />;
    case "order":
      return <Order {...props} question={question} />;
    case "match":
      return <Match {...props} question={question} />;
  }
}

export const KIND_LABEL: Record<Question["kind"], string> = {
  choice: "Зөв хариултыг сонго",
  truefalse: "Үнэн үү, худал уу?",
  order: "Дарааллаар нь байрлуул",
  match: "Хос болгон холбо",
};
