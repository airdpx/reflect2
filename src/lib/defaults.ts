import type { AppState, HabitStatus, HabitTemplate, HabitType, TodayBlockKey, UserSettings } from "../types";
import { todayKey } from "./date";

export const statusMeta: Record<HabitStatus, { label: string; short: string; className: string }> = {
  done: { label: "Выполнено", short: "❤️", className: "status-done" },
  partial: { label: "Частично", short: "◐", className: "status-partial" },
  skipped: { label: "Пропуск", short: "−", className: "status-skipped" },
  missed: { label: "Не выполнено", short: "×", className: "status-missed" },
  planned: { label: "Запланировано", short: "·", className: "status-planned" }
};

export const habitTypeLabels: Record<HabitType, string> = {
  boolean: "Обычная",
  daily: "Каждый день",
  numeric: "Числовая",
  multiple: "Несколько раз в день",
  avoid: "Не делать",
  reflection: "Не каждый день"
};

export const habitTypeHints: Record<HabitType, string> = {
  boolean: "Простая отметка: сделал или не сделал.",
  daily: "Ежедневная привычка, которую хочется отмечать каждый день.",
  numeric: "Подходит для шагов, минут, страниц или любого числа.",
  multiple: "Несколько коротких повторов в день, например вода.",
  avoid: "Успех дня — не сделать нежелательное действие.",
  reflection: "Запись или заметка считается выполнением."
};

export const habitIconPresets = [
  "💧", "🚶", "🌙", "📖", "📝", "🧘", "🏃", "🥗", "☕", "🌿", "🎯", "🔥", "✨", "💪", "🧠", "🎧", "🛏️", "🚫",
  "💊", "🪴", "🎨", "🧩", "📚", "❤️", "🍋", "🪥", "🚴", "🏋️", "🏃‍♂️", "🏋️‍♀️", "💨", "😌", "🙂", "😴",
  "💤", "🚗", "🐶", "🐱", "🦜", "🦎", "✍️", "☀️", "☁️", "🛴", "🚲", "📱"
];

export const habitCategoryPresets = ["Здоровье", "Состояние", "Быт", "Фокус", "Развитие", "Самонаблюдение", "Сон", "Спорт", "Питание", "Работа", "Отдых", "Отношения"];

const habitIconRules: Array<{ terms: string[]; icon: string }> = [
  { terms: ["сон", "sleep", "спать", "ноч", "bed", "высп"], icon: "🌙" },
  { terms: ["zzz", "сонлив", "sleepy", "поспать"], icon: "💤" },
  { terms: ["каждый день", "every day", "daily", "ежеднев"], icon: "☀️" },
  { terms: ["чистк зуб", "зуб", "brush", "tooth"], icon: "🪥" },
  { terms: ["велосип", "bike", "cycling", "ride"], icon: "🚴" },
  { terms: ["авто", "car", "машин", "drive", "road"], icon: "🚗" },
  { terms: ["собак", "dog", "пес"], icon: "🐶" },
  { terms: ["кошк", "cat", "кот"], icon: "🐱" },
  { terms: ["попуг", "parrot", "bird"], icon: "🦜" },
  { terms: ["варан", "lizard", "reptile"], icon: "🦎" },
  { terms: ["витамин", "витамины", "supplement", "pill"], icon: "💊" },
  { terms: ["фрукт", "fruit", "apple", "banana", "berries"], icon: "🍎" },
  { terms: ["йог", "yoga"], icon: "🧘" },
  { terms: ["тренир", "workout", "training", "gym"], icon: "💪" },
  { terms: ["заряд", "warmup", "stretch", "размин"], icon: "🤸" },
  { terms: ["питом", "pet", "корм", "feed", "животн"], icon: "🐾" },
  { terms: ["гантел", "dumbbell", "weights", "силов"], icon: "🏋️" },
  { terms: ["штанг", "barbell", "weightlifting", "lifting"], icon: "🏋️‍♀️" },
  { terms: ["спин", "back", "осан", "posture"], icon: "💪" },
  { terms: ["медита", "дых", "mind", "дзен", "практик"], icon: "🧘" },
  { terms: ["вода", "hydrate", "drink", "water"], icon: "💧" },
  { terms: ["чтени", "книга", "read", "book", "pages"], icon: "📖" },
  { terms: ["дневник", "замет", "journal", "note", "reflec"], icon: "📝" },
  { terms: ["прогул", "walk", "ход", "step"], icon: "🚶" },
  { terms: ["спорт", "run", "трен", "fitness", "workout"], icon: "🏃" },
  { terms: ["еда", "food", "meal", "питани", "eat", "завтр"], icon: "🥗" },
  { terms: ["работ", "task", "focus", "дело", "проект"], icon: "💼" },
  { terms: ["фокус", "концент", "deep", "study"], icon: "🎯" },
  { terms: ["отдых", "relax", "pause", "break"], icon: "🛋️" },
  { terms: ["музык", "music", "sound", "podcast"], icon: "🎧" },
  { terms: ["мозг", "think", "learn", "study", "ум"], icon: "🧠" },
  { terms: ["любов", "отнош", "family", "heart"], icon: "❤️" },
  { terms: ["детокс", "avoid", "no", "stop", "less"], icon: "🚫" }
];

