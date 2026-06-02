export type View = "today" | "grid" | "habits" | "diary" | "analytics" | "notifications" | "settings" | "management";
export type HabitType = "boolean" | "numeric" | "multiple" | "avoid" | "reflection";
export type HabitStatus = "done" | "partial" | "skipped" | "missed" | "planned";
export type Density = "compact" | "standard" | "comfortable";
export type InterfaceTheme =
  | "light"
  | "blue"
  | "ash"
  | "zinc"
  | "graphiteGold"
  | "orangeGrey"
  | "yellowMono"
  | "coralGrey"
  | "glacier"
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
  | "steel"
  | "smoke"
  | "granite"
  | "rain"
  | "ember"
  | "nocturne"
  | "obsidian"
  | "ink"
  | "bronzeNight"
  | "custom";
export type GridTheme = "soft" | "classic" | "journal" | "minimal" | "ledger" | "outline" | "slate" | "calm";
export type GridMarkerShape = "circle" | "square" | "diamond" | "star" | "frame" | "ring" | "hex" | "pill";
export type GridDisplayMode = "calendar" | "compact" | "matrix" | "week" | "habit" | "timeline" | "heat";
export type PeriodMode = "last" | "week" | "month" | "custom";
export type ForecastProviderId = "biorhythm" | "humanDesign" | "astrology" | "planetaryTransits" | "aiPatternForecast";
export type ForecastScaleId = "physical" | "emotional" | "intellectual";
export type ForecastDisplayMode = "compact" | "cards" | "minimal";
export type NumerologyMetricId = "personalDay" | "personalMonth" | "personalYear" | "lifePath";
export type NumerologyDisplayMode = "compact" | "cards" | "minimal";
export type NotificationChannel = "inApp" | "browser" | "email" | "telegram" | "push";
export type NotificationTopic = "habits" | "diary" | "forecast" | "transit" | "analytics" | "reminders";
export type NotificationDeliveryStatus = "new" | "read" | "hidden" | "snoozed";
export type NotificationPriority = "low" | "medium" | "high";
export type GridColorSettings = {
  mode: "theme" | "custom";
  bg: string;
  head: string;
  cell: string;
  today: string;
  line: string;
  habitSingle: string;
  habitMuted: string;
  habitAltA: string;
  habitAltB: string;
};

export type GridHabitColorMode = "habit" | "muted" | "mono" | "alternating";
export type DiaryHistoryMode = "period" | "all";

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
  visibleScales: Record<ForecastScaleId, boolean>;
  showInToday: boolean;
  showInDiary: boolean;
  showInInspector: boolean;
  showInGrid: boolean;
  displayMode: ForecastDisplayMode;
};

export type NumerologyMetricInterpretation = {
  label: string;
  note: string;
  score: number;
};

export type NumerologySettings = {
  enabled: boolean;
  displayMode: NumerologyDisplayMode;
  visibleMetrics: Record<NumerologyMetricId, boolean>;
  weights: Record<NumerologyMetricId, number>;
  showInToday: boolean;
  showInDiary: boolean;
  showInInspector: boolean;
};

export type NotificationSettings = {
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
  topics: Record<NotificationTopic, boolean>;
  priorityOnly: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: "instant" | "daily" | "weekly";
  digestTime: string;
  weeklyDay: number;
  emailTarget: string;
  telegramTarget: string;
  pushReady: boolean;
};

export type TelegramAdminSettings = {
  enabled: boolean;
  botUsername: string;
  botTokenMasked: string;
  botTokenLast4: string;
  botTokenConfiguredInDb: boolean;
  botTokenSource: "db" | "env" | "none";
  webhookSecretMasked: string;
  webhookSecretLast4: string;
  webhookSecretConfiguredInDb: boolean;
  webhookSecretSource: "db" | "env" | "none";
  connectedUsersCount: number;
  linkedUsersCount: number;
  lastDeliveryAt?: string | null;
  lastDeliveryStatus?: string | null;
  lastWebhookStatus?: string | null;
};

export type TelegramConnectionStatus = {
  connected: boolean;
  botUsername: string;
  chatId?: string | null;
  username?: string | null;
  linkedAt?: string | null;
  revokedAt?: string | null;
  connectUrl?: string | null;
};

export type NotificationStateEntry = {
  status: NotificationDeliveryStatus;
  updatedAt: string;
  snoozedUntil?: string;
};

export type NotificationItem = {
  id: string;
  topic: NotificationTopic;
  title: string;
  message: string;
  detail: string;
  targetView: View;
  targetDate?: string;
  actionLabel: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  icon: string;
  accent: string;
  isDue: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  birthDate: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
};

export type ForecastScale = {
  id: ForecastScaleId;
  label: string;
  value: number;
  phase: "low" | "steady" | "high";
};

export type NumerologyMetric = {
  id: NumerologyMetricId;
  label: string;
  value: number;
  interpretation: string;
  weight: number;
  score: number;
};

export type NumerologyResult = {
  date: string;
  summaryScore: number;
  summaryLabel: "низкий" | "ровный" | "сильный";
  metrics: NumerologyMetric[];
  recommendation: string;
  notes: string[];
  source: "numerology";
};

export type HumanDesignTransitGate = {
  number: string;
  name: string;
  url: string;
};

export type HumanDesignTransit = {
  date: string;
  fetchedAt: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  listingUrl: string;
  descriptionUrl: string;
  gates: HumanDesignTransitGate[];
  paragraphs: string[];
  sourceUrl: string;
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
  gridMarkerShape: GridMarkerShape;
  gridHabitColorMode: GridHabitColorMode;
  calendarHistoryDays: number;
  statusIcons: Record<HabitStatus, string>;
  gridColors: GridColorSettings;
  forecast: ForecastSettings;
  numerology: NumerologySettings;
  notifications: NotificationSettings;
  focusMode: boolean;
  rightPanel: boolean;
  showWeekends: boolean;
  gridClickAction: "details" | "cycle";
  selectedCategory: string;
  selectedHabitId: string;
  iconSuggestionsCheckedAt: string;
  diaryHistoryDays: number;
  diaryHistoryMode: DiaryHistoryMode;
  analyticsHistoryDays: number;
  defaultView: View;
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
  customPresets: Record<string, Partial<UserSettings>>;
};

export type AppState = {
  schemaVersion: number;
  view: View;
  selectedDate: string;
  habits: Habit[];
  logs: Record<string, HabitLog>;
  notes: Record<string, DailyNote>;
  notificationStates: Record<string, NotificationStateEntry>;
  profile: UserProfile | null;
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
  deleteNote: (date: string) => void;
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
  importData: (json: string) => Promise<boolean>;
  setNotificationState: (id: string, status: NotificationDeliveryStatus, snoozedUntil?: string) => void;
  saveHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  resetSettings: () => void;
  resetAll: () => void;
  signOut: () => void;
  reorderHabit: (habitId: string, targetHabitId: string) => void;
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
