import type { AppState } from "../types";
import { createDefaults } from "./defaults";

export const STORAGE_KEY = "habit-calendar-next-mvp-v1";
export const SCHEMA_VERSION = 2;

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
      }
    },
    habits: stored.habits || defaults.habits,
    logs: stored.logs || defaults.logs,
    notes: stored.notes || defaults.notes
  };
}

function migrateState(state: AppState): AppState {
  return {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    settings: {
      ...createDefaults().settings,
      ...state.settings,
      defaultPeriod: {
        ...createDefaults().settings.defaultPeriod,
        ...state.settings.defaultPeriod
      },
      visibleBlocks: {
        ...createDefaults().settings.visibleBlocks,
        ...state.settings.visibleBlocks
      },
      visibleGrid: {
        ...createDefaults().settings.visibleGrid,
        ...state.settings.visibleGrid
      },
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
