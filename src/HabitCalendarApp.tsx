"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type { AppActions, AppSelectors, AppState, DailyNote, Habit, HabitLog, HabitStatus, UserSettings, View } from "./types";
import { MobileNav, Sidebar, Topbar } from "./components/Navigation";
import { QuickControls } from "./components/QuickControls";
import { Inspector } from "./components/Inspector";
import { HabitModal } from "./components/HabitModal";
import { CellSheet } from "./components/CellSheet";
import { TodayView } from "./views/TodayView";
import { GridView } from "./views/GridView";
import { HabitsView } from "./views/HabitsView";
import { DiaryView } from "./views/DiaryView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";
import { createDefaults, habitTemplates, statusMeta } from "./lib/defaults";
import { calculateHabitStats, getAttentionHabits, getPeriodDates, getPeriodLabel, isHabitDue, logKey } from "./lib/analytics";
import { clearStoredState, loadStoredState, parseImportedState, saveStoredState } from "./lib/storage";
import { todayKey } from "./lib/date";

const MOBILE_GRID_DAYS = 14;

type HabitCalendarAppProps = {
  initialState?: AppState;
};

export default function HabitCalendarApp({ initialState }: HabitCalendarAppProps) {
  const [state, setState] = useState<AppState>(() => initialState || createDefaults());
  const [hydrated, setHydrated] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [draftHabit, setDraftHabit] = useState<Habit | null>(null);
  const [activeCell, setActiveCell] = useState<{ habitId: string; date: string } | null>(null);
  const [bulkUndo, setBulkUndo] = useState<Record<string, HabitLog | undefined> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const stored = initialState || loadStoredState();
    setState({ ...stored, view: stored.settings.defaultView });
    setHydrated(true);
  }, [initialState]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 719px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (hydrated) saveStoredState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated || !state.profile?.id) return;
    const timer = window.setTimeout(() => {
      fetch("/api/account/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
      }).catch(() => undefined);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [state, hydrated]);

  const activeHabits = useMemo(() => state.habits.filter((habit) => !habit.archived), [state.habits]);
  const categories = useMemo(() => Array.from(new Set(activeHabits.map((habit) => habit.category).filter(Boolean))).sort(), [activeHabits]);
  const allPeriodDates = useMemo(() => getPeriodDates(state.settings.defaultPeriod, state.settings.showWeekends), [state.settings.defaultPeriod, state.settings.showWeekends]);
  const periodDates = useMemo(
    () => isMobile ? allPeriodDates.slice(-MOBILE_GRID_DAYS) : allPeriodDates,
    [allPeriodDates, isMobile]
  );

  function updateState(updater: (draft: AppState) => AppState) {
    setState((current) => updater(structuredClone(current)));
  }

  const selectors: AppSelectors = {
    activeHabits,
    periodDates,
    hasAnyLogs: Object.keys(state.logs).length > 0,
    getLog: (habitId, date) => state.logs[logKey(habitId, date)] || null,
    isDue: isHabitDue,
    calculateStats: (habit, dates = periodDates) => calculateHabitStats(habit, dates, state.logs),
    getAttentionHabits: () => getAttentionHabits(activeHabits, periodDates, state.logs),
    periodLabel: () => getPeriodLabel(state.settings.defaultPeriod),
    categories
  };

  const actions: AppActions = {
    setView,
    setSelectedDate,
    setLog,
    clearLog,
    setNoteField,
    setPeriod,
    applyPreset,
    updateSetting,
    updateVisible,
    toggleStatus,
    cycleHabitStatus,
    markDayDone,
    clearDay,
    undoLastBulkAction,
    saveCustomPreset,
    applyCustomPreset,
    exportData,
    importData,
    saveHabit,
    deleteHabit,
    resetSettings,
    resetAll,
    signOut,
    reorderHabit,
    openHabitModal,
    openHabitTemplate,
    openCellSheet: setActiveCell
  };

  const appClass = `app density-${state.settings.density} theme-${state.settings.interfaceTheme} ${state.settings.focusMode ? "focus" : ""}`;
  const customThemeStyle = {
    ...(state.settings.interfaceTheme === "custom" ? {
    "--bg": state.settings.customTheme.bg,
    "--surface": state.settings.customTheme.surface,
    "--surface-soft": state.settings.customTheme.surface,
    "--text": state.settings.customTheme.text,
    "--accent": state.settings.customTheme.accent,
    "--accent-soft": `${state.settings.customTheme.accent}24`,
    "--status-done-bg": state.settings.customTheme.done,
    "--status-partial-bg": state.settings.customTheme.partial,
    "--status-skipped-bg": state.settings.customTheme.skipped,
    "--status-missed-bg": state.settings.customTheme.missed,
    "--status-planned-bg": state.settings.customTheme.planned
    } : {}),
    ...(state.settings.gridColors.mode === "custom" ? {
      "--grid-bg": state.settings.gridColors.bg,
      "--grid-head": state.settings.gridColors.head,
      "--grid-cell": state.settings.gridColors.cell,
      "--grid-cell-empty": state.settings.gridColors.cell,
      "--grid-today": state.settings.gridColors.today,
      "--grid-line": state.settings.gridColors.line
    } : {})
  } as React.CSSProperties;
  const editingHabit = draftHabit || (editingHabitId ? state.habits.find((habit) => habit.id === editingHabitId) || null : null);

  return (
    <div className={appClass} style={customThemeStyle}>
      <Sidebar view={state.view} onView={actions.setView} />
      <main className="main">
        <Topbar state={state} onDate={actions.setSelectedDate} onAdd={() => actions.openHabitModal("new")} />
        {state.view === "today" && <TodayView state={state} selectors={selectors} actions={actions} />}
        {state.view === "grid" && <GridView state={state} selectors={selectors} actions={actions} />}
        {state.view === "habits" && <HabitsView state={state} selectors={selectors} actions={actions} />}
        {state.view === "diary" && <DiaryView state={state} actions={actions} />}
        {state.view === "analytics" && <AnalyticsView selectors={selectors} />}
        {state.view === "settings" && <SettingsView state={state} actions={actions} />}
      </main>
      {state.settings.rightPanel && !state.settings.focusMode && <Inspector state={state} selectors={selectors} />}
      <MobileNav view={state.view} onView={actions.setView} />
      <QuickControls state={state} actions={actions} />
      {editingHabitId && <HabitModal habit={editingHabit} isTemplateDraft={Boolean(draftHabit)} actions={actions} />}
      {activeCell && <CellSheet cell={activeCell} state={state} selectors={selectors} actions={actions} />}
    </div>
  );

  function setView(view: View) {
    updateState((draft) => {
      draft.view = view;
      return draft;
    });
  }

  function setSelectedDate(date: string) {
    updateState((draft) => {
      draft.selectedDate = date;
      return draft;
    });
  }

  function setLog(habitId: string, date: string, patch: Partial<HabitLog>) {
    updateState((draft) => {
      const key = logKey(habitId, date);
      draft.logs[key] = { ...(draft.logs[key] || { habitId, date }), ...patch, updatedAt: new Date().toISOString() };
      return draft;
    });
  }

  function clearLog(habitId: string, date: string) {
    updateState((draft) => {
      delete draft.logs[logKey(habitId, date)];
      return draft;
    });
  }

  function setNoteField(key: keyof DailyNote, value: string | number) {
    updateState((draft) => {
      draft.notes[draft.selectedDate] = { ...(draft.notes[draft.selectedDate] || {}), [key]: value };
      return draft;
    });
  }

  function setPeriod(patch: Partial<UserSettings["defaultPeriod"]>) {
    updateState((draft) => {
      draft.settings.defaultPeriod = { ...draft.settings.defaultPeriod, ...patch };
      return draft;
    });
  }

  function applyPreset(preset: UserSettings["preset"]) {
    updateState((draft) => {
      draft.settings.preset = preset;
      draft.settings.focusMode = preset === "Focus";
      if (preset === "Simple") {
        draft.settings.activeStatuses = ["done"];
        draft.settings.visibleBlocks.analytics = false;
        draft.settings.visibleBlocks.stress = false;
        draft.settings.density = "comfortable";
      }
      if (preset === "Balanced") {
        draft.settings.activeStatuses = ["done", "partial", "skipped"];
        draft.settings.visibleBlocks.analytics = true;
        draft.settings.visibleBlocks.diary = true;
        draft.settings.density = "standard";
      }
      if (preset === "Journal") {
        draft.settings.gridTheme = "journal";
        draft.settings.visibleBlocks.mood = true;
        draft.settings.visibleBlocks.energy = true;
        draft.settings.visibleBlocks.stress = true;
        draft.settings.visibleGrid.moodMarker = true;
      }
      if (preset === "Analytical") {
        draft.settings.activeStatuses = ["done", "partial", "skipped", "missed"];
        draft.settings.visibleGrid.completion = true;
        draft.settings.visibleBlocks.analytics = true;
        draft.settings.density = "compact";
      }
      return draft;
    });
  }

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    updateState((draft) => {
      draft.settings[key] = value;
      return draft;
    });
  }

  function updateVisible(group: "visibleBlocks" | "visibleGrid", key: string, value: boolean) {
    updateState((draft) => {
      draft.settings[group][key] = value;
      return draft;
    });
  }

  function toggleStatus(status: HabitStatus, checked: boolean) {
    updateState((draft) => {
      const set = new Set(draft.settings.activeStatuses);
      if (checked) set.add(status);
      else set.delete(status);
      set.add("done");
      draft.settings.activeStatuses = Array.from(set).filter((item): item is HabitStatus => item in statusMeta);
      return draft;
    });
  }

  function cycleHabitStatus(habitId: string, date: string) {
    const enabled: HabitStatus[] = state.settings.activeStatuses.length ? state.settings.activeStatuses : ["done"];
    const current = state.logs[logKey(habitId, date)]?.status;
    const currentIndex = current ? enabled.indexOf(current) : -1;
    const nextStatus = enabled[(currentIndex + 1) % enabled.length];
    setLog(habitId, date, { status: nextStatus });
  }

  function markDayDone() {
    const previous: Record<string, HabitLog | undefined> = {};
    updateState((draft) => {
      const dueHabits = draft.habits.filter((habit) => !habit.archived && isHabitDue(habit, draft.selectedDate));
      for (const habit of dueHabits) {
        const key = logKey(habit.id, draft.selectedDate);
        previous[key] = draft.logs[key];
        draft.logs[key] = { ...(draft.logs[key] || { habitId: habit.id, date: draft.selectedDate }), status: "done", updatedAt: new Date().toISOString() };
      }
      return draft;
    });
    setBulkUndo(previous);
  }

  function clearDay() {
    const previous: Record<string, HabitLog | undefined> = {};
    updateState((draft) => {
      for (const key of Object.keys(draft.logs)) {
        if (key.endsWith(`:${draft.selectedDate}`)) {
          previous[key] = draft.logs[key];
          delete draft.logs[key];
        }
      }
      return draft;
    });
    setBulkUndo(previous);
  }

  function undoLastBulkAction() {
    if (!bulkUndo) return;
    updateState((draft) => {
      for (const [key, value] of Object.entries(bulkUndo)) {
        if (value) draft.logs[key] = value;
        else delete draft.logs[key];
      }
      return draft;
    });
    setBulkUndo(null);
  }

  function saveCustomPreset(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    updateState((draft) => {
      draft.settings.customPresets[cleanName] = {
        activeStatuses: [...draft.settings.activeStatuses],
        visibleBlocks: { ...draft.settings.visibleBlocks },
        visibleGrid: { ...draft.settings.visibleGrid },
        density: draft.settings.density,
        interfaceTheme: draft.settings.interfaceTheme,
        gridTheme: draft.settings.gridTheme,
        focusMode: draft.settings.focusMode,
        rightPanel: draft.settings.rightPanel,
        showWeekends: draft.settings.showWeekends,
        gridClickAction: draft.settings.gridClickAction,
        defaultView: draft.settings.defaultView,
        gridDisplayMode: draft.settings.gridDisplayMode,
        selectedCategory: draft.settings.selectedCategory,
        customTheme: { ...draft.settings.customTheme }
      };
      return draft;
    });
  }

  function applyCustomPreset(name: string) {
    updateState((draft) => {
      const preset = draft.settings.customPresets[name];
      if (preset) draft.settings = { ...draft.settings, ...preset };
      return draft;
    });
  }

  function exportData() {
    return JSON.stringify(state, null, 2);
  }

  function importData(json: string) {
    const parsed = parseImportedState(json);
    if (!parsed) return false;
    setState(parsed);
    return true;
  }

  function saveHabit(habit: Habit) {
    if (!habit.title) return;
    updateState((draft) => {
      draft.habits = draft.habits.some((item) => item.id === habit.id)
        ? draft.habits.map((item) => (item.id === habit.id ? habit : item))
        : [...draft.habits, habit];
      return draft;
    });
    setEditingHabitId(null);
    setDraftHabit(null);
  }

  function deleteHabit(habitId: string) {
    if (!window.confirm("Удалить привычку и её отметки?")) return;
    updateState((draft) => {
      draft.habits = draft.habits.filter((habit) => habit.id !== habitId);
      for (const key of Object.keys(draft.logs)) if (key.startsWith(`${habitId}:`)) delete draft.logs[key];
      return draft;
    });
    setEditingHabitId(null);
    setDraftHabit(null);
  }

  function openHabitModal(habitId: string | null) {
    setDraftHabit(null);
    setEditingHabitId(habitId);
  }

  function openHabitTemplate(templateId: string) {
    const template = habitTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setDraftHabit({
      id: crypto.randomUUID(),
      title: template.title,
      description: template.description,
      color: template.color,
      icon: template.icon,
      category: template.category,
      type: template.type,
      target: template.target,
      schedule: template.schedule,
      archived: false,
      warningThreshold: template.warningThreshold,
      createdAt: todayKey()
    });
    setEditingHabitId("new");
  }

  function resetSettings() {
    if (!window.confirm("Сбросить только настройки интерфейса?")) return;
    updateState((draft) => {
      draft.settings = createDefaults().settings;
      return draft;
    });
  }

  function resetAll() {
    if (!window.confirm("Сбросить все данные прототипа?")) return;
    clearStoredState();
    setState(createDefaults());
  }

  function signOut() {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.reload();
    });
  }

  function reorderHabit(habitId: string, targetHabitId: string) {
    if (habitId === targetHabitId) return;
    updateState((draft) => {
      const from = draft.habits.findIndex((habit) => habit.id === habitId);
      const to = draft.habits.findIndex((habit) => habit.id === targetHabitId);
      if (from < 0 || to < 0) return draft;
      const [habit] = draft.habits.splice(from, 1);
      draft.habits.splice(to, 0, habit);
      return draft;
    });
  }
}
