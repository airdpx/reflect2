import type { AppState } from "../types";
import { createDefaults } from "./defaults";

export const STORAGE_KEY = "habit-calendar-next-mvp-v1";
export const SCHEMA_VERSION = 4;

export function loadStoredState(): AppState {
  const defaults = createDefaults();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return migrateState(mergeState(defaults, JSON.parse(raw) as Partial<AppState>));
  } catch {
    return defaults;
  }
}

export function saveStoredState(state: AppState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function clearStoredState() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

function mergeState(defaults: AppState, stored: Partial<AppState>): AppState {
  return {
    ...defaults,
    ...stored,
    settings: {
      ...defaults.settings,
      ...stored.settings,
      defaultPeriod: {
        ...defaults.settings.defaultPeriod,
        ...stored.settings?.defaultPeriod
      },
      visibleBlocks: {
        ...defaults.settings.visibleBlocks,
        ...stored.settings?.visibleBlocks
      },
      visibleGrid: {
        ...defaults.settings.visibleGrid,
        ...stored.settings?.visibleGrid
      },
      customTheme: {
        ...defaults.settings.customTheme,
        ...stored.settings?.customTheme
      }
    },
    habits: stored.habits || defaults.habits,
    logs: stored.logs || defaults.logs,
    notes: stored.notes || defaults.notes
  };
}

function migrateState(state: AppState): AppState {
  const previousVersion = state.schemaVersion || 1;
  const defaults = createDefaults();
  const migratedVisibleGrid = {
    ...defaults.settings.visibleGrid,
    ...state.settings.visibleGrid
  };
  if (previousVersion < 3) {
    migratedVisibleGrid.noteMarker = false;
    migratedVisibleGrid.streak = false;
    migratedVisibleGrid.daysSince = false;
    migratedVisibleGrid.statusText = true;
  }
  return {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    settings: {
      ...defaults.settings,
      ...state.settings,
      defaultPeriod: {
        ...defaults.settings.defaultPeriod,
        ...state.settings.defaultPeriod
      },
      visibleBlocks: {
        ...defaults.settings.visibleBlocks,
        ...state.settings.visibleBlocks
      },
      visibleGrid: migratedVisibleGrid,
      customTheme: {
        ...defaults.settings.customTheme,
        ...state.settings.customTheme
      },
      gridDisplayMode: previousVersion < 3 ? "calendar" : state.settings.gridDisplayMode || defaults.settings.gridDisplayMode,
      gridDensity: state.settings.gridDensity || defaults.settings.gridDensity,
      gridClickAction: previousVersion < 3 ? "cycle" : state.settings.gridClickAction || defaults.settings.gridClickAction,
      selectedHabitId: state.settings.selectedHabitId || defaults.settings.selectedHabitId,
      todayLayout: state.settings.todayLayout || defaults.settings.todayLayout,
      diaryLayout: state.settings.diaryLayout || defaults.settings.diaryLayout,
      localUsers: state.settings.localUsers?.length ? state.settings.localUsers : defaults.settings.localUsers,
      activeUserId: state.settings.activeUserId || defaults.settings.activeUserId,
      customPresets: state.settings.customPresets || {}
    }
  };
}

export function parseImportedState(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>;
    return migrateState(mergeState(createDefaults(), parsed));
  } catch {
    return null;
  }
}
