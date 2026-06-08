import { Fragment, useEffect, useState } from "react";
import type React from "react";
import type { AppActions, AppSelectors, AppState, Density, GridDisplayMode, GridHabitColorMode, Habit, HabitStatus } from "../types";
import { addDays, formatDate, fromKey, rangeDates, todayKey, weekdayShort } from "../lib/date";
import { statusIconPresets, statusMeta } from "../lib/defaults";
import { forecastTone, getForecast } from "../lib/forecast";
import { normalizeLanguage } from "../lib/i18n";
import { TemplateChooser } from "./TodayView";
import { SelectControl, Toggle } from "../components/Common";

const gridAppearancePresets = [
  { value: "classic-square", label: { ru: "Классика", en: "Classic" }, theme: "classic", shape: "square" },
  { value: "neon-board-square", label: { ru: "Неоновая доска", en: "Neon Board" }, theme: "neonBoard", shape: "square" },
  { value: "week-checks-ring", label: { ru: "Чек-лист недели", en: "Weekly Checklist" }, theme: "weekChecks", shape: "ring" },
  { value: "signal-cards-square", label: { ru: "Сигнальные карточки", en: "Signal Cards" }, theme: "signalCards", shape: "square" },
  { value: "compact-square", label: { ru: "Компактные плашки", en: "Compact Pills" }, theme: "compact", shape: "square" },
  { value: "ledger-micro", label: { ru: "Ledger micro", en: "Ledger Micro" }, theme: "micro", shape: "square" },
  { value: "glass-frame", label: { ru: "Стеклянная сетка", en: "Glass Grid" }, theme: "glass", shape: "frame" },
  { value: "heatmap-circle", label: { ru: "Тепло-акцент", en: "Heat Accent" }, theme: "heatmap", shape: "circle" },
  { value: "hybrid-ring", label: { ru: "Гибридное кольцо", en: "Hybrid Ring" }, theme: "hybrid", shape: "ring" },
  { value: "soft-circle", label: { ru: "Мягкий круг", en: "Soft Circle" }, theme: "soft", shape: "circle" },
  { value: "soft-ring", label: { ru: "Мягкое кольцо", en: "Soft Ring" }, theme: "soft", shape: "ring" },
  { value: "ledger-square", label: { ru: "Ledger Flat", en: "Ledger Flat" }, theme: "ledger", shape: "square" },
  { value: "outline-ring", label: { ru: "Outline Ring", en: "Outline Ring" }, theme: "outline", shape: "ring" },
  { value: "slate-pill", label: { ru: "Slate Pills", en: "Slate Pills" }, theme: "slate", shape: "pill" },
  { value: "calm-frame", label: { ru: "Calm Frame", en: "Calm Frame" }, theme: "calm", shape: "frame" },
  { value: "journal-star", label: { ru: "Дневник со звездой", en: "Journal Star" }, theme: "journal", shape: "star" },
  { value: "minimal-hex", label: { ru: "Минимум", en: "Minimal" }, theme: "minimal", shape: "hex" },
  { value: "minimal-pill", label: { ru: "Минимум-пилюля", en: "Minimal Pill" }, theme: "minimal", shape: "pill" }
] as const;

const gridLabels: Record<string, { ru: string; en: string }> = {
  color: { ru: "Цвет привычки", en: "Habit color" },
  icon: { ru: "Иконка привычки", en: "Habit icon" },
  statusText: { ru: "Иконка статуса", en: "Status icon" },
  completion: { ru: "Процент", en: "Completion" },
  daysSince: { ru: "Дней с выполнения", en: "Days since done" }
};

const gridModes: Array<[GridDisplayMode, { ru: string; en: string }]> = [
  ["calendar", { ru: "Календарь", en: "Calendar" }],
  ["compact", { ru: "Мини", en: "Mini" }],
  ["matrix", { ru: "Таблица", en: "Table" }],
  ["week", { ru: "Неделя", en: "Week" }],
  ["habit", { ru: "Привычка", en: "Habit" }],
  ["timeline", { ru: "Лента", en: "Timeline" }],
  ["heat", { ru: "Тепло", en: "Heat" }]
];

const gridHabitColorOptions: Array<[GridHabitColorMode, { ru: string; en: string }]> = [
  ["habit", { ru: "По цвету привычки", en: "By habit color" }],
  ["muted", { ru: "Приглушенные цвета", en: "Muted colors" }],
  ["mono", { ru: "Один цвет", en: "Single color" }],
  ["alternating", { ru: "Два цвета", en: "Two colors" }]
];

