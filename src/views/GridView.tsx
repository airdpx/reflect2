import { Fragment, useEffect, useState } from "react";
import type React from "react";
import type { AppActions, AppSelectors, AppState, Density, GridDisplayMode, Habit, HabitStatus } from "../types";
import { addDays, formatDate, fromKey, rangeDates, todayKey, weekdayShort } from "../lib/date";
import { habitTypeLabels, statusIconPresets, statusMeta } from "../lib/defaults";
import { forecastTone, getForecast } from "../lib/forecast";
import { TemplateChooser } from "./TodayView";
import { SelectControl, Toggle } from "../components/Common";

const gridAppearancePresets = [
  { value: "soft-circle", label: "Мягкий круг", theme: "soft", shape: "circle" },
  { value: "soft-square", label: "Мягкий квадрат", theme: "soft", shape: "square" },
  { value: "classic-square", label: "Классика", theme: "classic", shape: "square" },
  { value: "journal-ring", label: "Дневник", theme: "journal", shape: "ring" },
  { value: "journal-star", label: "Дневник со звездой", theme: "journal", shape: "star" },
  { value: "minimal-hex", label: "Минимум", theme: "minimal", shape: "hex" },
  { value: "minimal-pill", label: "Минимум-пилюля", theme: "minimal", shape: "pill" },
  { value: "soft-frame", label: "Мягкая рамка", theme: "soft", shape: "frame" }
] as const;

const gridLabels: Record<string, string> = {
  color: "Цвет привычки",
  icon: "Иконка привычки",
  statusText: "Иконка статуса",
  completion: "Процент",
  daysSince: "Дней с выполнения"
};

const gridModes: Array<[GridDisplayMode, string]> = [
  ["calendar", "Календарь"],
  ["compact", "Мини"],
  ["matrix", "Таблица"],
  ["week", "Неделя"],
  ["habit", "Привычка"],
  ["timeline", "Лента"],
  ["heat", "Тепло"]
];

