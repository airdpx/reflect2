import type { InterfaceTheme, Language, UserSettings } from "../types";

export const PUBLIC_THEME_STORAGE_KEY = "reflect2_public_theme";

export type PublicThemeState = {
  theme: InterfaceTheme;
  language?: Language;
  customTheme?: UserSettings["customTheme"];
};

const themeIds: InterfaceTheme[] = [
  "light",
  "mint",
  "rose",
  "citrus",
  "sand",
  "warm",
  "sage",
  "blue",
  "ash",
  "yellowMono",
  "glacier",
  "dark",
  "contrast",
  "graphite",
  "steel",
  "smoke",
  "granite",
  "zinc",
  "graphiteGold",
  "orangeGrey",
  "coralGrey",
  "sunset",
  "berry",
  "lagoon",
  "violet",
  "forest",
  "aurora",
  "rain",
  "ember",
  "nocturne",
  "obsidian",
  "ink",
  "bronzeNight",
  "custom"
];

export function loadPublicThemeState(defaultTheme: InterfaceTheme = "dark"): PublicThemeState {
  if (typeof window === "undefined") return { theme: defaultTheme };
  const saved = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);
  if (!saved) return { theme: defaultTheme };

  try {
    const parsed = JSON.parse(saved) as Partial<PublicThemeState> | string;
    if (typeof parsed === "string") {
      return themeIds.includes(parsed as InterfaceTheme) ? { theme: parsed as InterfaceTheme } : { theme: defaultTheme };
    }
    if (parsed && typeof parsed === "object" && parsed.theme && themeIds.includes(parsed.theme)) {
      return {
        theme: parsed.theme,
        language: parsed.language === "en" ? "en" : parsed.language === "ru" ? "ru" : undefined,
        customTheme: parsed.customTheme
      };
    }
  } catch {
    if (themeIds.includes(saved as InterfaceTheme)) {
      return { theme: saved as InterfaceTheme };
    }
  }

  return { theme: defaultTheme };
}

export function savePublicThemeState(state: PublicThemeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, JSON.stringify(state));
}