const gridText = {
  ru: {
    period: "Период сетки",
    daysSuffix: "дней",
    dayHistory: "История календаря",
    displayed: "Отображается",
    configure: "Настроить календарь и таблицу",
    tableStyle: "Оформление таблицы",
    habitColor: "Цвет привычек",
    tableColors: "Цвета таблицы",
    gridDensity: "Плотность сетки",
    cellClick: "Клик по ячейке",
    filterVisibility: "Фильтр и видимость",
    showWeekends: "Показывать выходные",
    visibleElements: "Видимые элементы",
    checkInIcons: "Иконки отметок",
    habitColumn: "Привычка",
    noHabitsTitle: "Сетка появится после первой привычки",
    noHabitsText: "Создайте привычку с нуля или начните с готового шаблона.",
    createHabit: "Создать привычку",
    noCategoryTitle: "В этой категории пока нет привычек",
    noCategoryText: "Выберите другую категорию или добавьте привычку в текущую.",
    noDatesTitle: "В выбранном периоде нет дат",
    noDatesText: "Проверьте диапазон или верните выходные в настройках сетки.",
    clickCycle: "клик меняет статус",
    clickDetails: "детали отметки",
    fastCycle: "быстрая смена статуса",
    details: "детали",
    todayLabel: "сегодня",
    selectedDay: "Выбранный день",
    grid: "Сетка",
    note: "заметка"
  },
  en: {
    period: "Grid period",
    daysSuffix: "days",
    dayHistory: "Calendar history",
    displayed: "Displayed",
    configure: "Customize calendar and table",
    tableStyle: "Table style",
    habitColor: "Habit color",
    tableColors: "Table colors",
    gridDensity: "Grid density",
    cellClick: "Cell click",
    filterVisibility: "Filter and visibility",
    showWeekends: "Show weekends",
    visibleElements: "Visible elements",
    checkInIcons: "Check-in icons",
    habitColumn: "Habit",
    noHabitsTitle: "The grid will appear after your first habit",
    noHabitsText: "Create a habit from scratch or start with a ready-made template.",
    createHabit: "Create habit",
    noCategoryTitle: "There are no habits in this category yet",
    noCategoryText: "Pick another category or add a habit to the current one.",
    noDatesTitle: "There are no dates in the selected period",
    noDatesText: "Check the range or bring weekends back in grid settings.",
    clickCycle: "click cycles status",
    clickDetails: "check-in details",
    fastCycle: "quick status change",
    details: "details",
    todayLabel: "today",
    selectedDay: "Selected day",
    grid: "Grid",
    note: "note"
  }
} as const;

const statusLabels = {
  ru: {
    done: "Выполнено",
    partial: "Частично",
    skipped: "Пропуск",
    missed: "Не выполнено",
    planned: "Запланировано"
  },
  en: {
    done: "Done",
    partial: "Partial",
    skipped: "Skip",
    missed: "Missed",
    planned: "Planned"
  }
} as const;

const habitTypeLabelsLocalized = {
  ru: {
    boolean: "Обычная",
    numeric: "Числовая",
    multiple: "Несколько раз в день",
    avoid: "Не делать",
    reflection: "Самонаблюдение"
  },
  en: {
    boolean: "Boolean",
    numeric: "Numeric",
    multiple: "Multiple",
    avoid: "Avoid",
    reflection: "Reflection"
  }
} as const;

