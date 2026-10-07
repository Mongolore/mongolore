"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { levelInfo } from "./levels";
import { readJson, writeStorage } from "./storage";
import { supabase } from "./supabase";

/**
 * Learner progress: XP, level, daily streak, daily goal and finished lessons.
 *
 * Guests keep progress in localStorage. Signed-in users also sync it to
 * their account through /api/progress (stored in Supabase); on first
 * sign-in, guest progress is merged into the account so nothing earned is lost.
 */

export type Progress = {
  xp: number;
  streak: number;
  bestStreak: number;
  /** Local date (YYYY-MM-DD) of the last XP earned. */
  lastActiveDay: string | null;
  /** Lesson id → best stars (1–3). */
  completed: Record<string, number>;
  /** One-off rewards already paid out (era quizzes, daily questions). */
  claimed: Record<string, true>;
  daily: { day: string; xp: number };
};

export const DAILY_GOAL = 50;

const EMPTY: Progress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  completed: {},
  claimed: {},
  daily: { day: "", xp: 0 },
};

const GUEST_KEY = "mongolore:progress:guest";
const userKey = (id: string) => `mongolore:progress:${id}`;

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/** Streak still alive today (earned today or yesterday). */
export function liveStreak(p: Progress) {
  return p.lastActiveDay === dayKey() || p.lastActiveDay === yesterday() ? p.streak : 0;
}

export function todayXp(p: Progress) {
  return p.daily.day === dayKey() ? p.daily.xp : 0;
}

export { LEVEL_TITLES, levelInfo } from "./levels";

/* ---------------- Merge & normalise ---------------- */

function normalise(raw: Partial<Progress> | null | undefined): Progress {
  return { ...EMPTY, ...raw, completed: { ...raw?.completed }, claimed: { ...raw?.claimed }, daily: raw?.daily ?? EMPTY.daily };
}

function merge(a: Progress, b: Progress): Progress {
  const completed = { ...a.completed };
  for (const [id, stars] of Object.entries(b.completed)) completed[id] = Math.max(completed[id] ?? 0, stars);
  const later = (a.lastActiveDay ?? "") >= (b.lastActiveDay ?? "") ? a : b;
  const daily =
    a.daily.day === b.daily.day
      ? { day: a.daily.day, xp: Math.max(a.daily.xp, b.daily.xp) }
      : a.daily.day > b.daily.day
        ? a.daily
        : b.daily;
  return {
    xp: Math.max(a.xp, b.xp),
    streak: later.streak,
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    lastActiveDay: later.lastActiveDay,
    completed,
    claimed: { ...a.claimed, ...b.claimed },
    daily,
  };
}

/* ---------------- Server sync ---------------- */

export type SyncProblem = "tables_missing" | "failed";

class SyncError extends Error {
  constructor(readonly problem: SyncProblem) {
    super(problem);
  }
}

const problemOf = (e: unknown): SyncProblem => (e instanceof SyncError ? e.problem : "failed");

async function remote(method: "GET" | "PUT", body?: Progress): Promise<Progress | null> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) return null;
  const res = await fetch("/api/progress", {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify({ data: body }) : undefined,
    keepalive: method === "PUT",
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new SyncError(error === "tables_missing" ? "tables_missing" : "failed");
  }
  if (method === "PUT") return null;
  const { data } = (await res.json()) as { data: Progress | null };
  return data;
}

/* ---------------- Provider ---------------- */

export type Award = {
  xp: number;
  /** Marks a lesson finished with this many stars. */
  lesson?: { id: string; stars: number };
  /** Pays out only once per key. */
  claim?: string;
};

export type AwardResult = { granted: boolean; leveledUp: boolean; level: number; goalReached: boolean; streak: number };

