import type { AppState } from "../types";
import { createDefaults, defaultCustomGridColors } from "./defaults";

export const STORAGE_KEY = "habit-calendar-next-mvp-v1";
export const SCHEMA_VERSION = 11;

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
    const copy = structuredClone(state) as AppState & { settings: { forecast: Record<string, unknown> } };
    delete copy.settings.forecast.birthDate;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  }
}

export function clearStoredState() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

function mergeState(defaults: AppState, stored: Partial<AppState>): AppState {
  const storedSettings = (stored.settings || {}) as Partial<AppState["settings"]> & {
    localUsers?: unknown;
    activeUserId?: unknown;
  };
  const { localUsers: _localUsers, activeUserId: _activeUserId, ...safeSettings } = storedSettings;
  return {
    ...defaults,
    ...stored,
    settings: {
      ...defaults.settings,
      ...safeSettings,
      defaultPeriod: {
        ...defaults.settings.defaultPeriod,
        ...safeSettings.defaultPeriod
      },
      visibleBlocks: {
        ...defaults.settings.visibleBlocks,
        ...safeSettings.visibleBlocks
      },
      visibleGrid: {
        ...defaults.settings.visibleGrid,
        ...safeSettings.visibleGrid
      },
      customTheme: {
        ...defaults.settings.customTheme,
        ...safeSettings.customTheme
      },
      statusIcons: {
        ...defaults.settings.statusIcons,
        ...safeSettings.statusIcons
      },
      gridColors: {
        ...defaults.settings.gridColors,
        ...safeSettings.gridColors
      },
      forecast: {
        ...defaults.settings.forecast,
        ...safeSettings.forecast,
        visibleScales: {
          ...defaults.settings.forecast.visibleScales,
          ...safeSettings.forecast?.visibleScales
        }
      }
    },
    profile: stored.profile || defaults.profile,
    habits: stored.habits || defaults.habits,
    logs: stored.logs || defaults.logs,
    notes: stored.notes || defaults.notes
  };
}

function migrateState(state: AppState): AppState {
  const previousVersion = state.schemaVersion || 1;
  const defaults = createDefaults();
  const legacyLightGridColors = {
    mode: "custom" as const,
    bg: "#fbfaf7",
    head: "#f2f0e9",
    cell: "#f7f5ef",
    today: "#e9efe8",
    line: "#dedbd1"
  };
  const gridColors =
    state.settings.gridColors?.mode === "custom" &&
    Object.entries(legacyLightGridColors).every(([key, value]) => state.settings.gridColors?.[key as keyof typeof legacyLightGridColors] === value)
      ? { ...defaultCustomGridColors }
      : state.settings.gridColors;
  const normalizedGridColors = previousVersion < 9 && gridColors?.mode === "custom"
    ? { ...defaults.settings.gridColors, mode: "theme" as const }
    : gridColors;
  const migratedVisibleGrid = {
    ...defaults.settings.visibleGrid,
    ...state.settings.visibleGrid
  };
  const legacyBirthDate = (state.settings.forecast as { birthDate?: string }).birthDate || "";
  const profile = state.profile || (legacyBirthDate ? {
    id: "local-profile",
    email: "local@habit-calendar.app",
    name: "Пользователь",
    birthDate: legacyBirthDate
  } : null);
  const forecast = { ...state.settings.forecast } as Record<string, unknown>;
  delete forecast.birthDate;
  const legacySettings = state.settings as Partial<AppState["settings"]> & {
    localUsers?: unknown;
    activeUserId?: unknown;
  };
  const { localUsers: _legacyLocalUsers, activeUserId: _legacyActiveUserId, ...legacySafeSettings } = legacySettings;
  if (previousVersion < 3) {
    migratedVisibleGrid.noteMarker = false;
    migratedVisibleGrid.daysSince = false;
    migratedVisibleGrid.statusText = true;
  }
  if (previousVersion < 10) {
    migratedVisibleGrid.category = false;
  }
  delete migratedVisibleGrid.categoryGroups;
  delete migratedVisibleGrid.streak;
  return {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    settings: {
      ...defaults.settings,
      ...legacySafeSettings,
      defaultPeriod: {
        ...defaults.settings.defaultPeriod,
        ...legacySafeSettings.defaultPeriod
      },
      visibleBlocks: {
        ...defaults.settings.visibleBlocks,
        ...legacySafeSettings.visibleBlocks
      },
      visibleGrid: migratedVisibleGrid,
      customTheme: {
        ...defaults.settings.customTheme,
        ...legacySafeSettings.customTheme
      },
      statusIcons: {
        ...defaults.settings.statusIcons,
        ...(previousVersion < 11 ? {} : legacySafeSettings.statusIcons)
      },
      gridColors: {
        ...defaults.settings.gridColors,
        ...normalizedGridColors
      },
      forecast: {
        ...defaults.settings.forecast,
        ...forecast,
        visibleScales: {
          ...defaults.settings.forecast.visibleScales,
          ...legacySafeSettings.forecast?.visibleScales
        }
      },
      gridDisplayMode: previousVersion < 10 && (!legacySafeSettings.gridDisplayMode || legacySafeSettings.gridDisplayMode === "calendar")
        ? "matrix"
        : legacySafeSettings.gridDisplayMode || defaults.settings.gridDisplayMode,
      gridDensity: legacySafeSettings.gridDensity || defaults.settings.gridDensity,
      gridClickAction: previousVersion < 3 ? "cycle" : legacySafeSettings.gridClickAction || defaults.settings.gridClickAction,
      selectedHabitId: legacySafeSettings.selectedHabitId || defaults.settings.selectedHabitId,
      todayLayout: legacySafeSettings.todayLayout || defaults.settings.todayLayout,
      diaryLayout: legacySafeSettings.diaryLayout || defaults.settings.diaryLayout,
      customPresets: legacySafeSettings.customPresets || {}
    },
    profile
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
