import { fromKey } from "./date";
import type {
  Language,
  NumerologyMetric,
  NumerologyMetricId,
  NumerologyResult,
  NumerologySettings
} from "../types";
import { normalizeLanguage } from "./i18n";

const metricMeta: Record<NumerologyMetricId, { label: string; order: number }> = {
  personalDay: { label: "Personal Day", order: 0 },
  personalMonth: { label: "Personal Month", order: 1 },
  personalYear: { label: "Personal Year", order: 2 },
  lifePath: { label: "Life Path", order: 3 }
};

const interpretations: Record<number, { label: Record<Language, string>; note: Record<Language, string>; score: number }> = {
  1: { label: { ru: "Инициатива", en: "Initiative" }, note: { ru: "Подойдёт старт без лишних шагов.", en: "Good for starting without unnecessary steps." }, score: 56 },
  2: { label: { ru: "Согласование", en: "Alignment" }, note: { ru: "Хорошо для диалога и мягкой координации.", en: "Good for dialogue and gentle coordination." }, score: 49 },
  3: { label: { ru: "Выражение", en: "Expression" }, note: { ru: "Время слов, идей и заметных деталей.", en: "A day for words, ideas and visible details." }, score: 63 },
  4: { label: { ru: "Структура", en: "Structure" }, note: { ru: "Лучше собирать день в понятный порядок.", en: "Better to arrange the day into a clear order." }, score: 58 },
  5: { label: { ru: "Перемены", en: "Change" }, note: { ru: "Подходит для гибкости и небольших обновлений.", en: "Supports flexibility and small updates." }, score: 70 },
  6: { label: { ru: "Забота", en: "Care" }, note: { ru: "День поддерживающих действий и спокойной рутины.", en: "A day for supportive actions and calm routine." }, score: 53 },
  7: { label: { ru: "Глубина", en: "Depth" }, note: { ru: "Полезно уединение, анализ и вдумчивость.", en: "Useful for solitude, analysis and thoughtfulness." }, score: 61 },
  8: { label: { ru: "Результат", en: "Result" }, note: { ru: "Хорошо брать задачи с видимым итогом.", en: "Good for tasks with a visible outcome." }, score: 74 },
  9: { label: { ru: "Завершение", en: "Completion" }, note: { ru: "Уместно закрывать хвосты и подводить итоги.", en: "A fitting day to close loops and summarize." }, score: 67 },
  11: { label: { ru: "Интуиция", en: "Intuition" }, note: { ru: "День для тонкого чувства и тихих решений.", en: "A day for subtle sensing and quiet decisions." }, score: 86 },
  22: { label: { ru: "Масштаб", en: "Scale" }, note: { ru: "Можно думать шире и собирать систему.", en: "Good for wider thinking and building systems." }, score: 93 },
  33: { label: { ru: "Служение", en: "Service" }, note: { ru: "Хорошо делать полезное и заботливое.", en: "Good for doing something useful and caring." }, score: 97 }
};

const numerologySummaryLabels: Record<Language, { low: string; steady: string; high: string }> = {
  ru: { low: "низкий", steady: "ровный", high: "сильный" },
  en: { low: "low", steady: "steady", high: "strong" }
};

const masterNumbers = new Set([11, 22, 33]);

export function getNumerology(date: string, birthDate: string, settings: NumerologySettings, language: Language = "ru"): NumerologyResult | null {
  const lang = normalizeLanguage(language);
  const birth = fromKey(birthDate);
  const target = fromKey(date);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return null;

  const lifePath = reduceNumerology(sumDigits(birthDate));
  const personalYear = reduceNumerology(lifePath + sumDigits(target.getFullYear()));
  const personalMonth = reduceNumerology(personalYear + target.getMonth() + 1);
  const personalDay = reduceNumerology(personalMonth + target.getDate());

  const metrics: NumerologyMetric[] = [
    createMetric("personalDay", personalDay, settings.weights.personalDay, lang),
    createMetric("personalMonth", personalMonth, settings.weights.personalMonth, lang),
    createMetric("personalYear", personalYear, settings.weights.personalYear, lang),
    createMetric("lifePath", lifePath, settings.weights.lifePath, lang)
  ].sort((a, b) => metricMeta[a.id].order - metricMeta[b.id].order);

  const totalWeight = metrics.reduce((sum, metric) => sum + Math.max(0, metric.weight), 0);
  const summaryScore = totalWeight
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.score * Math.max(0, metric.weight), 0) / totalWeight)
    : 50;
  const summaryLabel = scoreToLabel(summaryScore, lang);
  const dominant = [...metrics].sort((a, b) => b.score * Math.max(0, b.weight) - a.score * Math.max(0, a.weight))[0];
  const recommendation = buildRecommendation(numerologyTone(summaryScore), dominant || metrics[0], lang);
  return {
    date,
    summaryScore,
    summaryLabel,
    metrics,
    recommendation,
    notes: [],
    source: "numerology"
  };
}

export function numerologyTone(score: number) {
  if (score >= 64) return "high";
  if (score <= 42) return "low";
  return "steady";
}

function createMetric(id: NumerologyMetricId, value: number, weight: number, language: Language): NumerologyMetric {
  const meaning = interpretations[value] || interpretations[reduceNumerology(value)] || interpretations[1];
  return {
    id,
    label: metricMeta[id].label,
    value,
    interpretation: `${meaning.label[language]} · ${meaning.note[language]}`,
    weight,
    score: meaning.score
  };
}

function buildRecommendation(tone: ReturnType<typeof numerologyTone>, dominant: NumerologyMetric, language: Language) {
  if (language === "en") {
    const lead = tone === "high"
      ? "You can take on more visible tasks without splitting the day into tiny pieces."
      : tone === "steady"
        ? "A good day for calm rhythm, consistency and gentle discipline."
        : "Keep the pace simpler and rely on one clear step at a time.";
    return `${lead} Daily anchor — ${dominant.label}: ${dominant.interpretation}`;
  }
  const lead = tone === "high"
    ? "Можно брать более заметные задачи и не дробить день на мелкие куски."
    : tone === "steady"
      ? "Хороший день для спокойного ритма, последовательности и мягкой дисциплины."
      : "Лучше держать темп проще и опираться на один понятный шаг за раз.";
  return `${lead} Опора дня — ${dominant.label}: ${dominant.interpretation}`;
}

function scoreToLabel(score: number, language: Language) {
  return numerologySummaryLabels[language][numerologyTone(score)];
}

function reduceNumerology(value: number) {
  let current = Math.abs(Math.trunc(value));
  if (!current) return 0;
  while (current > 9 && !masterNumbers.has(current)) {
    current = sumDigits(current);
  }
  return current;
}

function sumDigits(value: number | string) {
  return String(value)
    .replace(/\D/g, "")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}
