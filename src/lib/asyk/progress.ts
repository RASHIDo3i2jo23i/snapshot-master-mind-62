import type { SkinId } from "./skins";
import type { ModeId } from "./levels";

export interface RecordEntry {
  name: string;
  score: number;
  date: string;
}

export interface Progress {
  coins: number;
  owned: SkinId[];
  skin: SkinId;
  stars: Record<number, number>;
  records: Partial<Record<ModeId, RecordEntry[]>>;
  name: string;
}

const KEY = "asyk_progress_v2";

export const DEFAULT_PROGRESS: Progress = {
  coins: 0,
  owned: ["wood", "lead"],
  skin: "wood",
  stars: {},
  records: {},
  name: "",
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const p = JSON.parse(raw) as Partial<Progress>;
    return { ...DEFAULT_PROGRESS, ...p, owned: p.owned?.length ? p.owned : DEFAULT_PROGRESS.owned };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Adds a record and returns the new progress plus the 1-based rank (0 if not in top 10). */
export function addRecord(p: Progress, mode: ModeId, score: number, fallbackName: string) {
  const list = [...(p.records[mode] ?? [])];
  const entry: RecordEntry = { name: p.name || fallbackName, score, date: new Date().toLocaleDateString() };
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  const rank = top.indexOf(entry) + 1;
  return { progress: { ...p, records: { ...p.records, [mode]: top } }, rank };
}

export function unlockedLevel(p: Progress) {
  let n = 1;
  while ((p.stars[n] ?? 0) > 0) n++;
  return n;
}
