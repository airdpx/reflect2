import { fromKey } from "./date";
import type {
  NumerologyMetric,
  NumerologyMetricId,
  NumerologyResult,
  NumerologySettings
} from "../types";

const metricMeta: Record<NumerologyMetricId, { label: string; order: number }> = {
  personalDay: { label: "Personal Day", order: 0 },
  personalMonth: { label: "Personal Month", order: 1 },
  personalYear: { label: "Personal Year", order: 2 },
  lifePath: { label: "Life Path", order: 3 }
};

const interpretations: Record<number, { label: string; note: string; score: number }> = {
  1: { label: "инициатива", note: "Подойдёт старт без лишних шагов.", score: 56 },
  2: { label: "согласование", note: "Хорошо для диалога и мягкой координации.", score: 49 },
  3: { label: "выражение", note: "Время слов, идей и заметных деталей.", score: 63 },
  4: { label: "структура", note: "Лучше собирать день в понятный порядок.", score: 58 },
  5: { label: "перемены", note: "Подходит для гибкости и небольших обновлений.", score: 70 },
  6: { label: "забота", note: "День поддерживающих действий и спокойной рутины.", score: 53 },
  7: { label: "глубина", note: "Полезно уединение, анализ и вдумчивость.", score: 61 },
  8: { label: "результат", note: "Хорошо брать задачи с видимым итогом.", score: 74 },
  9: { label: "завершение", note: "Уместно закрывать хвосты и подводить итоги.", score: 67 },
  11: { label: "интуиция", note: "День для тонкого чувства и тихих решений.", score: 86 },
  22: { label: "масштаб", note: "Можно думать шире и собирать систему.", score: 93 },
  33: { label: "служение", note: "Хорошо делать полезное и заботливое.", score: 97 }
};

const masterNumbers = new Set([11, 22, 33]);

export function getNumerology(date: string, birthDate: string, settings: NumerologySettings): NumerologyResult | null {
  const birth = fromKey(birthDate);
  const target = fromKey(date);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return null;

  const lifePath = reduceNumerology(sumDigits(birthDate));
  const personalYear = reduceNumerology(lifePath + sumDigits(target.getFullYear()));
  const personalMonth = reduceNumerology(personalYear + target.getMonth() + 1);
  const personalDay = reduceNumerology(personalMonth + target.getDate());

  const metrics: NumerologyMetric[] = [
    createMetric("personalDay", personalDay, settings.weights.personalDay),
    createMetric("personalMonth", personalMonth, settings.weights.personalMonth),
    createMetric("personalYear", personalYear, settings.weights.personalYear),
    createMetric("lifePath", lifePath, settings.weights.lifePath)
  ].sort((a, b) => metricMeta[a.id].order - metricMeta[b.id].order);

  const totalWeight = metrics.reduce((sum, metric) => sum + Math.max(0, metric.weight), 0);
  const summaryScore = totalWeight
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.score * Math.max(0, metric.weight), 0) / totalWeight)
    : 50;
  const summaryLabel = scoreToLabel(summaryScore);
  const dominant = [...metrics].sort((a, b) => b.score * Math.max(0, b.weight) - a.score * Math.max(0, a.weight))[0];
  const recommendation = buildRecommendation(summaryLabel, dominant || metrics[0]);
  const notes = [
    `В расчёте участвуют ${metrics.map((metric) => `${metric.label} ${metric.value}`).join(" · ")}.`,
    dominant ? `Сильнее всего сейчас звучит ${dominant.label}: ${dominant.interpretation}.` : "Нумерологический индекс рассчитан по дате рождения и выбранному дню."
  ];

  return {
    date,
    summaryScore,
    summaryLabel,
    metrics,
    recommendation,
    notes,
    source: "numerology"
  };
}

export function numerologyTone(score: number) {
  if (score >= 64) return "high";
  if (score <= 42) return "low";
  return "steady";
}

function createMetric(id: NumerologyMetricId, value: number, weight: number): NumerologyMetric {
  const meaning = interpretations[value] || interpretations[reduceNumerology(value)] || interpretations[1];
  return {
    id,
    label: metricMeta[id].label,
    value,
    interpretation: `${meaning.label} · ${meaning.note}`,
    weight,
    score: meaning.score
  };
}

function buildRecommendation(summaryLabel: NumerologyResult["summaryLabel"], dominant: NumerologyMetric) {
  const lead = summaryLabel === "сильный"
    ? "Можно брать более заметные задачи и не дробить день на мелкие куски."
    : summaryLabel === "ровный"
      ? "Хороший день для спокойного ритма, последовательности и мягкой дисциплины."
      : "Лучше держать темп проще и опираться на один понятный шаг за раз.";
  return `${lead} Опора дня — ${dominant.label}: ${dominant.interpretation}.`;
}

function scoreToLabel(score: number): NumerologyResult["summaryLabel"] {
  if (score >= 64) return "сильный";
  if (score <= 42) return "низкий";
  return "ровный";
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
