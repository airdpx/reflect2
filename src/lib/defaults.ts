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

export const habitIconPresets = ["💧", "🚶", "🌙", "📖", "📝", "🧘", "🏃", "🥗", "☕", "🌿", "🎯", "🔥", "✨", "💪", "🧠", "🎧", "🛏️", "🚫", "💊", "🪴", "🎨", "🧩", "📚", "❤️"];

export const habitCategoryPresets = ["Здоровье", "Состояние", "Быт", "Фокус", "Развитие", "Самонаблюдение", "Сон", "Спорт", "Питание", "Работа", "Отдых", "Отношения"];

export const statusIconPresets: Record<HabitStatus, string[]> = {
  done: ["✅", "🟢", "🌿", "💚", "🎉"],
  partial: ["🌓", "🟡", "◐", "⚡", "🧩"],
  skipped: ["⏭️", "💤", "➖", "🌫️", "⏸️"],
  missed: ["❌", "🔴", "⛔", "🔻", "🚧"],
  planned: ["🗓️", "📍", "🕓", "🔵", "○"]
};

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
    schemaVersion: 12,
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
        color: false,
        icon: true,
        category: false,
        type: false,
        target: false,
        statusText: false,
        compactMeta: true,
        completion: false,
        daysSince: false,
        noteMarker: false,
        moodMarker: true
      },
      density: "standard",
      interfaceTheme: "dark",
      gridTheme: "soft",
      gridDisplayMode: "matrix",
      gridDensity: "standard",
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
      defaultView: "today",
      todayLayout: "split",
      diaryLayout: "compact",
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
