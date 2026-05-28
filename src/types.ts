export type View = "today" | "grid" | "diary" | "analytics" | "settings";
export type HabitType = "boolean" | "numeric" | "multiple" | "avoid" | "reflection";
export type HabitStatus = "done" | "partial" | "skipped" | "missed" | "planned";
export type Density = "compact" | "standard" | "comfortable";
export type InterfaceTheme =
  | "light"
  | "blue"
  | "dark"
  | "warm"
  | "sage"
  | "contrast"
  | "sunset"
  | "mint"
  | "berry"
  | "citrus"
  | "lagoon"
  | "graphite"
  | "rose"
  | "violet"
  | "forest"
  | "sand"
  | "aurora"
  | "custom";
export type GridTheme = "soft" | "classic" | "journal" | "minimal";
export type GridDisplayMode = "calendar" | "compact" | "matrix" | "week" | "habit" | "timeline" | "heat";
export type PeriodMode = "last" | "week" | "month" | "custom";
export type ForecastProviderId = "biorhythm" | "humanDesign" | "astrology" | "planetaryTransits" | "aiPatternForecast";
export type ForecastScaleId = "physical" | "emotional" | "intellectual";
export type ForecastDisplayMode = "compact" | "cards" | "minimal";

export type Habit = {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  category: string;
  type: HabitType;
  target: number;
  schedule: number[];
  archived: boolean;
  warningThreshold: number;
  createdAt: string;
};

export type HabitTemplate = {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  category: string;
  type: HabitType;
  target: number;
  schedule: number[];
  warningThreshold: number;
  helper: string;
};

export type HabitLog = {
  habitId: string;
  date: string;
  status?: HabitStatus;
  value?: number;
  completedCount?: number;
  note?: string;
  mood?: number;
  updatedAt?: string;
};

export type DailyNote = {
  mood?: number;
  energy?: number;
  stress?: number;
  text?: string;
  helped?: string;
  blocked?: string;
};

export type ForecastSettings = {
  enabled: boolean;
  provider: ForecastProviderId;
  birthDate: string;
  visibleScales: Record<ForecastScaleId, boolean>;
  showInToday: boolean;
  showInDiary: boolean;
  showInInspector: boolean;
  showInGrid: boolean;
  displayMode: ForecastDisplayMode;
};

export type ForecastScale = {
  id: ForecastScaleId;
  label: string;
  value: number;
  phase: "low" | "steady" | "high";
};

export type ForecastResult = {
  date: string;
  summaryScore: number;
  summaryLabel: "низкий" | "ровный" | "сильный";
  scales: ForecastScale[];
  notes: string[];
  source: ForecastProviderId;
};

export type UserSettings = {
  preset: "Simple" | "Balanced" | "Journal" | "Analytical" | "Focus";
  activeStatuses: HabitStatus[];
  defaultPeriod: {
    mode: PeriodMode;
    days: number;
    start: string;
    end: string;
  };
  visibleBlocks: Record<string, boolean>;
  visibleGrid: Record<string, boolean>;
  density: Density;
  interfaceTheme: InterfaceTheme;
  gridTheme: GridTheme;
  gridDisplayMode: GridDisplayMode;
  gridDensity: Density;
  forecast: ForecastSettings;
  focusMode: boolean;
  rightPanel: boolean;
  showWeekends: boolean;
  gridClickAction: "details" | "cycle";
  selectedCategory: string;
  selectedHabitId: string;
  defaultView: View;
  mobileGridDays: 7 | 14 | 30;
  todayLayout: "split" | "single" | "reverse";
  diaryLayout: "compact" | "full";
  customTheme: {
    bg: string;
    surface: string;
    text: string;
    accent: string;
    done: string;
    partial: string;
    skipped: string;
    missed: string;
    planned: string;
  };
  localUsers: Array<{ id: string; name: string; color: string }>;
  activeUserId: string;
  customPresets: Record<string, Partial<UserSettings>>;
};

export type AppState = {
  schemaVersion: number;
  view: View;
  selectedDate: string;
  habits: Habit[];
  logs: Record<string, HabitLog>;
  notes: Record<string, DailyNote>;
  settings: UserSettings;
};

export type HabitStats = {
  due: number;
  done: number;
  completion: number;
  streak: number;
  bestStreak: number;
  lastDone?: string;
  daysSince: number | null;
  missedPlanned: number;
};

export type AppActions = {
  setView: (view: View) => void;
  setSelectedDate: (date: string) => void;
  setLog: (habitId: string, date: string, patch: Partial<HabitLog>) => void;
  clearLog: (habitId: string, date: string) => void;
  setNoteField: (key: keyof DailyNote, value: string | number) => void;
  setPeriod: (patch: Partial<UserSettings["defaultPeriod"]>) => void;
  applyPreset: (preset: UserSettings["preset"]) => void;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateVisible: (group: "visibleBlocks" | "visibleGrid", key: string, value: boolean) => void;
  toggleStatus: (status: HabitStatus, checked: boolean) => void;
  cycleHabitStatus: (habitId: string, date: string) => void;
  markDayDone: () => void;
  clearDay: () => void;
  undoLastBulkAction: () => void;
  saveCustomPreset: (name: string) => void;
  applyCustomPreset: (name: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  saveHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  resetSettings: () => void;
  resetAll: () => void;
  openHabitModal: (habitId: string | null) => void;
  openHabitTemplate: (templateId: string) => void;
  openCellSheet: (cell: { habitId: string; date: string } | null) => void;
};

export type AppSelectors = {
  activeHabits: Habit[];
  periodDates: string[];
  hasAnyLogs: boolean;
  getLog: (habitId: string, date: string) => HabitLog | null;
  isDue: (habit: Habit, date: string) => boolean;
  calculateStats: (habit: Habit, dates?: string[]) => HabitStats;
  getAttentionHabits: () => Array<{ habit: Habit; stats: HabitStats }>;
  periodLabel: () => string;
  categories: string[];
};
