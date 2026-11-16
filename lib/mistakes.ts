"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "./auth";
import type { Question } from "./lessons";
import { readJson, writeStorage } from "./storage";

/**
 * The learner's mistake notebook: every question answered wrong, kept until
 * it is answered right in a revision session.
 *
 * Stored in localStorage per account (or for the guest) on this device —
 * it is not part of the progress synced to the server.
 */

export type Mistake = {
  question: Question;
  /** How many times it has been answered wrong. */
  missed: number;
  /** When it was last missed (ms since epoch). */
  at: number;
  /** What the learner answered last time, as text. */
  given: string;
};

export type Notebook = {
  /** Newest first, keyed by `question.id`. */
  open: Mistake[];
  /** How many mistakes have been fixed in revision, ever. */
  fixed: number;
};

const EMPTY: Notebook = { open: [], fixed: 0 };
const MAX_OPEN = 150;
const keyFor = (userId: string | undefined) => `mongolore:mistakes:${userId ?? "guest"}`;

const listeners = new Set<() => void>();
let cached: { key: string; value: Notebook } | null = null;

function read(key: string): Notebook {
  if (cached?.key !== key) {
    const saved = readJson<Partial<Notebook>>(key);
    cached = {
      key,
      value: saved && Array.isArray(saved.open) ? { open: saved.open, fixed: saved.fixed ?? 0 } : EMPTY,
    };
  }
  return cached.value;
}

function write(key: string, value: Notebook) {
  cached = { key, value };
  writeStorage(key, JSON.stringify(value));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function useMistakes() {
  const { user } = useAuth();
  const key = keyFor(user?.id);
  const notebook = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );

  /** Notes a wrong answer; a repeat miss moves the entry back to the top. */
  const record = useCallback(
    (question: Question, given: string) => {
      const book = read(key);
      const previous = book.open.find((m) => m.question.id === question.id);
      const entry: Mistake = { question, given, at: Date.now(), missed: (previous?.missed ?? 0) + 1 };
      const rest = book.open.filter((m) => m.question.id !== question.id);
      write(key, { ...book, open: [entry, ...rest].slice(0, MAX_OPEN) });
    },
    [key],
  );

  /** Answered right in revision: the mistake leaves the notebook. */
  const resolve = useCallback(
    (questionId: string) => {
      const book = read(key);
      if (!book.open.some((m) => m.question.id === questionId)) return;
      write(key, { open: book.open.filter((m) => m.question.id !== questionId), fixed: book.fixed + 1 });
    },
    [key],
  );

  return { notebook, record, resolve };
}