export function GridView({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const p = state.settings.defaultPeriod;
  const viewportWidth = useViewportWidth();
  const historyDays = Math.max(0, state.settings.calendarHistoryDays);
  const periodDays = Math.max(1, selectors.periodDates.length);
  const historyStart = toKey(addDays(fromKey(todayKey()), -historyDays));
  const periodEnd = toKey(addDays(fromKey(todayKey()), periodDays - 1));
  const gridDates = rangeDates(historyStart, periodEnd);
  return (
    <section className="stack">
      <div className="panel period-panel">
        <div className="section-head">
          <div>
            <h3>Период сетки</h3>
            <p className="muted">{selectors.periodLabel()} · {selectors.periodDates.length} дней</p>
          </div>
        </div>
        <div className="period-layout compact-period-layout">
          <div className="chips">
            {[7, 14, 30, 90].map((days) => (
              <button className={`chip ${p.mode === "last" && p.days === days ? "active" : ""}`} key={days} onClick={() => actions.setPeriod({ mode: "last", days })}>
                {days} дней
              </button>
            ))}
            <button className={`chip ${p.mode === "week" ? "active" : ""}`} onClick={() => actions.setPeriod({ mode: "week" })}>Неделя</button>
            <button className={`chip ${p.mode === "month" ? "active" : ""}`} onClick={() => actions.setPeriod({ mode: "month" })}>Месяц</button>
          </div>
          <div className="period-custom compact-period-field">
            <label>N дней</label>
            <input className="input" type="number" min="1" max="365" value={p.days} onChange={(event) => actions.setPeriod({ mode: "last", days: clampDays(event.target.value) })} />
          </div>
          <details className="period-range-details">
            <summary>Диапазон</summary>
            <div className="period-range">
              <input className="input" type="date" value={p.start} onChange={(event) => actions.setPeriod({ mode: "custom", start: event.target.value })} />
              <input className="input" type="date" value={p.end} onChange={(event) => actions.setPeriod({ mode: "custom", end: event.target.value })} />
            </div>
          </details>
        </div>
      </div>
      <CalendarSettingsPanel state={state} selectors={selectors} actions={actions} />
      <CalendarGrid state={state} selectors={selectors} actions={actions} dates={gridDates} viewportWidth={viewportWidth} />
    </section>
  );
}

function CalendarSettingsPanel({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const appearanceValue = gridAppearancePresets.find((preset) => preset.theme === state.settings.gridTheme && preset.shape === state.settings.gridMarkerShape)?.value || gridAppearancePresets[0].value;
  return (
    <details className="panel module-panel calendar-settings-panel">
      <summary>Настроить календарь и таблицу</summary>
      <div className="module-controls">
        <div className="calendar-settings-grid">
          <SelectControl
            label="Оформление таблицы"
            value={appearanceValue}
            options={gridAppearancePresets.map(({ value, label }) => ({ value, label }))}
            onChange={(value) => {
              const preset = gridAppearancePresets.find((item) => item.value === value);
              if (!preset) return;
              actions.updateSetting("gridTheme", preset.theme as AppState["settings"]["gridTheme"]);
              actions.updateSetting("gridMarkerShape", preset.shape as AppState["settings"]["gridMarkerShape"]);
            }}
          />
          <SelectControl label="Цвета таблицы" value={state.settings.gridColors.mode} options={[{ value: "theme", label: "По теме" }, { value: "custom", label: "Свои цвета" }]} onChange={(value) => actions.updateSetting("gridColors", { ...state.settings.gridColors, mode: value as "theme" | "custom" })} />
          <SelectControl label="Плотность сетки" value={state.settings.gridDensity} options={["compact", "standard", "comfortable"]} onChange={(value) => actions.updateSetting("gridDensity", value as Density)} />
          <SelectControl label="Клик по ячейке" value={state.settings.gridClickAction} options={["cycle", "details"]} onChange={(value) => actions.updateSetting("gridClickAction", value as "cycle" | "details")} />
        </div>
        {state.settings.gridColors.mode === "custom" && (
          <div className="mini-color-grid calendar-color-grid">
            {[
              ["bg", "Фон"],
              ["head", "Шапка"],
              ["cell", "Ячейки"],
              ["today", "Сегодня"],
              ["line", "Линии"]
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
          <summary>Фильтр и видимость</summary>
          <div className="module-controls">
            <SelectControl label="Категория" value={state.settings.selectedCategory} options={["all", ...selectors.categories]} onChange={(value) => actions.updateSetting("selectedCategory", value)} />
            <Toggle label="Показывать выходные" checked={state.settings.showWeekends} className="compact-check-row" onChange={(checked) => actions.updateSetting("showWeekends", checked)} />
          </div>
        </details>
        <div className="calendar-mode-row">
          {gridModes.map(([mode, label]) => (
            <button
              key={mode}
              className={state.settings.gridDisplayMode === mode ? "active" : ""}
              title={label}
              onClick={() => actions.updateSetting("gridDisplayMode", mode)}
            >
              <b>{modeIcon(mode)}</b>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="status-preview-strip">
          {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
            <button
              key={status}
              className={`${statusMeta[status].className} ${state.settings.activeStatuses.includes(status) || status === "planned" ? "active" : ""}`}
              onClick={() => status !== "planned" && actions.toggleStatus(status, !state.settings.activeStatuses.includes(status))}
              title={status === "planned" ? "План показывается в календаре как пустая ожидающая отметка" : "Включить или выключить статус"}
            >
              <b>{state.settings.statusIcons[status] || statusMeta[status].short}</b>
              <span>{statusMeta[status].label}</span>
            </button>
          ))}
        </div>
        <details className="quick-subsection">
          <summary>Видимые элементы</summary>
          <div className="module-toggle-grid">
            {Object.entries(gridLabels).map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.visibleGrid[key]} onChange={(event) => actions.updateVisible("visibleGrid", key, event.target.checked)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </details>
        <details className="quick-subsection">
          <summary>Иконки отметок</summary>
          <div className="status-icon-grid">
            {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
              <label key={status}>
                <span>{statusMeta[status].label}</span>
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
  viewportWidth
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
  dates: string[];
  viewportWidth: number;
}) {
  const visibleHabits = selectors.activeHabits.filter((habit) => state.settings.selectedCategory === "all" || habit.category === state.settings.selectedCategory);
  if (!selectors.activeHabits.length) {
    return (
      <div className="stack">
        <div className="empty action-empty">
          <div>
            <b>Сетка появится после первой привычки</b>
            <span>Создайте привычку с нуля или начните с готового шаблона.</span>
          </div>
          <button className="btn primary" onClick={() => actions.openHabitModal("new")}>Создать привычку</button>
        </div>
        <TemplateChooser actions={actions} />
      </div>
    );
  }
  if (!visibleHabits.length) return <div className="empty action-empty"><b>В этой категории пока нет привычек</b><span>Выберите другую категорию или добавьте привычку в текущую.</span></div>;
  if (!dates.length) return <div className="empty action-empty"><b>В выбранном периоде нет дат</b><span>Проверьте диапазон или верните выходные в настройках сетки.</span></div>;
  const renderers: Record<GridDisplayMode, React.ReactNode> = {
    calendar: <CalendarMonthGrid habits={visibleHabits} dates={dates} compact={false} state={state} selectors={selectors} actions={actions} />,
    compact: <CalendarMonthGrid habits={visibleHabits} dates={dates} compact state={state} selectors={selectors} actions={actions} />,
    matrix: <WeekMatrixGrid habits={visibleHabits} dates={dates} viewportWidth={viewportWidth} state={state} selectors={selectors} actions={actions} />,
    week: <WeekFocusGrid habits={visibleHabits} dates={dates} state={state} selectors={selectors} actions={actions} />,
    habit: <HabitTimelineGrid habits={visibleHabits} dates={dates} state={state} selectors={selectors} actions={actions} />,
    timeline: <TimelineGrid habits={visibleHabits} dates={dates} state={state} selectors={selectors} actions={actions} />,
    heat: <HeatGrid habits={visibleHabits} dates={dates} state={state} selectors={selectors} actions={actions} />
  };
  return <div className={`grid-mode density-grid-${state.settings.gridDensity}`}>{renderers[state.settings.gridDisplayMode] || renderers.calendar}</div>;
}

function CalendarMonthGrid({
  habits,
  dates,
  compact,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  dates: string[];
  compact: boolean;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const weeks = chunkWeeks(dates);
  return (
    <div>
      <div className={`month-calendar ${compact ? "compact-calendar" : ""}`}>
        <div className="month-week-head">Пн</div>
        <div className="month-week-head">Вт</div>
        <div className="month-week-head">Ср</div>
        <div className="month-week-head">Чт</div>
        <div className="month-week-head">Пт</div>
        <div className="month-week-head">Сб</div>
        <div className="month-week-head">Вс</div>
        {weeks.flat().map((date, index) => date ? (
          <div className={`calendar-day ${date === todayKey() ? "today" : ""}`} key={date}>
            <div className="calendar-day-head">
              <b>{formatDate(date, "short")}</b>
              <span>{weekdayShort(date)}</span>
            </div>
            <ForecastDayMarker date={date} state={state} />
            <div className="calendar-day-list">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <CalendarHabitMark key={`${habit.id}-${date}`} habit={habit} date={date} compact={compact} state={state} selectors={selectors} actions={actions} />
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
  const forecast = getForecast(date, state.settings.forecast, state.profile?.birthDate || "");
  if (!forecast) return null;
  return <i className={`forecast-day-marker forecast-marker-${forecastTone(forecast.summaryScore)}`} title={`Прогноз дня: ${forecast.summaryScore}%`} />;
}

function CalendarHabitMark({
  habit,
  date,
  compact,
  state,
  selectors,
  actions
}: {
  habit: Habit;
  date: string;
  compact: boolean;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const log = selectors.getLog(habit.id, date);
  const status = log?.status || "planned";
  const className = statusMeta[status].className;
  const title = `${habit.title} · ${formatDate(date)} · ${state.settings.gridClickAction === "cycle" ? "клик меняет статус" : "детали отметки"}`;
  const markStyle = {
    background: `color-mix(in srgb, ${habit.color} 22%, var(--grid-cell-empty))`,
    borderColor: `color-mix(in srgb, ${habit.color} 42%, var(--grid-line))`
  } as React.CSSProperties;
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
          {state.settings.visibleGrid.color && <i style={{ background: habit.color }} />}
          {state.settings.visibleGrid.icon && <b>{habit.icon}</b>}
          {state.settings.visibleGrid.statusText && status !== "planned" && <em>{statusIcon(status, state)}</em>}
          {state.settings.visibleGrid.noteMarker && log?.note && <small className="marker-note-inline" />}
        </span>
      ) : (
        <>
          {state.settings.visibleGrid.color && <i style={{ background: habit.color }} />}
          <span className="calendar-mark-title">{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</span>
          {state.settings.visibleGrid.statusText && status !== "planned" && <em>{statusIcon(status, state)}</em>}
          {!state.settings.visibleGrid.statusText && status !== "planned" && <em>{statusIcon(status, state)}</em>}
          {state.settings.visibleGrid.noteMarker && log?.note && <small className="marker-note-inline" />}
          {state.settings.visibleGrid.type && <small>{habitTypeLabels[habit.type]}</small>}
          {state.settings.visibleGrid.target && habit.target > 1 && <small>{habit.target}</small>}
        </>
      )}
    </button>
  );
}

function WeekMatrixGrid({
  habits,
  dates,
  viewportWidth,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  dates: string[];
  viewportWidth: number;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const chunkSize = getMatrixChunkSize(viewportWidth);
  const weeks = chunkByCount(dates, chunkSize);
  return (
    <div>
      <div className="week-matrix-stack">
        {weeks.map((week, index) => (
          <div className="week-matrix" key={index}>
            <div className="week-matrix-grid" style={{ "--days": week.length } as React.CSSProperties & Record<"--days", number>}>
              <div className="grid-head">Привычка</div>
              {week.map((date) => <div className={`grid-head ${date === todayKey() ? "today" : ""}`} key={date}><span>{weekdayShort(date)}</span><b>{formatDate(date, "short")}</b></div>)}
              {habits.map((habit) => (
                <Fragment key={`${habit.id}-${index}`}>
                  <div className="grid-name matrix-name">
                    {state.settings.visibleGrid.color && <i className="habit-dot" style={{ height: 18, background: habit.color }} />}
                    <div className="grid-habit-text">
                      <strong>{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</strong>
                      <span>{gridHabitMeta(habit, state, selectors)}</span>
                    </div>
                  </div>
                  {week.map((date) => <GridCell key={`${habit.id}-${date}`} habit={habit} date={date} state={state} selectors={selectors} actions={actions} />)}
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
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const focusDates = dates.slice(-Math.min(14, dates.length)).slice(-7);
  return (
    <div>
      <div className="week-focus-grid">
        {focusDates.map((date) => (
          <div className={`week-focus-day ${date === todayKey() ? "today" : ""}`} key={date}>
            <div className="calendar-day-head">
              <b>{formatDate(date, "short")}</b>
              <span>{weekdayShort(date)}</span>
            </div>
            <div className="week-focus-list">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <button
                  className={`week-check ${statusClass(selectors.getLog(habit.id, date)?.status || "planned")}`}
                  key={habit.id}
                  title={`${habit.title} · ${formatDate(date)}`}
                  style={{ background: `color-mix(in srgb, ${habit.color} 18%, var(--grid-bg))`, borderColor: `color-mix(in srgb, ${habit.color} 36%, var(--grid-line))` } as React.CSSProperties}
                  onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                  onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
                >
                  <i style={{ background: habit.color }} />
                  <span>{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</span>
                  <b>{statusIcon(selectors.getLog(habit.id, date)?.status || "planned", state)}</b>
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
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const habit = habits.find((item) => item.id === state.settings.selectedHabitId) || habits[0];
  return (
    <div className="habit-timeline">
      <div className="section-head compact-head">
        <div>
          <h3>{habit.icon} {habit.title}</h3>
          <p className="muted">{gridHabitMeta(habit, state, selectors) || habit.category || "История выбранной привычки"}</p>
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
                className={`habit-day-chip ${statusClass(selectors.getLog(habit.id, date)?.status || (selectors.isDue(habit, date) ? "planned" : undefined))}`}
                key={date}
                title={`${habit.title} · ${formatDate(date)}`}
                style={{ background: `color-mix(in srgb, ${habit.color} 20%, var(--surface-soft))`, borderColor: `color-mix(in srgb, ${habit.color} 38%, var(--line))` } as React.CSSProperties}
                onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
              >
                <span>{formatDate(date, "short")}</span>
                <b>{statusIcon(selectors.getLog(habit.id, date)?.status || "planned", state)}</b>
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
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  return (
    <div>
      <div className="timeline-grid">
        {dates.map((date) => (
          <div className={`timeline-day ${date === todayKey() ? "today" : ""}`} key={date}>
            <div className="timeline-date">
              <b>{formatDate(date, "short")}</b>
              <span>{weekdayShort(date)}</span>
            </div>
            <div className="timeline-dots">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <button
                  className={`timeline-dot ${statusClass(selectors.getLog(habit.id, date)?.status || "planned")}`}
                  key={habit.id}
                  title={`${habit.title} · ${formatDate(date)}`}
                  style={{ "--habit-color": habit.color, background: `color-mix(in srgb, ${habit.color} 68%, var(--surface))`, borderColor: `color-mix(in srgb, ${habit.color} 50%, var(--line))` } as React.CSSProperties & Record<"--habit-color", string>}
                  onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                  onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
                />
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
  dates,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  dates: string[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
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
                <b>{formatDate(date, "short")}</b>
                <span>{done}/{dueHabits.length}</span>
              </div>
              <div className="heat-actions">
                {dueHabits.map((habit) => (
                <button
                  className={`heat-dot ${statusClass(selectors.getLog(habit.id, date)?.status || "planned")}`}
                  key={habit.id}
                  title={`${habit.title} · ${formatDate(date)}`}
                  style={{ "--habit-color": habit.color, background: `color-mix(in srgb, ${habit.color} 48%, var(--surface))`, borderColor: `color-mix(in srgb, ${habit.color} 42%, var(--line))` } as React.CSSProperties & Record<"--habit-color", string>}
                  onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
                  onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
                />
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
  date,
  state,
  selectors,
  actions
}: {
  habit: Habit;
  date: string;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const log = selectors.getLog(habit.id, date);
  const status = log?.status || (selectors.isDue(habit, date) ? "planned" : undefined);
  const visibleStatus = status && (state.settings.activeStatuses.includes(status) || status === "planned");
  const className = visibleStatus && status ? statusMeta[status].className : "";
  const themeClass = ["soft", "classic", "journal", "minimal"].includes(state.settings.gridTheme) ? state.settings.gridTheme : "";
  const markStyle = {
    background: `color-mix(in srgb, ${habit.color} 26%, var(--grid-cell-empty))`,
    borderColor: `color-mix(in srgb, ${habit.color} 42%, var(--grid-line))`
  } as React.CSSProperties;
  return (
    <div className={`grid-cell ${date === todayKey() ? "today" : ""} ${themeClass}`}>
      <button
        className={`${className} shape-${state.settings.gridMarkerShape}`}
        style={markStyle}
        title={`${habit.title} · ${formatDate(date)} · ${state.settings.gridClickAction === "cycle" ? "быстрая смена статуса" : "детали"}`}
        onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
      >
        <span className="mark-core">
          {state.settings.gridTheme === "classic" && status === "done" ? statusIcon(status, state) : ""}
          {state.settings.gridTheme !== "classic" && visibleStatus && status && status !== "planned" ? statusIcon(status, state) : ""}
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
  if (state.settings.visibleGrid.type) parts.push(habitTypeLabels[habit.type]);
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
  const visibleStatuses = Array.from(new Set([...statuses, "planned" as HabitStatus]));
  return (
    <div className="legend">
      {visibleStatuses.map((status) => <span key={status}>{state ? `${statusIcon(status, state)} ` : ""}{statusMeta[status].label}</span>)}
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
  const available = Math.max(0, width - 620);
  const estimatedCells = Math.floor(available / 46);
  const rounded = Math.max(7, Math.floor(estimatedCells / 7) * 7);
  if (width < 1180) return 14;
  if (width < 1500) return Math.max(14, Math.min(21, rounded));
  if (width < 1860) return Math.max(21, Math.min(28, rounded));
  return Math.max(28, Math.min(35, rounded));
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