export function GridView({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  const t = gridText[language];
  const p = state.settings.defaultPeriod;
  const viewportWidth = useViewportWidth();
  const historyDays = Math.max(0, state.settings.calendarHistoryDays);
  const periodDays = Math.max(1, selectors.periodDates.length);
  const historyStart = toKey(addDays(fromKey(todayKey()), -historyDays));
  const periodEnd = toKey(addDays(fromKey(todayKey()), periodDays - 1));
  const gridDates = rangeDates(historyStart, periodEnd);
  const visibleHabits = selectors.activeHabits.filter((habit) => state.settings.selectedCategory === "all" || habit.category === state.settings.selectedCategory);
  const habitIndexMap = new Map(visibleHabits.map((habit, index) => [habit.id, index]));
  return (
    <section className="stack">
      <div className="panel period-panel">
        <div className="section-head">
          <div>
            <h3>{t.period}</h3>
            <p className="muted">{selectors.periodLabel()} · {selectors.periodDates.length} {t.daysSuffix}</p>
          </div>
        </div>
        <div className="period-layout compact-period-layout">
          <div className="chips">
            {[7, 14, 30, 90].map((days) => (
              <button className={`chip ${p.mode === "last" && p.days === days ? "active" : ""}`} key={days} onClick={() => actions.setPeriod({ mode: "last", days })}>
                {days} {t.daysSuffix}
              </button>
            ))}
            <button className={`chip ${p.mode === "week" ? "active" : ""}`} onClick={() => actions.setPeriod({ mode: "week" })}>{language === "en" ? "Week" : "Неделя"}</button>
            <button className={`chip ${p.mode === "month" ? "active" : ""}`} onClick={() => actions.setPeriod({ mode: "month" })}>{language === "en" ? "Month" : "Месяц"}</button>
          </div>
          <div className="period-custom compact-period-field">
            <label>{language === "en" ? "N days" : "N дней"}</label>
            <input className="input" type="number" min="1" max="365" value={p.days} onChange={(event) => actions.setPeriod({ mode: "last", days: clampDays(event.target.value) })} />
          </div>
          <div className="period-custom compact-period-field calendar-history-field">
            <label>{t.dayHistory}</label>
            <select
              className="input"
              value={String(state.settings.calendarHistoryDays)}
              onChange={(event) => actions.updateSetting("calendarHistoryDays", Number(event.target.value))}
            >
              {["0", "7", "14", "30", "60", "90", "180", "365"].map((days) => (
                <option key={days} value={days}>{days} {t.daysSuffix}</option>
              ))}
            </select>
          </div>
          <details className="period-range-details">
            <summary>{language === "en" ? "Range" : "Диапазон"}</summary>
            <div className="period-range">
              <input className="input" type="date" value={p.start} onChange={(event) => actions.setPeriod({ mode: "custom", start: event.target.value })} />
              <input className="input" type="date" value={p.end} onChange={(event) => actions.setPeriod({ mode: "custom", end: event.target.value })} />
            </div>
          </details>
        </div>
        <p className="muted period-total-note">
          {t.displayed}: {historyDays} {t.daysSuffix} {language === "en" ? "of history" : "истории"} + {periodDays} {t.daysSuffix} {language === "en" ? "of period" : "периода"}.
        </p>
      </div>
      <CalendarSettingsPanel state={state} selectors={selectors} actions={actions} />
      <CalendarGrid state={state} selectors={selectors} actions={actions} dates={gridDates} viewportWidth={viewportWidth} habitIndexMap={habitIndexMap} />
    </section>
  );
}

function CalendarSettingsPanel({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  const appearanceValue = gridAppearancePresets.find((preset) => preset.theme === state.settings.gridTheme && preset.shape === state.settings.gridMarkerShape)?.value || "classic-square";
  return (
    <details className="panel module-panel calendar-settings-panel">
      <summary>{gridText[language].configure}</summary>
      <div className="module-controls">
        <div className="calendar-settings-grid">
          <SelectControl
            label={gridText[language].tableStyle}
            value={appearanceValue}
            options={gridAppearancePresets.map(({ value, label }) => ({ value, label: label[language] }))}
            onChange={(value) => {
              const preset = gridAppearancePresets.find((item) => item.value === value);
              if (!preset) return;
              actions.updateSetting("gridTheme", preset.theme as AppState["settings"]["gridTheme"]);
              actions.updateSetting("gridMarkerShape", preset.shape as AppState["settings"]["gridMarkerShape"]);
            }}
          />
          <SelectControl
            label={gridText[language].habitColor}
            value={state.settings.gridHabitColorMode}
            options={gridHabitColorOptions.map(([value, label]) => ({ value, label: label[language] }))}
            onChange={(value) => actions.updateSetting("gridHabitColorMode", value as GridHabitColorMode)}
          />
          <SelectControl
            label={gridText[language].tableColors}
            value={state.settings.gridColors.mode}
            options={[
              { value: "theme", label: language === "en" ? "By theme" : "По теме" },
              { value: "custom", label: language === "en" ? "Custom colors" : "Свои цвета" }
            ]}
            onChange={(value) => actions.updateSetting("gridColors", { ...state.settings.gridColors, mode: value as "theme" | "custom" })}
          />
          <SelectControl
            label={gridText[language].gridDensity}
            value={state.settings.gridDensity}
            options={[
              { value: "compact", label: language === "en" ? "Compact" : "compact" },
              { value: "standard", label: language === "en" ? "Standard" : "standard" },
              { value: "comfortable", label: language === "en" ? "Comfortable" : "comfortable" }
            ]}
            onChange={(value) => actions.updateSetting("gridDensity", value as Density)}
          />
          <SelectControl
            label={gridText[language].cellClick}
            value={state.settings.gridClickAction}
            options={[
              { value: "cycle", label: language === "en" ? "Cycle" : "cycle" },
              { value: "details", label: language === "en" ? "Details" : "details" }
            ]}
            onChange={(value) => actions.updateSetting("gridClickAction", value as "cycle" | "details")}
          />
        </div>
        {state.settings.gridColors.mode === "custom" && (
          <div className="mini-color-grid calendar-color-grid">
            {[
              ["bg", "Фон"],
              ["head", "Шапка"],
              ["cell", "Ячейки"],
              ["today", "Сегодня"],
              ["line", "Линии"],
              ["habitSingle", "Привычки: один цвет"],
              ["habitAltA", "Привычки: цвет A"],
              ["habitAltB", "Привычки: цвет B"]
            ].map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="color"
                  value={state.settings.gridColors[key as keyof typeof state.settings.gridColors] as string}
                  onChange={(event) => actions.updateSetting("gridColors", { ...state.settings.gridColors, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
        )}
        <details className="quick-subsection">
          <summary>{gridText[language].filterVisibility}</summary>
          <div className="module-controls">
            <SelectControl
              label={language === "en" ? "Category" : "Категория"}
              value={state.settings.selectedCategory}
              options={[{ value: "all", label: language === "en" ? "All categories" : "all" }, ...selectors.categories.map((category) => ({ value: category, label: category }))]}
              onChange={(value) => actions.updateSetting("selectedCategory", value)}
            />
            <Toggle label={gridText[language].showWeekends} checked={state.settings.showWeekends} className="compact-check-row" onChange={(checked) => actions.updateSetting("showWeekends", checked)} />
          </div>
        </details>
        <div className="calendar-mode-row">
          {gridModes.map(([mode, label]) => (
            <button
              key={mode}
              className={state.settings.gridDisplayMode === mode ? "active" : ""}
              title={label[language]}
              onClick={() => actions.updateSetting("gridDisplayMode", mode)}
            >
              <b>{modeIcon(mode)}</b>
              <span>{label[language]}</span>
            </button>
          ))}
        </div>
        <div className="status-preview-strip">
          {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
            <button
              key={status}
              className={`${statusMeta[status].className} ${state.settings.activeStatuses.includes(status) ? "active" : ""}`}
              onClick={() => actions.toggleStatus(status, !state.settings.activeStatuses.includes(status))}
              title={language === "en" ? "Enable or disable status" : "Включить или выключить статус"}
            >
              <b>{state.settings.statusIcons[status] || statusMeta[status].short}</b>
              <span>{statusLabels[language][status]}</span>
            </button>
          ))}
        </div>
        <details className="quick-subsection">
          <summary>{gridText[language].visibleElements}</summary>
          <div className="module-toggle-grid">
            {Object.entries(gridLabels).map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.visibleGrid[key]} onChange={(event) => actions.updateVisible("visibleGrid", key, event.target.checked)} />
                <span>{label[language]}</span>
              </label>
            ))}
          </div>
        </details>
        <details className="quick-subsection">
          <summary>{gridText[language].checkInIcons}</summary>
          <div className="status-icon-grid">
            {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
              <label key={status}>
                <span>{statusLabels[language][status]}</span>
                <input
                  maxLength={4}
                  value={state.settings.statusIcons[status] || statusMeta[status].short}
                  onChange={(event) => actions.updateSetting("statusIcons", { ...state.settings.statusIcons, [status]: event.target.value.slice(0, 4) })}
                />
                <div className="tiny-preset-row">
                  {statusIconPresets[status].map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      className={state.settings.statusIcons[status] === icon ? "active" : ""}
                      onClick={() => actions.updateSetting("statusIcons", { ...state.settings.statusIcons, [status]: icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </label>
            ))}
          </div>
        </details>
      </div>
    </details>
  );
}

function CalendarGrid({
  state,
  selectors,
  actions,
  dates,
  viewportWidth,
  habitIndexMap
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
  dates: string[];
  viewportWidth: number;
  habitIndexMap: Map<string, number>;
}) {
  const language = normalizeLanguage(state.settings.language);
  const visibleHabits = selectors.activeHabits.filter((habit) => state.settings.selectedCategory === "all" || habit.category === state.settings.selectedCategory);
  if (!selectors.activeHabits.length) {
    return (
      <div className="stack">
        <div className="empty action-empty">
          <div>
            <b>{gridText[normalizeLanguage(state.settings.language)].noHabitsTitle}</b>
            <span>{gridText[normalizeLanguage(state.settings.language)].noHabitsText}</span>
          </div>
          <button className="btn primary" onClick={() => actions.openHabitModal("new")}>{gridText[normalizeLanguage(state.settings.language)].createHabit}</button>
        </div>
        <TemplateChooser actions={actions} language={language} />
      </div>
    );
  }
  if (!visibleHabits.length) return <div className="empty action-empty"><b>{gridText[language].noCategoryTitle}</b><span>{gridText[language].noCategoryText}</span></div>;
  if (!dates.length) return <div className="empty action-empty"><b>{gridText[language].noDatesTitle}</b><span>{gridText[language].noDatesText}</span></div>;
  const renderers: Record<GridDisplayMode, React.ReactNode> = {
    calendar: <CalendarMonthGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} compact={false} state={state} selectors={selectors} actions={actions} />,
    compact: <CalendarMonthGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} compact state={state} selectors={selectors} actions={actions} />,
    matrix: <WeekMatrixGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} viewportWidth={viewportWidth} state={state} selectors={selectors} actions={actions} />,
    week: <WeekFocusGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} state={state} selectors={selectors} actions={actions} />,
    habit: <HabitTimelineGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} state={state} selectors={selectors} actions={actions} />,
    timeline: <TimelineGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} state={state} selectors={selectors} actions={actions} />,
    heat: <HeatGrid habits={visibleHabits} habitIndexMap={habitIndexMap} dates={dates} state={state} selectors={selectors} actions={actions} />
  };
  return <div className={`grid-mode grid-theme-${state.settings.gridTheme} density-grid-${state.settings.gridDensity}`}>{renderers[state.settings.gridDisplayMode] || renderers.calendar}</div>;
}