const todayBlockKeys: TodayBlockKey[] = ["today", "attention", "forecast", "numerology", "transit", "analytics", "noteText"];

export const statusIconPresets: Record<HabitStatus, string[]> = {
  done: ["❤️", "✓", "✔", "✅", "💚", "🌿", "🎉"],
  partial: ["◐", "🌓", "🟡", "⚡", "🧩", "🙂"],
  skipped: ["−", "⏭️", "💤", "➖", "🌫️", "⏸️"],
  missed: ["❌", "🔴", "⛔", "🔻", "🚧", "😞"],
  planned: ["🗓️", "📍", "🕓", "🔵", "○", "🙂"]
};

export function suggestHabitIcon(title: string, category = "", type: string = "") {
  const haystack = `${title} ${category} ${type}`.trim().toLowerCase();
  for (const rule of habitIconRules) {
    if (rule.terms.some((term) => haystack.includes(term))) return rule.icon;
  }
  if (type === "avoid") return "🚫";
  if (type === "daily") return "☀️";
  if (type === "reflection") return "📝";
  if (type === "numeric") return "✨";
  return "⭐";
}

export const defaultCustomGridColors = {
  mode: "custom" as const,
  bg: "#111827",
  head: "#182235",
  cell: "#161f31",
  today: "#1d2a3a",
  line: "#25324a",
  habitSingle: "#38bdf8",
  habitMuted: "#7c92aa",
  habitAltA: "#22c55e",
  habitAltB: "#f59e0b"
};

