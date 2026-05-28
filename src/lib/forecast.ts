import type { ForecastProviderId, ForecastResult, ForecastScale, ForecastScaleId, ForecastSettings } from "../types";
import { fromKey } from "./date";

export type ForecastProvider = {
  id: ForecastProviderId;
  label: string;
  calculate: (date: string, settings: ForecastSettings) => ForecastResult | null;
};

const scaleMeta: Record<ForecastScaleId, { label: string; cycle: number }> = {
  physical: { label: "Физическая", cycle: 23 },
  emotional: { label: "Эмоциональная", cycle: 28 },
  intellectual: { label: "Интеллектуальная", cycle: 33 }
};

export const forecastProviders: ForecastProvider[] = [
  {
    id: "biorhythm",
    label: "Биоритмы",
    calculate: calculateBiorhythmForecast
  }
];

export function getForecast(date: string, settings: ForecastSettings): ForecastResult | null {
  if (!settings.enabled || !settings.birthDate) return null;
  const provider = forecastProviders.find((item) => item.id === settings.provider) || forecastProviders[0];
  return provider.calculate(date, settings);
}

export function forecastTone(score: number) {
  if (score >= 64) return "high";
  if (score <= 42) return "low";
  return "steady";
}

function calculateBiorhythmForecast(date: string, settings: ForecastSettings): ForecastResult | null {
  const birth = fromKey(settings.birthDate);
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
        label: meta.label,
        value,
        phase: forecastTone(value)
      };
    });

  const summaryScore = scales.length ? Math.round(scales.reduce((sum, scale) => sum + scale.value, 0) / scales.length) : 50;
  return {
    date,
    summaryScore,
    summaryLabel: summaryScore >= 64 ? "сильный" : summaryScore <= 42 ? "низкий" : "ровный",
    scales,
    notes: ["Ориентир для самонаблюдения, не прогноз-обязательство."],
    source: "biorhythm"
  };
}
