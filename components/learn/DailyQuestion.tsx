"use client";

import { CalendarCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { dailyQuestion } from "@/lib/lessons";
import { dayKey, useProgress } from "@/lib/progress";
import { sfx } from "@/lib/sounds";
import { grade, QuestionView, type Answer } from "./QuestionView";

const DAILY_XP = 15;

/** One question a day for bonus XP — a reason to come back tomorrow. */
export function DailyQuestion() {
  const { award, hasClaimed, ready } = useProgress();
  const [day] = useState(() => dayKey());
  const question = useMemo(() => dailyQuestion(day), [day]);
  const [answer, setAnswer] = useState<Answer>(null);
  const [checked, setChecked] = useState(false);
  const claimKey = `daily:${day}`;
  const alreadyDone = ready && hasClaimed(claimKey) && !checked;
  const right = checked && grade(question, answer);

  const pick = (a: Answer) => {
    if (checked) return;
    setAnswer(a);
    setChecked(true);
    if (grade(question, a)) {
      sfx.correct();
      award({ xp: DAILY_XP, claim: claimKey });
    } else {
      sfx.wrong();
      // A wrong answer still uses up today's question.
      award({ xp: 0, claim: claimKey });
    }
  };

  return (
    <section aria-labelledby="daily-title" className="rounded-3xl border border-sky-accent/30 bg-sky-accent/[0.05] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="daily-title" className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-sky-soft uppercase">
          <Sparkles className="size-4" aria-hidden /> Өдрийн асуулт
        </p>
        <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold-soft">+{DAILY_XP} XP</span>
      </div>
      {!ready ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white/5" />
      ) : alreadyDone ? (
        <div className="mt-4 flex items-center gap-3 text-muted">
          <CalendarCheck className="size-8 text-emerald-300" aria-hidden />
          <p>Өнөөдрийн асуултад хариулсан байна. Маргааш шинэ асуулт ирнэ!</p>
        </div>
      ) : (
        <>
          <div>
            <p className="mt-3 font-serif text-xl font-semibold text-ink sm:text-2xl">{question.prompt}</p>
            {question.kind === "choice" && question.context && (
              <p className="mt-3 border-l-2 border-gold pl-4 text-[15px] leading-relaxed text-muted">{question.context}</p>
            )}
          </div>
          <div className="mt-5">
            <QuestionView question={question} answer={answer} onAnswer={pick} checked={checked} />
          </div>
          {checked && (
            <p className={`mt-4 text-sm font-semibold ${right ? "text-emerald-200" : "text-rose-200"}`} aria-live="polite">
              {right ? `Зөв! +${DAILY_XP} XP` : "Энэ удаад болсонгүй — маргааш дахин оролдоорой!"}
            </p>
          )}
        </>
      )}
    </section>
  );
}
