export const IB_THEMES = [
  "IDENTITIES",
  "EXPERIENCES",
  "HUMAN_INGENUITY",
  "SOCIAL_ORGANIZATION",
  "SHARING_THE_PLANET",
] as const;

export type IBTheme = (typeof IB_THEMES)[number];

export const IB_THEME_LABELS: Record<IBTheme, { es: string; en: string }> = {
  IDENTITIES: { es: "Identidades", en: "Identities" },
  EXPERIENCES: { es: "Experiencias", en: "Experiences" },
  HUMAN_INGENUITY: { es: "Ingenio humano", en: "Human Ingenuity" },
  SOCIAL_ORGANIZATION: { es: "Organización social", en: "Social Organization" },
  SHARING_THE_PLANET: { es: "Compartir el planeta", en: "Sharing the Planet" },
};

export function pickRandomTheme(exclude: string): IBTheme {
  const candidates = IB_THEMES.filter((t) => t !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}
