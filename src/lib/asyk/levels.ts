import type { AsykKind } from "./engine";

export type ModeId = "free" | "campaign" | "pvp" | "alshy";
export type Formation = "ring" | "line" | "arc" | "diamond" | "clusters" | "spiral";

export interface LevelDef {
  asyks: { a: number; d: number; kind: AsykKind }[];
  stones?: { a: number; d: number; r: number }[];
  wind?: number;
  time?: number;
  moving?: boolean;
  throws: number;
}

const U = -Math.PI / 2;
const D = Math.PI / 2;

/** Positions stay within the kon while keeping enough room between bones. */
export function formation(count: number, shape: Formation, gold = false): LevelDef["asyks"] {
  return Array.from({ length: count }, (_, i) => {
    let x = 0;
    let y = 0;
    if (shape === "line") {
      x = (i - (count - 1) / 2) * Math.min(56, 330 / Math.max(1, count - 1));
      y = (i % 2) * 5 - 5;
    } else if (shape === "arc") {
      const a = Math.PI * (0.2 + 0.6 * i / Math.max(1, count - 1));
      x = Math.cos(a) * 165;
      y = Math.sin(a) * 140 - 65;
    } else if (shape === "diamond") {
      const row = Math.floor(i / 3);
      const col = i % 3;
      x = (col - 1) * 63 + (row % 2) * 25;
      y = (row - 1) * 60;
    } else if (shape === "clusters") {
      const group = i % 2;
      const slot = Math.floor(i / 2);
      x = (group ? 95 : -95) + (slot % 2) * 45 - 20;
      y = (Math.floor(slot / 2) - 1) * 52;
    } else if (shape === "spiral") {
      const a = i * 2.4;
      const r = 60 + i * 16;
      x = Math.cos(a) * r;
      y = Math.sin(a) * r * 0.85;
    } else {
      const a = U + i * Math.PI * 2 / count;
      x = Math.cos(a) * 155;
      y = Math.sin(a) * 155;
    }
    return { a: Math.atan2(y, x), d: Math.hypot(x, y), kind: gold && i === Math.floor(count / 2) ? "gold" as const : "plain" as const };
  });
}

export const FREE_LEVEL: LevelDef = { asyks: formation(5, "ring", true), throws: 5 };
export const ALSHY_LEVEL: LevelDef = { asyks: formation(4, "diamond", true), throws: 6 };
export const PVP_LEVEL: LevelDef = { asyks: formation(6, "ring", true), throws: 10 };

const stonesA = [{ a: D - 0.9, d: 70, r: 26 }, { a: D + 0.9, d: 70, r: 26 }];
const stonesB = [{ a: U, d: 45, r: 24 }, { a: D, d: 115, r: 23 }];

export const LEVELS: LevelDef[] = [
  { asyks: formation(3, "line"), throws: 5 },
  { asyks: formation(4, "ring"), stones: stonesA, throws: 5 },
  { asyks: formation(4, "arc", true), wind: 520, throws: 5 },
  { asyks: formation(5, "diamond", true), time: 30, throws: 7 },
  { asyks: formation(4, "clusters", true), moving: true, throws: 6 },
  { asyks: formation(6, "line", true), stones: stonesB, wind: -600, throws: 7 },
  { asyks: formation(5, "spiral", true), wind: 680, throws: 6 },
  { asyks: formation(6, "ring", true), moving: true, stones: stonesA, throws: 7 },
  { asyks: formation(5, "arc", true), time: 32, wind: -650, throws: 7 },
  { asyks: formation(7, "diamond", true), stones: stonesB, throws: 8 },
  { asyks: formation(6, "clusters", true), wind: 750, time: 35, throws: 8 },
  { asyks: formation(8, "spiral", true), stones: stonesA, moving: true, wind: -580, throws: 9 },
  { asyks: formation(3, "arc", true), time: 22, throws: 5 },
  { asyks: formation(7, "line", true), moving: true, wind: -720, throws: 8 },
  { asyks: formation(8, "ring", true), stones: stonesB, throws: 9 },
  { asyks: formation(6, "diamond", true), time: 27, wind: 800, throws: 7 },
  { asyks: formation(8, "clusters", true), stones: stonesA, moving: true, throws: 9 },
  { asyks: formation(9, "spiral", true), stones: stonesB, wind: -820, time: 42, throws: 10 },
];

/** Album card index → level that unlocks it (0 = open from the start). */
export const ALBUM_UNLOCK = [0, 1, 2, 4, 6, 9, 13, 18];
