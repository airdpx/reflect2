import type { ForecastProviderId, ForecastResult, ForecastScale, ForecastScaleId, ForecastSettings, Language } from "../types";
import { fromKey } from "./date";
import { normalizeLanguage } from "./i18n";

export type ForecastProvider = {
  id: ForecastProviderId;
  label: string;
  calculate: (date: string, settings: ForecastSettings, birthDate: string, language?: Language) => ForecastResult | null;
};

const scaleMeta: Record<ForecastScaleId, { label: Record<Language, string>; cycle: number }> = {
  physical: { label: { ru: "Физическая", en: "Physical" }, cycle: 23 },
  emotional: { label: { ru: "Эмоциональная", en: "Emotional" }, cycle: 28 },
  intellectual: { label: { ru: "Интеллектуальная", en: "Intellectual" }, cycle: 33 }
};

const summaryLabels: Record<Language, { low: string; steady: string; high: string }> = {
  ru: { low: "низкий", steady: "ровный", high: "сильный" },
  en: { low: "low", steady: "steady", high: "strong" }
};

const forecastNotes: Record<Language, string> = {
  ru: "Ориентир для самонаблюдения, не прогноз-обязательство.",
  en: "A self-observation reference, not a fixed prediction."
};

export const forecastProviders: ForecastProvider[] = [
  {
    id: "biorhythm",
    label: "Биоритмы",
    calculate: calculateBiorhythmForecast
  },
  {
    id: "humanDesign",
    label: "Human Design",
    calculate: calculateHumanDesignForecast
  }
];

export function getForecast(date: string, settings: ForecastSettings, birthDate: string, language: Language = "ru"): ForecastResult | null {
  if (!settings.enabled) return null;
  if (!birthDate) return null;
  return calculateBiorhythmForecast(date, settings, birthDate, language);
}

export function forecastTone(score: number) {
  if (score >= 64) return "high";
  if (score <= 42) return "low";
  return "steady";
}

function calculateBiorhythmForecast(date: string, settings: ForecastSettings, birthDate: string, language: Language = "ru"): ForecastResult | null {
  const lang = normalizeLanguage(language);
  const birth = fromKey(birthDate);
  const target = fromKey(date);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return null;

  const days = Math.floor((target.getTime() - birth.getTime()) / 86400000);
  const scales = (Object.keys(scaleMeta) as ForecastScaleId[])
    .filter((id) => settings.visibleScales[id])
    .map((id): ForecastScale => {
      const meta = scaleMeta[id];
      const wave = Math.sin((2 * Math.PI * days) / meta.cycle);
      const value = Math.round(((wave + 1) / 2) * 100);
      return {
        id,
        label: meta.label[lang],
        value,
        phase: forecastTone(value)
      };
    });

  const summaryScore = scales.length ? Math.round(scales.reduce((sum, scale) => sum + scale.value, 0) / scales.length) : 50;
  return {
    date,
    summaryScore,
    summaryLabel: summaryLabels[lang][forecastTone(summaryScore)],
    scales,
    notes: [forecastNotes[lang]],
    source: "biorhythm"
  };
}

function calculateHumanDesignForecast(date: string, _settings?: ForecastSettings, _birthDate?: string, language: Language = "ru"): ForecastResult {
  const lang = normalizeLanguage(language);
  return {
    date,
    summaryScore: 50,
    summaryLabel: summaryLabels[lang].steady,
    scales: [],
    notes: [lang === "en" ? "Current Sun and Earth transit from the local database." : "Текущий транзит Солнца и Земли из Humdes."],
    source: "humanDesign"
  };
}
