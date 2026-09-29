export type SkinId = "wood" | "lead" | "neon" | "cyber";

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

export const SKIN_IDS: SkinId[] = ["wood", "lead", "neon", "cyber"];

export const SKINS: Record<SkinId, Skin> = {
  wood: { price: 0, speed: 1, impulse: 1, fill: "#b98a55", light: "#e2c08f", edge: "#6b4a26" },
  lead: { price: 200, speed: 0.8, impulse: 1.4, fill: "#8f97a3", light: "#c3cad3", edge: "#454b55" },
  neon: {
    price: 500,
    speed: 1.04,
    impulse: 1.1,
    fill: "#f0b92f",
    light: "#fff0a8",
    edge: "#8a6410",
    trail: "#ffd766",
    glow: "#ffcf40",
  },
  cyber: {
    price: 800,
    speed: 1.08,
    impulse: 1.15,
    fill: "#2a2f4a",
    light: "#5ef2ff",
    edge: "#ff3fd1",
    trail: "#5ef2ff",
    glow: "#ff3fd1",
  },
};