export const themeOptions = [
  { id: "light", title: "Paper Neutral", colors: ["#f5f3ee", "#ffffff", "#557a68", "#252622"] },
  { id: "mint", title: "Clinical Mint", colors: ["#edf6f1", "#f8fbf8", "#18a878", "#162621"] },
  { id: "rose", title: "Atelier Rose", colors: ["#f8eef0", "#fff9fa", "#d84c75", "#2e1d22"] },
  { id: "citrus", title: "Citrus Paper", colors: ["#f8f2df", "#fffaf0", "#ff7a1a", "#2c261d"] },
  { id: "sand", title: "Sandstone", colors: ["#f2eadb", "#fffaf1", "#16857a", "#2c271f"] },
  { id: "warm", title: "Warm Mono", colors: ["#f3ede2", "#fffaf2", "#b16c4f", "#2c2823"] },
  { id: "sage", title: "Sage Desk", colors: ["#edf2eb", "#fbfdf9", "#637d60", "#202720"] },
  { id: "blue", title: "Blue Grey", colors: ["#eef3f6", "#fbfdff", "#477492", "#1f2933"] },
  { id: "ash", title: "Ash Minimal", colors: ["#f3f4f2", "#fbfbf9", "#6b7280", "#1f2328"] },
  { id: "yellowMono", title: "Yellow Mono", colors: ["#f4f1e8", "#fffdf6", "#d7a514", "#24231f"] },
  { id: "glacier", title: "Glacier", colors: ["#e7eef6", "#f9fbfd", "#5b7b99", "#1d2935"] },
  { id: "dark", title: "Carbon Studio", colors: ["#111315", "#1a1d1f", "#3ddc97", "#f3f4f1"] },
  { id: "contrast", title: "Signal Desk", colors: ["#07101d", "#101c2c", "#35d7ff", "#f8fbff"] },
  { id: "graphite", title: "Graphite Desk", colors: ["#111213", "#202225", "#b6f06b", "#f6f7f4"] },
  { id: "steel", title: "Steel Notes", colors: ["#111827", "#1f2937", "#94a3b8", "#f8fafc"] },
  { id: "smoke", title: "Smoke Desk", colors: ["#141414", "#222222", "#bfbfbf", "#f5f5f5"] },
  { id: "granite", title: "Granite Grid", colors: ["#1c1f24", "#2b3038", "#d6d9de", "#f7f8fa"] },
  { id: "zinc", title: "Zinc Studio", colors: ["#18181b", "#242428", "#d4d4d8", "#fafafa"] },
  { id: "graphiteGold", title: "Graphite Gold", colors: ["#111111", "#1f1f1f", "#f4b740", "#f7f4ec"] },
  { id: "orangeGrey", title: "Orange Grey", colors: ["#262421", "#34312c", "#ff8a3d", "#f8f4ed"] },
  { id: "coralGrey", title: "Coral Grey", colors: ["#202225", "#2d3035", "#ff7a66", "#f8fafc"] },
  { id: "sunset", title: "Terracotta", colors: ["#241916", "#32241f", "#ff8a4c", "#fff7ed"] },
  { id: "berry", title: "Plum Graphite", colors: ["#17141d", "#24202b", "#d77aa8", "#f7f1f5"] },
  { id: "lagoon", title: "Deep Teal", colors: ["#071a1d", "#102b30", "#26d3c1", "#effefd"] },
  { id: "violet", title: "Indigo Steel", colors: ["#121724", "#1d2536", "#8aa4ff", "#f4f6ff"] },
  { id: "forest", title: "Moss Workspace", colors: ["#101812", "#1b261e", "#79d28b", "#eef8ef"] },
  { id: "aurora", title: "Polar Slate", colors: ["#09111c", "#121f2f", "#68d5ff", "#f3faff"] },
  { id: "rain", title: "Rainline", colors: ["#0f172a", "#1e293b", "#60a5fa", "#e2e8f0"] },
  { id: "ember", title: "Ember Grey", colors: ["#231f1d", "#332f2d", "#f59e0b", "#f8f1e7"] },
  { id: "nocturne", title: "Nocturne Green", colors: ["#0b1110", "#13201d", "#22c55e", "#eefbf3"] },
  { id: "obsidian", title: "Obsidian Amber", colors: ["#0f0f10", "#1c1b19", "#f59e0b", "#faf7ef"] },
  { id: "ink", title: "Ink Blue", colors: ["#070b13", "#111827", "#38bdf8", "#edf7ff"] },
  { id: "bronzeNight", title: "Bronze Night", colors: ["#17120e", "#261d16", "#d08a3c", "#fff4e6"] },
  { id: "custom", title: "Custom", colors: ["#111827", "#182235", "#22c55e", "#f8fafc"] }
] as const;

