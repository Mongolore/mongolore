/** localStorage helpers that never throw (private mode, blocked storage, SSR). */

export function readStorage(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Ignore — the in-memory state still works for this visit.
  }
}

export function readJson<T>(key: string): T | null {
  const raw = readStorage(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * A localStorage-backed value for `useSyncExternalStore`: the server and the
 * first client render see `fallback`, then the stored value takes over
 * without a hydration mismatch.
 */
export function storedValue(key: string, fallback: string) {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    get: () => readStorage(key) ?? fallback,
    getServer: () => fallback,
    set(value: string) {
      writeStorage(key, value);
      listeners.forEach((l) => l());
    },
  };
}
