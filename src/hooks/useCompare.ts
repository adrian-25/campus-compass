import { useEffect, useState, useCallback } from "react";

const KEY = "campusiq_compare";
const MAX = 3;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("campusiq:compare-changed"));
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>(() => (typeof window === "undefined" ? [] : read()));

  useEffect(() => {
    const handler = () => setIds(read());
    window.addEventListener("campusiq:compare-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("campusiq:compare-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback((id: string) => {
    const current = read();
    if (current.includes(id)) return { ok: false, reason: "exists" as const };
    if (current.length >= MAX) return { ok: false, reason: "full" as const };
    write([...current, id]);
    return { ok: true as const };
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x !== id));
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, add, remove, has, count: ids.length, max: MAX };
}
