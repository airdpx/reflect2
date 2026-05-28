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
    schemaVersion: 2,
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
        analytics: true,
        streak: true,
        completion: true,
        lastDone: true
      },
      visibleGrid: {
        color: true,
        icon: true,
        category: true,
        streak: true,
        completion: false,
        daysSince: true,
        noteMarker: true,
        moodMarker: true
      },
      density: "standard",
      interfaceTheme: "dark",
      gridTheme: "soft",
      focusMode: false,
      rightPanel: true,
      showWeekends: true,
      gridClickAction: "details",
      defaultView: "today",
      mobileGridDays: 14,
      customPresets: {}
    }
  };
}
