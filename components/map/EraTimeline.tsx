"use client";

import { ChevronLeft, ChevronRight, ChevronsLeftRight } from "lucide-react";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Era } from "@/data/eras";
import { TIMELINE } from "@/data/site";

type EraTimelineProps = {
  eras: Era[];
  index: number;
  onChange: (index: number) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function EraTimeline({ eras, index, onChange }: EraTimelineProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const last = eras.length - 1;
  const stepPercent = (i: number) => (last === 0 ? 0 : (i / last) * 100);
  // While dragging the handle follows the pointer; released, it snaps to the era.
  const percent = dragPercent ?? stepPercent(index);

  const percentFromPointer = useCallback((clientX: number) => {
    const rail = railRef.current;
    if (!rail) return null;
    const rect = rail.getBoundingClientRect();
    if (rect.width === 0) return null;
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  }, []);

  const move = useCallback(
    (clientX: number) => {
      const next = percentFromPointer(clientX);
      if (next === null) return;
      setDragPercent(next);
      onChange(Math.round((next / 100) * last));
    },
    [last, onChange, percentFromPointer],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    move(e.clientX);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragPercent(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      Home: 0,
      End: last,
      PageDown: index - 2,
      PageUp: index + 2,
    };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(clamp(next, 0, last));
  };

  const era = eras[index];

  return (
    <div className="select-none px-4 py-4 sm:px-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">
          {TIMELINE.label}
        </p>
        <p className="hidden items-center gap-1.5 text-xs text-faint sm:flex">
          <ChevronsLeftRight className="size-3.5" aria-hidden />
          {TIMELINE.hint}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(index - 1, 0, last))}
          disabled={index === 0}
          aria-label={TIMELINE.previous}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-muted transition hover:border-white/30 hover:text-ink disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-sky-accent"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <div
          ref={railRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative h-10 flex-1 cursor-pointer touch-none"
        >
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
          <span
            aria-hidden
            className={`absolute top-1/2 left-0 h-px -translate-y-1/2 bg-gradient-to-r from-gold/40 to-gold ${
              dragPercent === null ? "transition-[width] duration-300 ease-out" : ""
            }`}
            style={{ width: `${percent}%` }}
          />

          {eras.map((item, i) => {
            const active = i <= index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(i)}
                style={{ left: `${stepPercent(i)}%` }}
                className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent"
                aria-label={`${item.name} (${item.period})`}
                aria-current={i === index}
                tabIndex={-1}
              >
                <span
                  aria-hidden
                  className={`size-2 rounded-full transition-colors ${
                    active ? "bg-gold" : "bg-white/25"
                  }`}
                />
              </button>
            );
          })}

          <div
            role="slider"
            tabIndex={0}
            aria-label={TIMELINE.handleLabel}
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={index}
            aria-valuetext={`${era.name}, ${era.period}`}
            onKeyDown={onKeyDown}
            style={{ left: `${percent}%` }}
            className={`absolute top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full border border-gold-soft bg-gold text-navy-950 shadow-[0_6px_18px_-6px_rgb(232_176_75/0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:cursor-grabbing ${
              dragPercent === null ? "transition-[left] duration-300 ease-out" : ""
            }`}
          >
            <ChevronsLeftRight className="size-4" aria-hidden />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange(clamp(index + 1, 0, last))}
          disabled={index === last}
          aria-label={TIMELINE.next}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-muted transition hover:border-white/30 hover:text-ink disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-sky-accent"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Period labels: every tick on wide screens, ends only on narrow ones */}
      <div aria-hidden className="relative mx-11 mt-1 hidden h-4 sm:mx-12 md:block">
        {eras.map((item, i) => (
          <span
            key={item.id}
            style={{ left: `${stepPercent(i)}%` }}
            className={`absolute -translate-x-1/2 font-mono text-[10px] whitespace-nowrap transition-colors ${
              i === index ? "text-gold" : "text-faint"
            }`}
          >
            {item.period}
          </span>
        ))}
      </div>
      <div aria-hidden className="mx-11 mt-1 flex justify-between font-mono text-[10px] text-faint md:hidden">
        <span>{eras[0].period}</span>
        <span>{eras[last].period}</span>
      </div>
    </div>
  );
}