export const habitTemplates: HabitTemplate[] = [
  {
    id: "vitamins",
    title: "Витамины",
    description: "Ежедневный приём без лишней сложности.",
    color: "#f59e0b",
    icon: "💊",
    category: "Здоровье",
    type: "boolean",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 3,
    helper: "Мягкий шаблон для важных мелочей."
  },
  {
    id: "fruit",
    title: "Фрукты",
    description: "Добавить порцию фруктов в течение дня.",
    color: "#f97316",
    icon: "🍎",
    category: "Питание",
    type: "boolean",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 3,
    helper: "Подходит для питания и рутины."
  },
  {
    id: "yoga",
    title: "Йога",
    description: "Спокойная практика для тела и внимания.",
    color: "#14b8a6",
    icon: "🧘",
    category: "Состояние",
    type: "numeric",
    target: 15,
    schedule: [1, 3, 5],
    warningThreshold: 4,
    helper: "Минуты, сессии или мягкий ритуал."
  },
  {
    id: "training",
    title: "Тренировка",
    description: "Силовая, кардио или любая активная сессия.",
    color: "#f97316",
    icon: "💪",
    category: "Здоровье",
    type: "boolean",
    target: 1,
    schedule: [1, 3, 5],
    warningThreshold: 4,
    helper: "Универсальный шаблон для спорта."
  },
  {
    id: "warmup",
    title: "Зарядка",
    description: "Короткая разминка для старта дня.",
    color: "#38bdf8",
    icon: "🤸",
    category: "Здоровье",
    type: "boolean",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 4,
    helper: "Лёгкий шаблон на утро."
  },
  {
    id: "feed-pet",
    title: "Покормить животное",
    description: "Домашний ритуал без лишней сложности.",
    color: "#22c55e",
    icon: "🐾",
    category: "Быт",
    type: "multiple",
    target: 2,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 2,
    helper: "Подходит для повторов в течение дня."
  },
  {
    id: "water",
    title: "Вода",
    description: "Несколько мягких отметок в течение дня.",
    color: "#38bdf8",
    icon: "💧",
    category: "Быт",
    type: "multiple",
    target: 5,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 2,
    helper: "Хороший шаблон для привычек с повторениями."
  },
  {
    id: "walk",
    title: "Прогулка",
    description: "Спокойное движение без давления.",
    color: "#22c55e",
    icon: "🚶",
    category: "Здоровье",
    type: "boolean",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 4,
    helper: "Простая ежедневная привычка."
  },
  {
    id: "sleep",
    title: "Сон",
    description: "Отметить спокойный режим сна или подъёма.",
    color: "#818cf8",
    icon: "🌙",
    category: "Здоровье",
    type: "boolean",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 3,
    helper: "Без чисел, просто факт хорошего режима."
  },
  {
    id: "reading",
    title: "Чтение",
    description: "Страницы, минуты или короткая сессия.",
    color: "#f59e0b",
    icon: "📖",
    category: "Развитие",
    type: "numeric",
    target: 20,
    schedule: [1, 2, 3, 4, 5],
    warningThreshold: 5,
    helper: "Числовая цель: например 20 минут или страниц."
  },
  {
    id: "journal",
    title: "Дневник состояния",
    description: "Короткая заметка о дне.",
    color: "#ec4899",
    icon: "📝",
    category: "Самонаблюдение",
    type: "reflection",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 3,
    helper: "Запись сама считается выполнением."
  },
  {
    id: "meditation",
    title: "Медитация",
    description: "Несколько минут тишины или дыхания.",
    color: "#14b8a6",
    icon: "🧘",
    category: "Состояние",
    type: "numeric",
    target: 10,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 4,
    helper: "Числовая цель в минутах."
  },
  {
    id: "sport",
    title: "Спорт",
    description: "Тренировка или короткая активность.",
    color: "#f97316",
    icon: "🏃",
    category: "Здоровье",
    type: "boolean",
    target: 1,
    schedule: [1, 3, 5],
    warningThreshold: 5,
    helper: "По умолчанию три раза в неделю."
  },
  {
    id: "avoid-scroll",
    title: "Без лишнего скролла",
    description: "Отметить день без нежелательной привычки.",
    color: "#ef4444",
    icon: "🚫",
    category: "Фокус",
    type: "avoid",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 2,
    helper: "Успех — нежелательное действие не произошло."
  }
];

export function mergeSettings(base: UserSettings, override?: Partial<UserSettings>): UserSettings {
  if (!override) return base;
  return {
    ...base,
    ...override,
    defaultPeriod: {
      ...base.defaultPeriod,
      ...override.defaultPeriod
    },
    diaryHistoryMode: override.diaryHistoryMode || base.diaryHistoryMode,
    visibleBlocks: {
      ...base.visibleBlocks,
      ...override.visibleBlocks
    },
    visibleGrid: {
      ...base.visibleGrid,
      ...override.visibleGrid
    },
    secondaryCalendar: {
      ...base.secondaryCalendar,
      ...override.secondaryCalendar,
      selectedTypes: {
        ...base.secondaryCalendar.selectedTypes,
        ...override.secondaryCalendar?.selectedTypes
      }
    },
    customTheme: {
      ...base.customTheme,
      ...override.customTheme
    },
    statusIcons: {
      ...base.statusIcons,
      ...override.statusIcons
    },
    gridColors: {
      ...base.gridColors,
      ...override.gridColors
    },
    calendarFilterMode: override.calendarFilterMode || base.calendarFilterMode,
    calendarFilterTypes: {
      ...base.calendarFilterTypes,
      ...override.calendarFilterTypes
    },
    forecast: {
      ...base.forecast,
      ...override.forecast,
      visibleScales: {
        ...base.forecast.visibleScales,
        ...override.forecast?.visibleScales
      }
    },
    numerology: {
      ...base.numerology,
      ...override.numerology,
      visibleMetrics: {
        ...base.numerology.visibleMetrics,
        ...override.numerology?.visibleMetrics
      },
      weights: {
        ...base.numerology.weights,
        ...override.numerology?.weights
      }
    },
    notifications: {
      ...base.notifications,
      ...override.notifications,
      channels: {
        ...base.notifications.channels,
        ...override.notifications?.channels
      },
      topics: {
        ...base.notifications.topics,
        ...override.notifications?.topics
      },
      quietHours: {
        ...base.notifications.quietHours,
        ...override.notifications?.quietHours
      }
    }
  };
}

