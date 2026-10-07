"use client";

import { Loader2, Square, Volume2 } from "lucide-react";
import { useNarration } from "@/lib/narration";

type ListenButtonProps = {
  /** `id` of the element whose text is read aloud. The button may sit inside it. */
  target: string;
  className?: string;
};

/** A small "Сонсох" (listen) pill that reads one block of text aloud, Wikipedia-style. */
export function ListenButton({ target, className = "" }: ListenButtonProps) {
  const { now, play, stop } = useNarration();
  const active = now?.key === target;
  const loading = active && now.status === "loading";

  return (
    <button
      type="button"
      data-listen-skip
      onClick={() => {
        if (active) return stop();
        const el = document.getElementById(target);
        if (el) play(target, el);
      }}
      aria-pressed={active}
      aria-label={active ? "Уншихыг зогсоох" : "Чангаар уншуулж сонсох"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent ${
        active
          ? "border-gold/60 bg-gold/15 text-gold-soft"
          : "border-white/15 text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold-soft"
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : active ? (
        <Square className="size-3 fill-current" aria-hidden />
      ) : (
        <Volume2 className="size-3.5" aria-hidden />
      )}
      {active ? "Зогсоох" : "Сонсох"}
    </button>
  );
}
