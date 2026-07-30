import { useEffect, useState } from 'react';

/** Like useState, but persisted to localStorage under `key` (validated against `allowed`). */
export function useStoredState<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore (e.g. storage disabled) — the choice just won't persist
    }
  }, [key, value]);

  return [value, setValue];
}
