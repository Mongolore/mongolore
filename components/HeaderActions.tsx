"use client";

import { Flame, Languages, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { levelInfo, liveStreak, useProgress } from "@/lib/progress";

const iconButton =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-sm text-muted transition hover:border-white/25 hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent";

export function LanguageToggle() {
  const { lang, toggle, status } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      className={iconButton}
      aria-label={lang === "mn" ? "Translate to English" : "Монгол хэл рүү буцах"}
      title={lang === "mn" ? "Translate to English" : "Монгол хэл рүү буцах"}
      data-no-translate
    >
      <Languages className={`size-4 ${status === "translating" ? "animate-pulse text-sky-soft" : ""}`} aria-hidden />
      <span className="font-semibold tracking-wide">
        <span className={lang === "mn" ? "text-ink" : "text-faint"}>MN</span>
        <span className="mx-1 text-faint">/</span>
        <span className={lang === "en" ? "text-ink" : "text-faint"}>EN</span>
      </span>
    </button>
  );
}

function UserMenu() {
  const { user, openDialog, signOut, loading } = useAuth();
  const { progress } = useProgress();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { level } = levelInfo(progress.xp);
  const streak = liveStreak(progress);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stats = (
    <Link
      href="/learn"
      className={`${iconButton} gap-2.5`}
      title={`${streak} өдрийн цуваа · ${progress.xp} XP`}
    >
      <span className={`flex items-center gap-1 font-semibold ${streak > 0 ? "text-orange-300" : "text-faint"}`}>
        <Flame className={`size-4 ${streak > 0 ? "fill-orange-400/60" : ""}`} aria-hidden />
        {streak}
      </span>
      <span className="font-semibold text-gold-soft">{progress.xp} XP</span>
    </Link>
  );

  if (loading) return stats;

  if (!user) {
    return (
      <>
        <span className="hidden sm:contents">{stats}</span>
        <button
          type="button"
          onClick={() => openDialog("login")}
          className="h-9 rounded-lg bg-gold px-3.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Нэвтрэх
        </button>
      </>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <span className="hidden sm:contents">{stats}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${user.name} — профайл`}
        className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-gold to-orange-500 font-serif font-bold text-navy-950 ring-2 ring-navy-900 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent"
      >
        {user.name.charAt(0).toUpperCase()}
        <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-navy-950 text-[9px] font-bold text-gold ring-1 ring-gold/60">
          {level}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-60 rounded-xl border border-white/10 bg-navy-800 p-2 shadow-2xl"
        >
          <div className="px-3 py-2">
            <p className="font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-faint">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            href="/learn"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink"
          >
            Миний ахиц
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-white/5 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden />
            Гарах
          </button>
        </div>
      )}
    </div>
  );
}

/** Language and account controls for every page header. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <LanguageToggle />
      <UserMenu />
    </div>
  );
}
