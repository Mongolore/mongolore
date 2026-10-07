"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Languages, Square, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useNarration } from "@/lib/narration";

/** Bottom-left pills: "reading aloud" with a stop button, and translation progress or errors. */
export function StatusToasts() {
  const { lang, status } = useLanguage();
  const { now, stop, fallbackVoice } = useNarration();
  const speaking = now?.status === "playing";

  const translating = lang === "en" && status === "translating";
  const failed = lang === "en" && status === "error";

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[75] flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2">
      <AnimatePresence>
        {speaking && (
          <motion.div
            key="speaking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-gold/40 bg-navy-800/95 py-1.5 pr-1.5 pl-4 text-sm text-ink shadow-xl backdrop-blur"
          >
            <span aria-hidden className="flex h-4 items-end gap-[3px]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-[3px] animate-[eq_0.9s_ease-in-out_infinite] rounded-full bg-gold"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            <span>
              Уншиж байна
              {fallbackVoice && <span className="ml-1 text-xs text-faint">(AI хоолой холбогдсонгүй)</span>}
            </span>
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-sky-accent"
            >
              <Square className="size-3 fill-current" aria-hidden />
              Зогсоох
            </button>
          </motion.div>
        )}
        {translating && (
          <motion.div
            key="translating"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="status"
            className="flex items-center gap-2 rounded-full border border-sky-accent/40 bg-navy-800/95 px-4 py-2 text-sm text-ink shadow-xl backdrop-blur"
          >
            <Languages className="size-4 animate-pulse text-sky-soft" aria-hidden />
            Translating…
          </motion.div>
        )}
        {failed && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="alert"
            data-no-translate
            className="flex max-w-sm items-start gap-2 rounded-2xl border border-rose-400/40 bg-navy-800/95 px-4 py-2.5 text-sm text-ink shadow-xl backdrop-blur"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-300" aria-hidden />
            Some text couldn&apos;t be translated. Check your internet connection and switch language again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
