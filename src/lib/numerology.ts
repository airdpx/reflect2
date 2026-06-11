import { fromKey } from "./date";
import { createDefaultRuntimeContent } from "./runtime-content";
import type {
  Language,
  NumerologyMetric,
  NumerologyMetricId,
  NumerologyResult,
  NumerologySettings
} from "../types";
import { normalizeLanguage } from "./i18n";

const masterNumbers = new Set([11, 22, 33]);

export function getNumerology(date: string, birthDate: string, settings: NumerologySettings, language: Language = "ru", content = createDefaultRuntimeContent()): NumerologyResult | null {
  const lang = normalizeLanguage(language);
  const birth = fromKey(birthDate);
  const target = fromKey(date);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return null;

  const lifePath = reduceNumerology(sumDigits(birthDate));
  const personalYear = reduceNumerology(lifePath + sumDigits(target.getFullYear()));
  const personalMonth = reduceNumerology(personalYear + target.getMonth() + 1);
  const personalDay = reduceNumerology(personalMonth + target.getDate());

  const metrics: NumerologyMetric[] = [
    createMetric("personalDay", personalDay, settings.weights.personalDay, lang, content),
    createMetric("personalMonth", personalMonth, settings.weights.personalMonth, lang, content),
    createMetric("personalYear", personalYear, settings.weights.personalYear, lang, content),
    createMetric("lifePath", lifePath, settings.weights.lifePath, lang, content)
  ].sort((a, b) => metricOrder(a.id) - metricOrder(b.id));

  const totalWeight = metrics.reduce((sum, metric) => sum + Math.max(0, metric.weight), 0);
  const summaryScore = totalWeight
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.score * Math.max(0, metric.weight), 0) / totalWeight)
    : 50;
  const summaryLabel = scoreToLabel(summaryScore, lang, content);
  const dominant = [...metrics].sort((a, b) => b.score * Math.max(0, b.weight) - a.score * Math.max(0, a.weight))[0];
  const recommendation = buildRecommendation(numerologyTone(summaryScore), dominant || metrics[0], lang, content);
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

function createMetric(id: NumerologyMetricId, value: number, weight: number, language: Language, content = createDefaultRuntimeContent()): NumerologyMetric {
  const meaning = content.numerology.interpretations[value] || content.numerology.interpretations[reduceNumerology(value)] || content.numerology.interpretations[1];
  return {
    id,
    label: content.numerology.metrics[id].label[language],
    value,
    interpretation: `${meaning.label[language]} · ${meaning.note[language]}`,
    weight,
    score: meaning.score
  };
}

function buildRecommendation(tone: ReturnType<typeof numerologyTone>, dominant: NumerologyMetric, language: Language, content = createDefaultRuntimeContent()) {
  const lead = content.numerology.recommendation[tone][language];
  return language === "en"
    ? `${lead} Daily anchor — ${dominant.label}: ${dominant.interpretation}`
    : `${lead} Опора дня — ${dominant.label}: ${dominant.interpretation}`;
}

function scoreToLabel(score: number, language: Language, content = createDefaultRuntimeContent()) {
  return content.numerology.summaryLabels[language][numerologyTone(score)];
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

function metricOrder(id: NumerologyMetricId) {
  switch (id) {
    case "personalDay":
      return 0;
    case "personalMonth":
      return 1;
    case "personalYear":
      return 2;
    case "lifePath":
      return 3;
  }
}
