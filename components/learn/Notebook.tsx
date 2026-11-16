"use client";

import { ArrowRight, CheckCheck, NotebookPen, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Question } from "@/lib/lessons";
import { useMistakes } from "@/lib/mistakes";
import { MistakeList } from "./MistakeList";
import { ReviewSession } from "./ReviewSession";

/** Questions per revision sitting — short enough to finish in a couple of minutes. */
const SESSION_SIZE = 8;

/** The mistake notebook: everything answered wrong and not yet fixed, with a way to practise it. */
export function Notebook() {
  const { notebook } = useMistakes();
  const [session, setSession] = useState<Question[] | null>(null);
  const open = notebook.open;

  if (session) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-900">
        <ReviewSession questions={session} exitHref="/learn/review" exitLabel="Дэвтэр рүү буцах" onExit={() => setSession(null)} />
      </div>
    );
  }

  // The most-missed first: those are the ones that need the work.
  const start = () =>
    setSession(
      [...open]
        .sort((a, b) => b.missed - a.missed || b.at - a.at)
        .slice(0, SESSION_SIZE)
        .map((m) => m.question),
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <header>
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-rose-200 uppercase">
          <NotebookPen className="size-4" aria-hidden /> Алдааны дэвтэр
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-tight font-bold text-ink sm:text-5xl">Алдаанаасаа суралц</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Буруу хариулсан асуулт бүр энд хадгалагдана. Зөв хариулт, тайлбарыг нь уншаад дахин хариул — зөв хариулбал дэвтрээс арилна.
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.06] p-4">
          <dt className="text-xs font-semibold text-rose-200">Засах алдаа</dt>
          <dd className="mt-1 text-3xl font-extrabold text-ink tabular-nums">{open.length}</dd>
        </div>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
            <CheckCheck className="size-4" aria-hidden /> Зассан
          </dt>
          <dd className="mt-1 text-3xl font-extrabold text-ink tabular-nums">{notebook.fixed}</dd>
        </div>
      </dl>

      {open.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <Sparkles className="mx-auto size-12 text-gold" aria-hidden />
          <p className="mt-4 font-serif text-2xl font-bold text-ink">Дэвтэр хоосон байна</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">Засах алдаа алга. Шинэ хичээл үзээд мэдлэгээ сориорой.</p>
          <Link href="/learn" className="btn-3d mt-6">
            Хичээл рүү
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gold/30 bg-gold/[0.06] p-5">
            <div>
              <p className="font-serif text-xl font-bold text-ink">Давтлага хийх үү?</p>
              <p className="mt-0.5 text-sm text-muted">
                {Math.min(open.length, SESSION_SIZE)} асуулт · амь алдахгүй · зөв хариулт бүр +5 XP
              </p>
            </div>
            <button type="button" onClick={start} className="btn-3d">
              Алдаагаа засах
              <ArrowRight className="size-5" aria-hidden />
            </button>
          </div>
          <h2 className="mt-10 text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">Бүх алдаа</h2>
          <div className="mt-3">
            <MistakeList items={open} />
          </div>
        </>
      )}
      <p className="mt-8 text-xs text-faint">Дэвтэр энэ төхөөрөмж дээр хадгалагдана.</p>
    </div>
  );
}
