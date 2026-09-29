import type { AsykKind } from "./engine";

export type ModeId = "free" | "campaign" | "pvp" | "alshy";

export interface LevelDef {
  asyks: { a: number; d: number; kind: AsykKind }[];
  stones?: { a: number; d: number; r: number }[];
  wind?: number;
  time?: number;
  moving?: boolean;
  throws: number;
}

const U = -Math.PI / 2; // "up" in the field
const D = Math.PI / 2; // towards the player

const FIVE: LevelDef["asyks"] = [
  { a: U, d: 148, kind: "gold" },
  { a: U + 1.25, d: 160, kind: "plain" },
  { a: U - 1.25, d: 160, kind: "plain" },
  { a: D - 0.5, d: 132, kind: "plain" },
  { a: D + 0.5, d: 132, kind: "plain" },
];

export const FREE_LEVEL: LevelDef = { asyks: FIVE, throws: 5 };
export const ALSHY_LEVEL: LevelDef = { asyks: FIVE, throws: 6 };
export const PVP_LEVEL: LevelDef = { asyks: FIVE, throws: 10 };

export const LEVELS: LevelDef[] = [
  // 1 — simple circle, 3 asyks
  { asyks: [{ a: U, d: 120, kind: "plain" }, { a: U + 1.6, d: 140, kind: "plain" }, { a: U - 1.6, d: 140, kind: "plain" }], throws: 5 },
  // 2 — stones
  {
    asyks: [{ a: U, d: 150, kind: "plain" }, { a: U + 1.1, d: 150, kind: "plain" }, { a: U - 1.1, d: 150, kind: "gold" }, { a: D, d: 150, kind: "plain" }],
    stones: [{ a: D - 0.9, d: 70, r: 26 }, { a: D + 0.9, d: 70, r: 26 }, { a: U, d: 40, r: 22 }],
    throws: 5,
  },
  // 3 — wind
  { asyks: [{ a: U, d: 140, kind: "plain" }, { a: U + 1.3, d: 150, kind: "plain" }, { a: U - 1.3, d: 150, kind: "plain" }, { a: D, d: 140, kind: "gold" }], wind: 140, throws: 5 },
  // 4 — timer
  { asyks: FIVE, time: 30, throws: 7 },
  // 5 — moving
  { asyks: [{ a: U, d: 140, kind: "plain" }, { a: U + 1.4, d: 150, kind: "gold" }, { a: U - 1.4, d: 150, kind: "plain" }, { a: D, d: 130, kind: "plain" }], moving: true, throws: 6 },
  // 6 — stones + wind
  { asyks: FIVE, stones: [{ a: D, d: 60, r: 28 }, { a: U + 0.6, d: 80, r: 22 }], wind: -150, throws: 6 },
  // 7 — strong wind
  { asyks: FIVE, wind: 200, throws: 6 },
  // 8 — moving + stones
  { asyks: FIVE, moving: true, stones: [{ a: D - 0.7, d: 80, r: 24 }, { a: D + 0.7, d: 80, r: 24 }], throws: 7 },
  // 9 — timer + wind
  { asyks: FIVE, time: 28, wind: -180, throws: 7 },
  // 10 — six asyks, stones, moving
  {
    asyks: [...FIVE, { a: 0, d: 170, kind: "plain" }],
    stones: [{ a: D, d: 50, r: 26 }, { a: Math.PI, d: 90, r: 22 }],
    moving: true,
    throws: 7,
  },
  // 11 — gale + timer
  { asyks: FIVE, wind: 240, time: 30, throws: 7 },
  // 12 — everything
  {
    asyks: [...FIVE, { a: Math.PI, d: 170, kind: "gold" }],
    stones: [{ a: D - 0.8, d: 70, r: 24 }, { a: D + 0.8, d: 70, r: 24 }, { a: U, d: 30, r: 20 }],
    wind: -220,
    time: 35,
    moving: true,
    throws: 8,
  },
];

/** Album card index → level that unlocks it (1-based). */
export const ALBUM_UNLOCK = [1, 2, 3, 5, 7, 9, 11, 12];