function CalendarMonthGrid({
  habits,
  habitIndexMap,
  dates,
  compact,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  habitIndexMap: Map<string, number>;
  dates: string[];
  compact: boolean;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const weeks = chunkWeeks(dates);
  const language = normalizeLanguage(state.settings.language);
  return (
    <div>
      <div className={`month-calendar ${compact ? "compact-calendar" : ""}`}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
          <div className="month-week-head" key={index}>{language === "en" ? day : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index]}</div>
        ))}
        {weeks.flat().map((date, index) => date ? (
          <div className={`calendar-day ${date === todayKey() ? "today" : ""}`} key={date}>
            <div className="calendar-day-head">
              <b>{formatDate(date, "short", language)}</b>
              <span>{weekdayShort(date, language)}</span>
            </div>
            <ForecastDayMarker date={date} state={state} />
            <div className="calendar-day-list">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <CalendarHabitMark key={`${habit.id}-${date}`} habit={habit} habitIndex={habitIndexMap.get(habit.id) || 0} date={date} compact={compact} state={state} selectors={selectors} actions={actions} />
              ))}
            </div>
          </div>
        ) : <div className="calendar-day empty-day" key={`empty-${index}`} />)}
      </div>
      <Legend statuses={state.settings.activeStatuses} state={state} />
    </div>
  );
}

