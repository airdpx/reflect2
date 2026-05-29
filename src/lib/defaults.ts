import type { AppState, HabitStatus, HabitTemplate, HabitType } from "../types";
import { todayKey } from "./date";

export const statusMeta: Record<HabitStatus, { label: string; short: string; className: string }> = {
  done: { label: "Выполнено", short: "✓", className: "status-done" },
  partial: { label: "Частично", short: "◐", className: "status-partial" },
  skipped: { label: "Пропуск", short: "–", className: "status-skipped" },
  missed: { label: "Не выполнено", short: "×", className: "status-missed" },
  planned: { label: "Запланировано", short: "·", className: "status-planned" }
};

export const habitTypeLabels: Record<HabitType, string> = {
  boolean: "Обычная",
  numeric: "Числовая",
  multiple: "Несколько раз в день",
  avoid: "Не делать",
  reflection: "Самонаблюдение"
};

export const habitTypeHints: Record<HabitType, string> = {
  boolean: "Простая отметка: сделал или не сделал.",
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
  { terms: ["чистк зуб", "зуб", "brush", "tooth"], icon: "🪥" },
  { terms: ["велосип", "bike", "cycling", "ride"], icon: "🚴" },
  { terms: ["авто", "car", "машин", "drive", "road"], icon: "🚗" },
  { terms: ["собак", "dog", "пес"], icon: "🐶" },
  { terms: ["кошк", "cat", "кот"], icon: "🐱" },
  { terms: ["попуг", "parrot", "bird"], icon: "🦜" },
  { terms: ["варан", "lizard", "reptile"], icon: "🦎" },
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

export const statusIconPresets: Record<HabitStatus, string[]> = {
  done: ["✅", "🔥", "🟢", "🌿", "💚", "🎉", "😄"],
  partial: ["🌓", "🟡", "◐", "⚡", "🧩", "🙂"],
  skipped: ["⏭️", "💤", "➖", "🌫️", "⏸️", "😴"],
  missed: ["❌", "🔴", "⛔", "🔻", "🚧", "😞"],
  planned: ["🗓️", "📍", "🕓", "🔵", "○", "🙂"]
};

export function suggestHabitIcon(title: string, category = "", type: string = "") {
  const haystack = `${title} ${category} ${type}`.trim().toLowerCase();
  for (const rule of habitIconRules) {
    if (rule.terms.some((term) => haystack.includes(term))) return rule.icon;
  }
  if (type === "avoid") return "🚫";
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
  line: "#25324a"
};

export const themeOptions = [
  { id: "dark", title: "Carbon Studio", colors: ["#111315", "#1a1d1f", "#3ddc97", "#f3f4f1"] },
  { id: "contrast", title: "Signal Desk", colors: ["#07101d", "#101c2c", "#35d7ff", "#f8fbff"] },
  { id: "sunset", title: "Terracotta", colors: ["#241916", "#32241f", "#ff8a4c", "#fff7ed"] },
  { id: "mint", title: "Clinical Mint", colors: ["#edf6f1", "#f8fbf8", "#18a878", "#162621"] },
  { id: "berry", title: "Plum Graphite", colors: ["#17141d", "#24202b", "#d77aa8", "#f7f1f5"] },
  { id: "citrus", title: "Citrus Paper", colors: ["#f8f2df", "#fffaf0", "#ff7a1a", "#2c261d"] },
  { id: "lagoon", title: "Deep Teal", colors: ["#071a1d", "#102b30", "#26d3c1", "#effefd"] },
  { id: "graphite", title: "Graphite Desk", colors: ["#111213", "#202225", "#b6f06b", "#f6f7f4"] },
  { id: "rose", title: "Atelier Rose", colors: ["#f8eef0", "#fff9fa", "#d84c75", "#2e1d22"] },
  { id: "violet", title: "Indigo Steel", colors: ["#121724", "#1d2536", "#8aa4ff", "#f4f6ff"] },
  { id: "forest", title: "Moss Workspace", colors: ["#101812", "#1b261e", "#79d28b", "#eef8ef"] },
  { id: "sand", title: "Sandstone", colors: ["#f2eadb", "#fffaf1", "#16857a", "#2c271f"] },
  { id: "aurora", title: "Polar Slate", colors: ["#09111c", "#121f2f", "#68d5ff", "#f3faff"] },
  { id: "light", title: "Paper Neutral", colors: ["#f5f3ee", "#ffffff", "#557a68", "#252622"] },
  { id: "warm", title: "Warm Mono", colors: ["#f3ede2", "#fffaf2", "#b16c4f", "#2c2823"] },
  { id: "sage", title: "Sage Desk", colors: ["#edf2eb", "#fbfdf9", "#637d60", "#202720"] },
  { id: "blue", title: "Blue Grey", colors: ["#eef3f6", "#fbfdff", "#477492", "#1f2933"] },
  { id: "steel", title: "Steel Notes", colors: ["#111827", "#1f2937", "#94a3b8", "#f8fafc"] },
  { id: "smoke", title: "Smoke Desk", colors: ["#141414", "#222222", "#bfbfbf", "#f5f5f5"] },
  { id: "granite", title: "Granite Grid", colors: ["#1c1f24", "#2b3038", "#d6d9de", "#f7f8fa"] },
  { id: "rain", title: "Rainline", colors: ["#0f172a", "#1e293b", "#60a5fa", "#e2e8f0"] },
  { id: "ember", title: "Ember Grey", colors: ["#231f1d", "#332f2d", "#f59e0b", "#f8f1e7"] },
  { id: "glacier", title: "Glacier", colors: ["#e7eef6", "#f9fbfd", "#5b7b99", "#1d2935"] },
  { id: "custom", title: "Custom", colors: ["#111827", "#182235", "#22c55e", "#f8fafc"] }
] as const;

export const habitTemplates: HabitTemplate[] = [
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

export function createDefaults(): AppState {
  return {
    schemaVersion: 15,
    view: "today",
    selectedDate: todayKey(),
    habits: [],
    logs: {},
    notes: {},
    profile: null,
    settings: {
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
        analytics: true,
        completion: true,
        lastDone: true
      },
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
      gridTheme: "soft",
      gridDisplayMode: "matrix",
      gridDensity: "standard",
      gridMarkerShape: "circle",
      calendarHistoryDays: 30,
      statusIcons: {
        done: "✅",
        partial: "🌓",
        skipped: "⏭️",
        missed: "❌",
        planned: "🗓️"
      },
      gridColors: {
        mode: "theme",
        bg: defaultCustomGridColors.bg,
        head: defaultCustomGridColors.head,
        cell: defaultCustomGridColors.cell,
        today: defaultCustomGridColors.today,
        line: defaultCustomGridColors.line
      },
      forecast: {
        enabled: false,
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
      focusMode: false,
      rightPanel: true,
      showWeekends: true,
      gridClickAction: "cycle",
      selectedCategory: "all",
      selectedHabitId: "",
      iconSuggestionsCheckedAt: todayKey(),
      diaryHistoryDays: 30,
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
    }
  };
}
