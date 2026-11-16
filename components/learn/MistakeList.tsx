import { Check, Lightbulb, X } from "lucide-react";
import { ERAS } from "@/data/eras";
import type { Question } from "@/lib/lessons";
import { correctLabel, KIND_LABEL } from "./QuestionView";

type Item = { question: Question; given: string; missed?: number };

/** Wrong answers laid out for study: the question, what was answered, the right answer, and why. */
export function MistakeList({ items }: { items: Item[] }) {
  return (
    <ol className="space-y-3 text-left">
      {items.map(({ question, given, missed }) => {
        const era = ERAS.find((e) => e.id === question.eraId);
        return (
          <li key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-[0.14em] text-sky-soft uppercase">
              {era?.name} · {KIND_LABEL[question.kind]}
              {missed !== undefined && missed > 1 && (
                <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] tracking-wide text-rose-200 normal-case">
                  {missed} удаа алдсан
                </span>
              )}
            </p>
            <p className="mt-2 font-serif text-lg leading-snug font-semibold text-ink">{question.prompt}</p>
            {question.kind === "choice" && question.context && (
              <p className="mt-2 line-clamp-3 border-l-2 border-gold/50 pl-3 text-sm leading-relaxed text-muted">{question.context}</p>
            )}
            {question.kind === "truefalse" && (
              <p className="mt-2 line-clamp-4 border-l-2 border-gold/50 pl-3 text-sm leading-relaxed whitespace-pre-line text-muted">
                {question.statement}
              </p>
            )}
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/[0.07] px-3 py-2">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-rose-200 uppercase">
                  <X className="size-3.5" aria-hidden /> Таны хариулт
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-line text-ink/90">{given || "—"}</dd>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] px-3 py-2">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-emerald-200 uppercase">
                  <Check className="size-3.5" aria-hidden /> Зөв хариулт
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-line text-ink/90">{correctLabel(question)}</dd>
              </div>
            </dl>
            {question.explain && question.kind !== "order" && question.kind !== "match" && (
              <p className="mt-2.5 flex gap-2 text-sm leading-relaxed whitespace-pre-line text-muted">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
                <span>{question.explain}</span>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
