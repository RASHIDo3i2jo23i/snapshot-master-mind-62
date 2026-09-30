export type SkinId = "wood" | "lead" | "neon" | "cyber" | "clay" | "copper" | "jade" | "silver";

export interface Skin {
  price: number;
  speed: number;
  impulse: number;
  fill: string;
  light: string;
  edge: string;
  trail?: string;
  glow?: string;
}

export const SKIN_IDS: SkinId[] = ["wood", "lead", "clay", "copper", "jade", "silver", "neon", "cyber"];

export const SKINS: Record<SkinId, Skin> = {
  wood: { price: 0, speed: 1, impulse: 1, fill: "#b98a55", light: "#e2c08f", edge: "#6b4a26" },
  lead: { price: 200, speed: 0.8, impulse: 1.4, fill: "#8f97a3", light: "#c3cad3", edge: "#454b55" },
  clay: { price: 120, speed: 1.02, impulse: 0.94, fill: "#a9664e", light: "#e4aa83", edge: "#673d37" },
  copper: { price: 250, speed: 0.95, impulse: 1.16, fill: "#a96e42", light: "#edbe76", edge: "#623c2d" },
  jade: { price: 350, speed: 1.06, impulse: 1.02, fill: "#438d78", light: "#a1d7ae", edge: "#24574b", trail: "#85d4b3" },
  silver: { price: 420, speed: 1.01, impulse: 1.18, fill: "#a6bbc2", light: "#e4f2ed", edge: "#516f7b", trail: "#d5f2e8" },
  neon: { price: 500, speed: 1.04, impulse: 1.1, fill: "#f0b92f", light: "#fff0a8", edge: "#8a6410", trail: "#ffd766", glow: "#ffcf40" },
  cyber: { price: 800, speed: 1.08, impulse: 1.15, fill: "#2a2f4a", light: "#5ef2ff", edge: "#ff3fd1", trail: "#5ef2ff", glow: "#ff3fd1" },
};
