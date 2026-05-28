import type { AppState, HabitStatus, HabitType } from "../types";
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

export function createDefaults(): AppState {
  return {
    schemaVersion: 2,
    view: "today",
    selectedDate: todayKey(),
    habits: [
      {
        id: "walk",
        title: "Прогулка",
        description: "Спокойное движение без давления",
        color: "#9caf88",
        icon: "○",
        category: "Здоровье",
        type: "boolean",
        target: 1,
        schedule: [1, 2, 3, 4, 5, 6, 0],
        archived: false,
        warningThreshold: 4,
        createdAt: todayKey()
      },
      {
        id: "journal",
        title: "Дневник состояния",
        description: "Короткая заметка о дне",
        color: "#b39ac8",
        icon: "✎",
        category: "Самонаблюдение",
        type: "reflection",
        target: 1,
        schedule: [1, 2, 3, 4, 5, 6, 0],
        archived: false,
        warningThreshold: 3,
        createdAt: todayKey()
      },
      {
        id: "water",
        title: "Вода",
        description: "Несколько отметок в течение дня",
        color: "#8ea9bd",
        icon: "◌",
        category: "Быт",
        type: "multiple",
        target: 5,
        schedule: [1, 2, 3, 4, 5, 6, 0],
        archived: false,
        warningThreshold: 2,
        createdAt: todayKey()
      }
    ],
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
