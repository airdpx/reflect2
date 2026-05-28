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

export const habitIconPresets = ["○", "●", "◌", "✓", "☼", "☾", "✎", "◇", "△", "◉", "▣", "✦", "✚", "⌁", "∞", "·", "×", "↑", "↓", "↻"];

export const habitCategoryPresets = ["Здоровье", "Состояние", "Быт", "Фокус", "Развитие", "Самонаблюдение", "Сон", "Спорт", "Питание", "Работа", "Отдых", "Отношения"];

export const statusIconPresets: Record<HabitStatus, string[]> = {
  done: ["✓", "●", "✔", "＋", "↑"],
  partial: ["◐", "◒", "◍", "≈", "±"],
  skipped: ["–", "○", "↷", "·", "…"],
  missed: ["×", "✕", "↓", "!", "□"],
  planned: ["·", "○", "□", "◌", "•"]
};

export const themeOptions = [
  { id: "dark", title: "Dark Calm", colors: ["#151713", "#1e211d", "#9caf88", "#ede9df"] },
  { id: "contrast", title: "Bright Contrast", colors: ["#07111f", "#0f1b2e", "#33d69f", "#f8fbff"] },
  { id: "sunset", title: "Sunset", colors: ["#2a1020", "#3a1830", "#ffb703", "#fff7ed"] },
  { id: "mint", title: "Mint Pop", colors: ["#ecfff7", "#ffffff", "#00a86b", "#0d2b25"] },
  { id: "berry", title: "Berry Ink", colors: ["#170f2b", "#25183f", "#f472b6", "#fff1f8"] },
  { id: "citrus", title: "Citrus Fresh", colors: ["#fff8e1", "#ffffff", "#f97316", "#2b2417"] },
  { id: "lagoon", title: "Lagoon", colors: ["#062b34", "#0d3f4a", "#22d3ee", "#ecfeff"] },
  { id: "graphite", title: "Graphite Lime", colors: ["#111111", "#1f1f1f", "#a3e635", "#f5f5f5"] },
  { id: "rose", title: "Rose Milk", colors: ["#fff1f2", "#ffffff", "#e11d48", "#32151d"] },
  { id: "violet", title: "Violet Night", colors: ["#160f29", "#24153d", "#a78bfa", "#f5f3ff"] },
  { id: "forest", title: "Forest", colors: ["#0f1f17", "#17291f", "#4ade80", "#ecfdf5"] },
  { id: "sand", title: "Sand & Teal", colors: ["#f7ecd3", "#fffaf0", "#0f766e", "#2d2517"] },
  { id: "aurora", title: "Aurora", colors: ["#08111f", "#121b31", "#60a5fa", "#f0f9ff"] },
  { id: "light", title: "Light Neutral", colors: ["#f7f6f2", "#ffffff", "#557b66", "#262621"] },
  { id: "warm", title: "Warm Journal", colors: ["#f4efe5", "#fffaf1", "#a86f55", "#2d2820"] },
  { id: "sage", title: "Sage Natural", colors: ["#eef3ec", "#fbfdf8", "#647d5c", "#20271f"] },
  { id: "blue", title: "Calm Blue", colors: ["#f2f6f7", "#ffffff", "#52768d", "#1f2933"] },
  { id: "custom", title: "Custom", colors: ["#111827", "#182235", "#22c55e", "#f8fafc"] }
] as const;

export const habitTemplates: HabitTemplate[] = [
  {
    id: "water",
    title: "Вода",
    description: "Несколько мягких отметок в течение дня.",
    color: "#8ea9bd",
    icon: "◌",
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
    color: "#9caf88",
    icon: "○",
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
    color: "#8796b0",
    icon: "☾",
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
    color: "#c0aa73",
    icon: "◇",
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
    color: "#b39ac8",
    icon: "✎",
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
    color: "#88a8a0",
    icon: "·",
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
    color: "#b98f72",
    icon: "△",
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
    color: "#b88a84",
    icon: "×",
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
    schemaVersion: 6,
    view: "today",
    selectedDate: todayKey(),
    habits: [],
    logs: {},
    notes: {},
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
        streak: true,
        completion: true,
        lastDone: true
      },
      visibleGrid: {
        color: true,
        icon: true,
        category: true,
        type: false,
        target: false,
        statusText: false,
        compactMeta: true,
        categoryGroups: true,
        streak: false,
        completion: false,
        daysSince: false,
        noteMarker: false,
        moodMarker: true
      },
      density: "standard",
      interfaceTheme: "dark",
      gridTheme: "soft",
      gridDisplayMode: "calendar",
      gridDensity: "standard",
      statusIcons: {
        done: "✓",
        partial: "◐",
        skipped: "–",
        missed: "×",
        planned: "·"
      },
      gridColors: {
        mode: "theme",
        bg: "#fbfaf7",
        head: "#f2f0e9",
        cell: "#f7f5ef",
        today: "#e9efe8",
        line: "#dedbd1"
      },
      forecast: {
        enabled: false,
        provider: "biorhythm",
        birthDate: "",
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
      mobileGridDays: 14,
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
      localUsers: [{ id: "local-user", name: "Пользователь", color: "#22c55e" }],
      activeUserId: "local-user",
      customPresets: {}
    }
  };
}