type ProgressContextValue = {
  progress: Progress;
  ready: boolean;
  syncing: boolean;
  /** Set when progress couldn't be loaded from or saved to the account. */
  syncProblem: SyncProblem | null;
  award: (award: Award) => AwardResult;
  hasClaimed: (key: string) => boolean;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProblem, setSyncProblem] = useState<SyncProblem | null>(null);
  const progressRef = useRef(progress);
  const storageKey = useRef(GUEST_KEY);
  const remoteTimer = useRef<number | null>(null);

  const userId = user?.id;

  // Load progress for whoever is signed in (or the guest).
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        storageKey.current = GUEST_KEY;
        return normalise(readJson<Progress>(GUEST_KEY));
      }
      storageKey.current = userKey(userId);
      // The device cache and the server copy are the same account: keep the best of both.
      let merged = normalise(readJson<Progress>(userKey(userId)));
      setSyncing(true);
      try {
        const saved = await remote("GET");
        if (saved) merged = merge(merged, normalise(saved));
      } catch (e) {
        console.warn("[progress] could not load saved progress", e);
        setSyncProblem(problemOf(e));
      }
      // Guest progress was earned separately, so its XP adds on top.
      const guest = normalise(readJson<Progress>(GUEST_KEY));
      if (guest.xp > 0) merged = { ...merge(merged, guest), xp: merged.xp + guest.xp };
      try {
        await remote("PUT", merged);
        writeStorage(GUEST_KEY, null);
        setSyncProblem(null);
      } catch (e) {
        console.warn("[progress] could not save progress", e);
        setSyncProblem(problemOf(e));
      }
      setSyncing(false);
      writeStorage(userKey(userId), JSON.stringify(merged));
      return merged;
    };

    void load().then((loaded) => {
      if (cancelled) return;
      progressRef.current = loaded;
      setProgress(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  const save = useCallback(
    (next: Progress) => {
      writeStorage(storageKey.current, JSON.stringify(next));
      if (!userId) return;
      if (remoteTimer.current !== null) window.clearTimeout(remoteTimer.current);
      remoteTimer.current = window.setTimeout(() => {
        remoteTimer.current = null;
        remote("PUT", progressRef.current)
          .then(() => setSyncProblem(null))
          .catch((e) => {
            console.warn("[progress] could not save progress", e);
            setSyncProblem(problemOf(e));
          });
      }, 800);
    },
    [userId],
  );

  const award = useCallback(
    ({ xp, lesson, claim }: Award): AwardResult => {
      const prev = progressRef.current;
      if (claim && prev.claimed[claim]) {
        return { granted: false, leveledUp: false, level: levelInfo(prev.xp).level, goalReached: false, streak: liveStreak(prev) };
      }
      const today = dayKey();
      const streak =
        xp <= 0 || prev.lastActiveDay === today
          ? liveStreak(prev)
          : prev.lastActiveDay === yesterday()
            ? prev.streak + 1
            : 1;
      const dailyBefore = todayXp(prev);
      const next: Progress = {
        ...prev,
        xp: prev.xp + xp,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
        lastActiveDay: xp > 0 ? today : prev.lastActiveDay,
        daily: { day: today, xp: dailyBefore + xp },
        completed: lesson
          ? { ...prev.completed, [lesson.id]: Math.max(prev.completed[lesson.id] ?? 0, lesson.stars) }
          : prev.completed,
        claimed: claim ? { ...prev.claimed, [claim]: true } : prev.claimed,
      };
      progressRef.current = next;
      setProgress(next);
      save(next);
      const before = levelInfo(prev.xp).level;
      const after = levelInfo(next.xp).level;
      return {
        granted: true,
        leveledUp: after > before,
        level: after,
        goalReached: dailyBefore < DAILY_GOAL && dailyBefore + xp >= DAILY_GOAL,
        streak,
      };
    },
    [save],
  );

  const hasClaimed = useCallback((key: string) => Boolean(progress.claimed[key]), [progress]);

  return (
    <ProgressContext.Provider value={{ progress, ready, syncing, syncProblem, award, hasClaimed }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}