function ForecastDayMarker({ date, state }: { date: string; state: AppState }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInGrid) return null;
  const language = normalizeLanguage(state.settings.language);
  const forecast = getForecast(date, state.settings.forecast, state.profile?.birthDate || "", language);
  if (!forecast) return null;
  return <i className={`forecast-day-marker forecast-marker-${forecastTone(forecast.summaryScore)}`} title={`${language === "en" ? "Day forecast" : "Прогноз дня"}: ${forecast.summaryScore}%`} />;
}

function CalendarHabitMark({
  habit,
  habitIndex,
  date,
  compact,
  state,
  selectors,
  actions
}: {
  habit: Habit;
  habitIndex: number;
  date: string;
  compact: boolean;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  const log = selectors.getLog(habit.id, date);
  const status = getDisplayStatus(log?.status || "planned", state);
  const className = status ? statusMeta[status].className : "";
  const title = `${habit.title} · ${formatDate(date, "long", language)} · ${state.settings.gridClickAction === "cycle" ? (language === "en" ? "click cycles status" : "клик меняет статус") : (language === "en" ? "check-in details" : "детали отметки")}`;
  const markStyle = getHabitMarkStyle(state, habit, habitIndex);
  return (
    <button
      className={`calendar-mark ${compact ? "compact-mark" : ""} ${className}`}
      style={markStyle}
      title={title}
      onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
      onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
    >
      {compact ? (
        <span className="compact-mark-content">
          {state.settings.visibleGrid.color && <i style={{ background: markStyle["--habit-color"] as string }} />}
          {state.settings.visibleGrid.icon && <b>{habit.icon}</b>}
          {state.settings.visibleGrid.statusText && status && status !== "planned" && <em>{statusIcon(status, state)}</em>}
          {state.settings.visibleGrid.noteMarker && log?.note && <small className="marker-note-inline" />}
        </span>
      ) : (
        <>
          {state.settings.visibleGrid.color && <i style={{ background: markStyle["--habit-color"] as string }} />}
          <span className="calendar-mark-title">{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</span>
          {state.settings.visibleGrid.statusText && status && status !== "planned" && <em>{statusIcon(status, state)}</em>}
          {!state.settings.visibleGrid.statusText && status && status !== "planned" && <em>{statusIcon(status, state)}</em>}
          {state.settings.visibleGrid.noteMarker && log?.note && <small className="marker-note-inline" />}
          {state.settings.visibleGrid.type && <small>{habitTypeLabelsLocalized[language][habit.type]}</small>}
          {state.settings.visibleGrid.target && habit.target > 1 && <small>{habit.target}</small>}
        </>
      )}
    </button>
  );
}

function WeekMatrixGrid({
  habits,
  habitIndexMap,
  dates,
  viewportWidth,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  habitIndexMap: Map<string, number>;
  dates: string[];
  viewportWidth: number;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const chunkSize = getMatrixChunkSize(viewportWidth);
  const weeks = chunkByCount(dates, chunkSize);
  const language = normalizeLanguage(state.settings.language);
  return (
    <div>
      <div className="week-matrix-stack">
        {weeks.map((week, index) => (
          <div className="week-matrix" key={index}>
            <div className="week-matrix-grid" style={{ "--days": week.length } as React.CSSProperties & Record<"--days", number>}>
              <div className="grid-head">{gridText[language].habitColumn}</div>
              {week.map((date) => <div className={`grid-head ${date === todayKey() ? "today" : ""}`} key={date}><span>{weekdayShort(date, language)}</span><b>{formatDate(date, "short", language)}</b></div>)}
              {habits.map((habit) => (
                <Fragment key={`${habit.id}-${index}`}>
                  <div className="grid-name matrix-name" style={getHabitMarkStyle(state, habit, habitIndexMap.get(habit.id) || 0, "row")}>
                    {state.settings.visibleGrid.color && <i className="habit-dot" style={{ height: 18, background: getHabitTone(habit, habitIndexMap.get(habit.id) || 0, state) }} />}
                    <div className="grid-habit-text">
                      <strong>{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</strong>
                      <span>{gridHabitMeta(habit, state, selectors)}</span>
                    </div>
                  </div>
                  {week.map((date) => <GridCell key={`${habit.id}-${date}`} habit={habit} habitIndex={habitIndexMap.get(habit.id) || 0} date={date} state={state} selectors={selectors} actions={actions} />)}
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Legend statuses={state.settings.activeStatuses} state={state} />
    </div>
  );
}

function WeekFocusGrid({
  habits,
  habitIndexMap,
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  habitIndexMap: Map<string, number>;
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const focusDates = dates.slice(-Math.min(14, dates.length)).slice(-7);
  const language = normalizeLanguage(state.settings.language);
  return (
    <div>
      <div className="week-focus-grid">
        {focusDates.map((date) => (
          <div className={`week-focus-day ${date === todayKey() ? "today" : ""}`} key={date}>
            <div className="calendar-day-head">
              <b>{formatDate(date, "short", language)}</b>
              <span>{weekdayShort(date, language)}</span>
            </div>
            <div className="week-focus-list">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <button
                  className={`week-check ${statusClass(getDisplayStatus(selectors.getLog(habit.id, date)?.status || "planned", state))}`}
                  key={habit.id}
                  title={`${habit.title} · ${formatDate(date, "long", language)}`}
                  style={getHabitMarkStyle(state, habit, habitIndexMap.get(habit.id) || 0, "focus")}
                  onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                  onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
                >
                  <i style={{ background: getHabitTone(habit, habitIndexMap.get(habit.id) || 0, state) }} />
                  <span>{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</span>
                  <b>{displayStatusIcon(selectors.getLog(habit.id, date)?.status || "planned", state)}</b>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Legend statuses={state.settings.activeStatuses} state={state} />
    </div>
  );
}

function HabitTimelineGrid({
  habits,
  habitIndexMap,
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  habitIndexMap: Map<string, number>;
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const habit = habits.find((item) => item.id === state.settings.selectedHabitId) || habits[0];
  const language = normalizeLanguage(state.settings.language);
  return (
    <div className="habit-timeline">
      <div className="section-head compact-head">
        <div>
          <h3>{habit.icon} {habit.title}</h3>
          <p className="muted">{gridHabitMeta(habit, state, selectors) || (language === "en" ? "History of the selected habit" : "История выбранной привычки")}</p>
        </div>
        <select className="select compact-select" value={habit.id} onChange={(event) => actions.updateSetting("selectedHabitId", event.target.value)}>
          {habits.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.title}</option>)}
        </select>
      </div>
      <div className="habit-strip">
        {chunkByCount(dates, 7).map((group, index) => (
          <div className="habit-strip-row" key={index}>
            {group.map((date) => (
              <button
                className={`habit-day-chip ${statusClass(getDisplayStatus(selectors.getLog(habit.id, date)?.status || (selectors.isDue(habit, date) ? "planned" : undefined), state))}`}
                key={date}
                title={`${habit.title} · ${formatDate(date, "long", language)}`}
                style={getHabitMarkStyle(state, habit, habitIndexMap.get(habit.id) || 0, "tile")}
                onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
              >
                <span>{formatDate(date, "short", language)}</span>
                <b>{displayStatusIcon(selectors.getLog(habit.id, date)?.status || "planned", state)}</b>
              </button>
            ))}
          </div>
        ))}
      </div>
      <Legend statuses={state.settings.activeStatuses} state={state} />
    </div>
  );
}

function TimelineGrid({
  habits,
  habitIndexMap,
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  habitIndexMap: Map<string, number>;
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  return (
    <div>
      <div className="timeline-grid">
        {dates.map((date) => (
          <div className={`timeline-day ${date === todayKey() ? "today" : ""}`} key={date}>
            <div className="timeline-date">
              <b>{formatDate(date, "short", language)}</b>
              <span>{weekdayShort(date, language)}</span>
            </div>
            <div className="timeline-dots">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <button
                  className={`timeline-dot ${statusClass(getDisplayStatus(selectors.getLog(habit.id, date)?.status || "planned", state))}`}
                  key={habit.id}
                  title={`${habit.title} · ${formatDate(date, "long", language)}`}
                  style={getHabitMarkStyle(state, habit, habitIndexMap.get(habit.id) || 0, "dot")}
                  onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                  onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
                >
                  <span>{timelineStatusIcon(getDisplayStatus(selectors.getLog(habit.id, date)?.status || "planned", state), state)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Legend statuses={state.settings.activeStatuses} state={state} />
    </div>
  );
}

function HeatGrid({
  habits,
  habitIndexMap,
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  habitIndexMap: Map<string, number>;
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  return (
    <div>
      <div className="heat-grid">
        {dates.map((date) => {
          const dueHabits = habits.filter((habit) => selectors.isDue(habit, date));
          const done = dueHabits.filter((habit) => selectors.getLog(habit.id, date)?.status === "done").length;
          const intensity = dueHabits.length ? Math.max(1, Math.ceil((done / dueHabits.length) * 4)) : 0;
          return (
            <div className={`heat-day heat-${intensity} ${date === todayKey() ? "today" : ""}`} key={date}>
              <div className="calendar-day-head">
                <b>{formatDate(date, "short", language)}</b>
                <span>{done}/{dueHabits.length}</span>
              </div>
              <div className="heat-actions">
                {dueHabits.map((habit) => (
                <button
                  className={`heat-dot ${statusClass(getDisplayStatus(selectors.getLog(habit.id, date)?.status || "planned", state))}`}
                  key={habit.id}
                  title={`${habit.title} · ${formatDate(date, "long", language)}`}
                  style={getHabitMarkStyle(state, habit, habitIndexMap.get(habit.id) || 0, "heat")}
                  onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                  onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
                >
                  <span>{heatStatusIcon(getDisplayStatus(selectors.getLog(habit.id, date)?.status || "planned", state), state)}</span>
                </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Legend statuses={state.settings.activeStatuses} state={state} />
    </div>
  );
}

function GridCell({
  habit,
  habitIndex,
  date,
  state,
  selectors,
  actions
}: {
  habit: Habit;
  habitIndex: number;
  date: string;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  const log = selectors.getLog(habit.id, date);
  const status = log?.status || (selectors.isDue(habit, date) ? "planned" : undefined);
  const visibleStatus = getDisplayStatus(status, state);
  const className = visibleStatus ? statusMeta[visibleStatus].className : "";
  const themeClass = [
    "soft",
    "classic",
    "journal",
    "minimal",
    "ledger",
    "outline",
    "slate",
    "calm",
    "compact",
    "glass",
    "heatmap",
    "hybrid",
    "micro",
    "neonBoard",
    "weekChecks",
    "signalCards"
  ].includes(state.settings.gridTheme) ? state.settings.gridTheme : "";
  const markStyle = getHabitMarkStyle(state, habit, habitIndex, "cell");
  return (
    <div className={`grid-cell ${date === todayKey() ? "today" : ""} ${themeClass}`}>
      <button
        className={`${className} shape-${state.settings.gridMarkerShape}`}
        style={markStyle}
        title={`${habit.title} · ${formatDate(date, "long", language)} · ${state.settings.gridClickAction === "cycle" ? (language === "en" ? "quick status change" : "быстрая смена статуса") : (language === "en" ? "details" : "детали")}`}
        onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
      >
        <span className="mark-core">
          {visibleStatus && visibleStatus !== "planned" ? statusIcon(visibleStatus, state) : ""}
          {state.settings.visibleGrid.noteMarker && log?.note && <i className="marker-note" />}
          {state.settings.visibleGrid.moodMarker && (log?.mood || state.notes[date]?.mood) && <i className="marker-mood" />}
        </span>
      </button>
    </div>
  );
}

function gridHabitMeta(habit: Habit, state: AppState, selectors: AppSelectors) {
  const stats = selectors.calculateStats(habit);
  const parts = [];
  if (state.settings.visibleGrid.category && habit.category) parts.push(habit.category);
  if (state.settings.visibleGrid.type) parts.push(habitTypeLabelsLocalized[normalizeLanguage(state.settings.language)][habit.type]);
  if (state.settings.visibleGrid.target && habit.target > 1) parts.push(`цель ${habit.target}`);
  if (state.settings.visibleGrid.completion) parts.push(`${stats.completion}%`);
  if (state.settings.visibleGrid.daysSince) parts.push(`${stats.daysSince ?? "нет"} дн.`);
  return parts.join(" · ");
}

function statusClass(status?: HabitStatus) {
  return status ? statusMeta[status].className : "";
}

function statusIcon(status: HabitStatus, state: AppState) {
  return state.settings.statusIcons[status] || statusMeta[status].short;
}

function displayStatusIcon(status: HabitStatus | undefined, state: AppState) {
  const visibleStatus = getDisplayStatus(status, state);
  return visibleStatus ? statusIcon(visibleStatus, state) : "";
}

function getDisplayStatus(status: HabitStatus | undefined, state: AppState) {
  if (!status || !state.settings.activeStatuses.includes(status)) return undefined;
  return status;
}

function getHabitTone(habit: Habit, habitIndex: number, state: AppState) {
  const mutedTone = `color-mix(in srgb, ${habit.color} 58%, var(--surface-soft))`;
  if (state.settings.gridHabitColorMode === "habit") return habit.color;
  if (state.settings.gridHabitColorMode === "muted") return mutedTone;
  if (state.settings.gridHabitColorMode === "mono") return state.settings.gridColors.habitSingle || "color-mix(in srgb, var(--accent) 78%, var(--grid-cell-empty))";
  if (state.settings.gridHabitColorMode === "alternating") return habitIndex % 2 === 0
    ? state.settings.gridColors.habitAltA || "color-mix(in srgb, var(--accent) 78%, var(--grid-cell-empty))"
    : state.settings.gridColors.habitAltB || "color-mix(in srgb, var(--warn) 76%, var(--grid-cell-empty))";
  return mutedTone;
}

function getHabitMarkStyle(state: AppState, habit: Habit, habitIndex: number, variant: "cell" | "focus" | "tile" | "dot" | "heat" | "row" = "cell") {
  const tone = getHabitTone(habit, habitIndex, state);
  if (variant === "row") {
    return {
      "--habit-color": tone
    } as React.CSSProperties & Record<"--habit-color", string>;
  }
  if (state.settings.gridTheme === "weekChecks" && variant === "cell") {
    return {
      "--habit-color": tone,
      borderColor: "color-mix(in srgb, var(--muted) 58%, var(--grid-line))"
    } as React.CSSProperties & Record<"--habit-color", string>;
  }
  const fallbackBackground = variant === "dot"
    ? "color-mix(in srgb, var(--surface-soft) 68%, var(--surface))"
    : variant === "heat"
      ? "color-mix(in srgb, var(--surface-soft) 76%, var(--surface))"
      : "color-mix(in srgb, var(--grid-cell-empty) 70%, var(--surface))";
  const fallbackBorder = variant === "dot"
    ? "color-mix(in srgb, var(--line) 72%, transparent)"
    : "color-mix(in srgb, var(--grid-line) 72%, transparent)";
  const habitBackground = state.settings.gridHabitColorMode === "habit"
    ? `color-mix(in srgb, ${tone} 82%, var(--grid-cell-empty))`
    : state.settings.gridHabitColorMode === "muted"
      ? `color-mix(in srgb, ${tone} 78%, var(--grid-cell-empty))`
      : tone;
  const habitBorder = state.settings.gridHabitColorMode === "habit" || state.settings.gridHabitColorMode === "muted"
    ? `color-mix(in srgb, ${tone} 84%, var(--grid-line))`
    : `color-mix(in srgb, ${tone} 62%, var(--grid-line))`;
  return {
    "--habit-color": tone,
    background: habitBackground || fallbackBackground,
    borderColor: habitBorder || fallbackBorder
  } as React.CSSProperties & Record<"--habit-color", string>;
}

function timelineStatusIcon(status: HabitStatus | undefined, state: AppState) {
  if (!status) return "";
  if (status === "done") return "✓";
  return statusIcon(status, state);
}

function heatStatusIcon(status: HabitStatus | undefined, state: AppState) {
  if (!status) return "";
  if (status === "done") return "🔥";
  return statusIcon(status, state);
}

function modeIcon(mode: GridDisplayMode) {
  const icons: Record<GridDisplayMode, string> = {
    calendar: "🗓️",
    compact: "🔹",
    matrix: "▦",
    week: "7",
    habit: "✨",
    timeline: "〰️",
    heat: "🔥"
  };
  return icons[mode];
}

function Legend({ statuses, state }: { statuses: HabitStatus[]; state?: AppState }) {
  const visibleStatuses = Array.from(new Set(statuses));
  const language = normalizeLanguage(state?.settings.language);
  return (
    <div className="legend">
      {visibleStatuses.map((status) => <span key={status}>{state ? `${statusIcon(status, state)} ` : ""}{statusLabels[language][status]}</span>)}
    </div>
  );
}

function chunkWeeks(dates: string[]) {
  const cells: Array<string | null> = [];
  if (!dates.length) return [];
  const first = new Date(`${dates[0]}T00:00:00`);
  const firstDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
  for (let index = 0; index < firstDay; index += 1) cells.push(null);
  cells.push(...dates);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

function chunkByCount(dates: string[], size: number) {
  const groups: string[][] = [];
  for (let index = 0; index < dates.length; index += size) groups.push(dates.slice(index, index + size));
  return groups;
}

function getMatrixChunkSize(width: number) {
  if (width < 920) return 7;
  return 14;
}

function useViewportWidth() {
  const [width, setWidth] = useState(1400);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

function clampDays(value: string) {
  return Math.min(365, Math.max(1, Number(value || 30)));
}

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