export function createDefaults(settingsOverride?: Partial<UserSettings>): AppState {
  const defaultSettings: UserSettings = {
    language: "ru",
    preset: "Balanced",
    activeStatuses: ["done", "partial", "skipped"],
    defaultPeriod: { mode: "last", days: 30, start: todayKey(), end: todayKey() },
    visibleBlocks: {
      today: true,
      attention: true,
      habitIcons: false,
      diary: true,
      mood: true,
      energy: true,
      stress: true,
      noteText: true,
      helped: true,
      blocked: true,
      forecast: true,
      numerology: true,
      transit: true,
      analytics: true,
      completion: true,
      lastDone: true
    },
    mobileTodayBlocks: Object.fromEntries(todayBlockKeys.map((key) => [key, true])) as Record<TodayBlockKey, boolean>,
    visibleGrid: {
      color: true,
      icon: true,
      category: false,
      type: false,
      target: false,
      statusText: true,
      compactMeta: false,
      completion: false,
      daysSince: false,
      noteMarker: false,
      moodMarker: false
    },
    density: "standard",
    interfaceTheme: "dark",
    gridTheme: "classic",
    gridDisplayMode: "matrix",
    gridDensity: "standard",
    gridMarkerShape: "circle",
    gridHabitColorMode: "habit",
    calendarHistoryDays: 7,
    calendarFilterMode: "types",
    calendarFilterTypes: {
      boolean: true,
      daily: true,
      numeric: true,
      multiple: true,
      avoid: true,
      reflection: true
    },
    secondaryCalendar: {
      enabled: false,
      historyDays: 7,
      showWeekends: true,
      filterMode: "types",
      selectedTypes: {
        boolean: true,
        daily: true,
        numeric: true,
        multiple: true,
        avoid: true,
        reflection: true
      }
    },
    statusIcons: {
      done: "❤️",
      partial: "◐",
      skipped: "−",
      missed: "❌",
      planned: "🗓️"
    },
    gridColors: {
      mode: "theme",
      bg: defaultCustomGridColors.bg,
      head: defaultCustomGridColors.head,
      cell: defaultCustomGridColors.cell,
      today: defaultCustomGridColors.today,
      line: defaultCustomGridColors.line,
      habitSingle: defaultCustomGridColors.habitSingle,
      habitMuted: defaultCustomGridColors.habitMuted,
      habitAltA: defaultCustomGridColors.habitAltA,
      habitAltB: defaultCustomGridColors.habitAltB
    },
    forecast: {
      enabled: true,
      provider: "biorhythm",
      visibleScales: {
        physical: true,
        emotional: true,
        intellectual: true
      },
      showInToday: true,
      showInDiary: true,
      showInInspector: true,
      showInGrid: false,
      displayMode: "compact"
    },
    numerology: {
      enabled: true,
      displayMode: "cards",
      visibleMetrics: {
        personalDay: true,
        personalMonth: true,
        personalYear: true,
        lifePath: true
      },
      weights: {
        personalDay: 1,
        personalMonth: 1,
        personalYear: 1,
        lifePath: 1
      },
      showInToday: true,
      showInDiary: true,
      showInInspector: true
    },
    notifications: {
      enabled: true,
      channels: {
        inApp: true,
        browser: false,
        email: false,
        telegram: false,
        push: false
      },
      topics: {
        habits: true,
        diary: true,
        forecast: true,
        transit: true,
        analytics: true,
        reminders: true
      },
      priorityOnly: false,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00"
      },
      frequency: "instant",
      digestTime: "19:00",
      weeklyDay: 1,
      emailTarget: "",
      telegramTarget: "",
      pushReady: false
    },
    focusMode: false,
    rightPanel: true,
    showWeekends: true,
    gridClickAction: "cycle",
    selectedCategory: "all",
    selectedHabitId: "",
    iconSuggestionsCheckedAt: todayKey(),
    diaryHistoryDays: 30,
    diaryHistoryMode: "period",
    analyticsHistoryDays: 30,
    defaultView: "today",
    todayLayout: "split",
    diaryLayout: "full",
    customTheme: {
      bg: "#111827",
      surface: "#182235",
      text: "#f8fafc",
      accent: "#22c55e",
      done: "#22c55e",
      partial: "#f59e0b",
      skipped: "#64748b",
      missed: "#ef4444",
      planned: "#38bdf8"
    },
    customPresets: {}
  };
  const settings = mergeSettings(defaultSettings, settingsOverride);
  return {
    schemaVersion: 20,
    view: "today",
    selectedDate: todayKey(),
    habits: [],
    logs: {},
    notes: {},
    notificationStates: {},
    profile: null,
    settings
  };
}
