import type {
  ForecastScaleId,
  Language,
  NumerologyMetricId,
  RuntimeKnowledgeContent,
  RuntimeForecastScaleContent,
  RuntimeNumerologyInterpretationContent,
  RuntimeNumerologyMetricContent,
  RuntimeTextPair
} from "../types";

const summaryLabels: Record<Language, { low: string; steady: string; high: string }> = {
  ru: { low: "низкий", steady: "ровный", high: "сильный" },
  en: { low: "low", steady: "steady", high: "strong" }
};

const forecastNotes: RuntimeTextPair = {
  ru: "Ориентир для самонаблюдения, не прогноз-обязательство.",
  en: "A self-observation reference, not a fixed prediction."
};

const forecastScaleDefaults: Record<ForecastScaleId, RuntimeForecastScaleContent> = {
  physical: {
    label: { ru: "Физическая", en: "Physical" },
    note: {
      ru: "Цикл 23 дня: тело, энергия и ресурс.",
      en: "23-day cycle: body, energy and physical resource."
    },
    cycle: 23
  },
  emotional: {
    label: { ru: "Эмоциональная", en: "Emotional" },
    note: {
      ru: "Цикл 28 дней: чувства, отклик и настроение.",
      en: "28-day cycle: feelings, response and mood."
    },
    cycle: 28
  },
  intellectual: {
    label: { ru: "Интеллектуальная", en: "Intellectual" },
    note: {
      ru: "Цикл 33 дня: мышление, внимание и ясность.",
      en: "33-day cycle: thinking, focus and clarity."
    },
    cycle: 33
  }
};

const numerologyMetricDefaults: Record<NumerologyMetricId, RuntimeNumerologyMetricContent> = {
  personalDay: {
    label: { ru: "Personal Day", en: "Personal Day" }
  },
  personalMonth: {
    label: { ru: "Personal Month", en: "Personal Month" }
  },
  personalYear: {
    label: { ru: "Personal Year", en: "Personal Year" }
  },
  lifePath: {
    label: { ru: "Life Path", en: "Life Path" }
  }
};

const numerologyInterpretationDefaults: Record<number, RuntimeNumerologyInterpretationContent> = {
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

const numerologyRecommendationDefaults: Record<"low" | "steady" | "high", RuntimeTextPair> = {
  low: {
    ru: "Лучше держать темп проще и опираться на один понятный шаг за раз.",
    en: "Keep the pace simpler and rely on one clear step at a time."
  },
  steady: {
    ru: "Хороший день для спокойного ритма, последовательности и мягкой дисциплины.",
    en: "A good day for calm rhythm, consistency and gentle discipline."
  },
  high: {
    ru: "Можно брать более заметные задачи и не дробить день на мелкие куски.",
    en: "You can take on more visible tasks without splitting the day into tiny pieces."
  }
};

export function createDefaultRuntimeContent(): RuntimeKnowledgeContent {
  return {
    forecast: {
      summaryLabels,
      notes: forecastNotes,
      scales: forecastScaleDefaults
    },
    numerology: {
      summaryLabels,
      metrics: numerologyMetricDefaults,
      interpretations: numerologyInterpretationDefaults,
      recommendation: numerologyRecommendationDefaults
    }
  };
}

export function mergeRuntimeContent(base: RuntimeKnowledgeContent, patch: Partial<RuntimeKnowledgeContent>): RuntimeKnowledgeContent {
  return {
    forecast: {
      summaryLabels: {
        ...base.forecast.summaryLabels,
        ...patch.forecast?.summaryLabels
      },
      notes: {
        ...base.forecast.notes,
        ...patch.forecast?.notes
      },
      scales: mergeForecastScales(base.forecast.scales, patch.forecast?.scales)
    },
    numerology: {
      summaryLabels: {
        ...base.numerology.summaryLabels,
        ...patch.numerology?.summaryLabels
      },
      metrics: mergeMetricLabels(base.numerology.metrics, patch.numerology?.metrics),
      interpretations: mergeInterpretations(base.numerology.interpretations, patch.numerology?.interpretations),
      recommendation: {
        ...base.numerology.recommendation,
        ...patch.numerology?.recommendation
      }
    }
  };
}

function mergeForecastScales(base: Record<ForecastScaleId, RuntimeForecastScaleContent>, patch?: Partial<Record<ForecastScaleId, RuntimeForecastScaleContent>>): Record<ForecastScaleId, RuntimeForecastScaleContent> {
  const next = { ...base };
  if (!patch) return next;
  for (const key of Object.keys(patch) as ForecastScaleId[]) {
    const value = patch[key];
    if (!value) continue;
    next[key] = {
      ...base[key],
      ...value,
      label: {
        ...base[key].label,
        ...value.label
      },
      note: {
        ...base[key].note,
        ...value.note
      }
    };
  }
  return next;
}

function mergeMetricLabels(base: Record<NumerologyMetricId, RuntimeNumerologyMetricContent>, patch?: Partial<Record<NumerologyMetricId, RuntimeNumerologyMetricContent>>): Record<NumerologyMetricId, RuntimeNumerologyMetricContent> {
  const next = { ...base };
  if (!patch) return next;
  for (const key of Object.keys(patch) as NumerologyMetricId[]) {
    const value = patch[key];
    if (!value) continue;
    next[key] = {
      ...base[key],
      ...value,
      label: {
        ...base[key].label,
        ...value.label
      }
    };
  }
  return next;
}

function mergeInterpretations(
  base: Record<number, RuntimeNumerologyInterpretationContent>,
  patch?: Partial<Record<number, RuntimeNumerologyInterpretationContent>>
): Record<number, RuntimeNumerologyInterpretationContent> {
  const next = { ...base };
  if (!patch) return next;
  for (const [key, value] of Object.entries(patch)) {
    const numericKey = Number(key);
    if (!Number.isFinite(numericKey) || !value) continue;
    next[numericKey] = {
      ...base[numericKey],
      ...value,
      label: {
        ...base[numericKey]?.label,
        ...value.label
      },
      note: {
        ...base[numericKey]?.note,
        ...value.note
      }
    };
  }
  return next;
}
