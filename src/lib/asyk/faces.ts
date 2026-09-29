export type Face = "alshy" | "taike" | "buk" | "shik";

export const FACE_NAME: Record<Face, string> = {
  alshy: "Алшы",
  taike: "Тәйке",
  buk: "Бүк",
  shik: "Шік",
};

export const FACE_MULT: Record<Face, number> = { alshy: 3, taike: 2, buk: 1, shik: 1 };

/** Alshy is the rarest face, then taike; buk/shik are the common flat sides. */
export function rollFace(alshyChance = 0.08): Face {
  const r = Math.random();
  if (r < alshyChance) return "alshy";
  if (r < alshyChance + 0.17) return "taike";
  if (r < alshyChance + 0.17 + (1 - alshyChance - 0.17) / 2) return "buk";
  return "shik";
}
