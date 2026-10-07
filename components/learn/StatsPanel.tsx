"use client";

import { Cloud, CloudOff, Flame, Star, Target, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LESSONS } from "@/lib/lessons";
import { DAILY_GOAL, levelInfo, liveStreak, todayXp, useProgress } from "@/lib/progress";

/** Level, XP, streak and daily goal — the learner's dashboard. */
export function StatsPanel({ compact = false }: { compact?: boolean }) {
  const { progress, syncing, syncProblem } = useProgress();
  const { user, openDialog } = useAuth();
  const info = levelInfo(progress.xp);
  const streak = liveStreak(progress);
  const today = todayXp(progress);
  const goalPct = Math.min(100, Math.round((today / DAILY_GOAL) * 100));
  const done = Object.keys(progress.completed).length;
  const stars = Object.values(progress.completed).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <section className="rounded-3xl border border-gold/30 bg-[radial-gradient(120%_120%_at_100%_0%,rgb(232_176_75/0.18),transparent_60%)] p-5">
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(info.into / info.need) * 97.4} 97.4`}
                className="transition-[stroke-dasharray] duration-700"
              />
            </svg>
            <span className="font-serif text-2xl font-bold text-ink">{info.level}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Түвшин {info.level}</p>
            <p className="font-serif text-xl font-bold text-ink">{info.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              Дараагийн түвшин хүртэл {info.need - info.into} XP
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-orange-400/30 bg-orange-400/[0.06] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-200">
            <Flame className={`size-4 ${streak > 0 ? "fill-orange-400/70" : ""}`} aria-hidden /> Цуваа
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">
            {streak} <span className="text-sm font-semibold text-muted">өдөр</span>
          </p>
          {!compact && <p className="text-[11px] text-faint">Шилдэг: {progress.bestStreak}</p>}
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-soft">
            <Zap className="size-4" aria-hidden /> Нийт XP
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{progress.xp}</p>
          {!compact && (
            <p className="flex items-center gap-1 text-[11px] text-faint">
              <Star className="size-3 fill-current" aria-hidden /> {stars} од
            </p>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <Target className="size-4 text-emerald-300" aria-hidden /> Өдрийн зорилго
          </p>
          <p className="font-mono text-xs text-muted">
            {today}/{DAILY_GOAL} XP
          </p>
        </div>
        <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-[width] duration-700"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        {goalPct >= 100 && <p className="mt-2 text-xs font-semibold text-emerald-200">Өнөөдрийн зорилго биеллээ! 🎯</p>}
      </section>

      {!compact && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Trophy className="size-4 text-sky-soft" aria-hidden /> Хичээл
          </p>
          <p className="mt-1 text-sm text-muted">
            {done} / {LESSONS.length} дууссан
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-accent" style={{ width: `${(done / LESSONS.length) * 100}%` }} />
          </div>
        </section>
      )}

      {user && syncProblem ? (
        <p role="alert" className="flex items-start gap-1.5 rounded-xl bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
          <CloudOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {syncProblem === "tables_missing"
            ? "Сервер дээр хүснэгт үүсээгүй байна — ахиц энэ төхөөрөмж дээр түр хадгалагдаж байна."
            : "Ахицыг серверт хадгалж чадсангүй — энэ төхөөрөмж дээр түр хадгалагдаж байна."}
        </p>
      ) : user ? (
        <p className="flex items-center gap-1.5 px-1 text-xs text-faint">
          <Cloud className="size-3.5" aria-hidden />
          {syncing ? "Синк хийж байна…" : `${user.name} — ахиц хадгалагдсан`}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => openDialog("signup")}
          className="w-full rounded-2xl border-2 border-dashed border-gold/40 p-4 text-left text-sm transition hover:border-gold/70 hover:bg-gold/5"
        >
          <span className="font-semibold text-gold-soft">Ахицаа хадгалах уу?</span>
          <span className="mt-0.5 block text-muted">Бүртгүүлээд XP, цуваагаа хэзээ ч алдахгүй.</span>
        </button>
      )}
    </div>
  );
}
