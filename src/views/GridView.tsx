import { Fragment } from "react";
import type React from "react";
import type { AppActions, AppSelectors, AppState, Density, GridDisplayMode, GridTheme, Habit, HabitStatus, UserSettings } from "../types";
import { formatDate, todayKey, weekdayShort } from "../lib/date";
import { habitTypeLabels, statusIconPresets, statusMeta } from "../lib/defaults";
import { forecastTone, getForecast } from "../lib/forecast";
import { TemplateChooser } from "./TodayView";
import { SelectControl, Toggle } from "../components/Common";

const gridLabels: Record<string, string> = {
  color: "Цвет привычки",
  icon: "Иконка привычки",
  category: "Категория",
  type: "Тип",
  target: "Цель",
  statusText: "Иконка статуса",
  categoryGroups: "Группы категорий",
  streak: "Streak",
  completion: "Процент",
  daysSince: "Дней с выполнения",
  noteMarker: "Маркер заметки",
  moodMarker: "Маркер настроения"
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

const gridColorLabels: Record<keyof Omit<UserSettings["gridColors"], "mode">, string> = {
  bg: "Фон",
  head: "Шапка",
  cell: "Ячейка",
  today: "Сегодня",
  line: "Линии"
};

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
  return (
    <section className="stack">
      <div className="panel period-panel">
        <div className="section-head">
          <div>
            <h3>Период сетки</h3>
            <p className="muted">{selectors.periodLabel()} · {selectors.periodDates.length} дней</p>
          </div>
          <div className="section-actions">
            <select className="select compact-select" value={state.settings.selectedCategory} onChange={(event) => actions.updateSetting("selectedCategory", event.target.value)}>
              <option value="all">Все категории</option>
              {selectors.categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="period-layout">
          <div className="chips">
            {[7, 14, 30, 90].map((days) => (
              <button className={`chip ${p.mode === "last" && p.days === days ? "active" : ""}`} key={days} onClick={() => actions.setPeriod({ mode: "last", days })}>
                {days} дней
              </button>
            ))}
            <button className={`chip ${p.mode === "week" ? "active" : ""}`} onClick={() => actions.setPeriod({ mode: "week" })}>Неделя</button>
            <button className={`chip ${p.mode === "month" ? "active" : ""}`} onClick={() => actions.setPeriod({ mode: "month" })}>Месяц</button>
          </div>
          <div className="period-custom">
            <label>Последние дни</label>
            <input className="input" type="number" min="1" max="365" value={p.days} onChange={(event) => actions.setPeriod({ mode: "last", days: clampDays(event.target.value) })} />
          </div>
          <div className="period-range">
            <label>Диапазон</label>
            <input className="input" type="date" value={p.start} onChange={(event) => actions.setPeriod({ mode: "custom", start: event.target.value })} />
            <input className="input" type="date" value={p.end} onChange={(event) => actions.setPeriod({ mode: "custom", end: event.target.value })} />
          </div>
        </div>
      </div>
      <CalendarSettingsPanel state={state} actions={actions} />
      <CalendarGrid state={state} selectors={selectors} actions={actions} />
    </section>
  );
}

function CalendarSettingsPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  return (
    <details className="panel module-panel calendar-settings-panel">
      <summary>Настроить календарь и таблицу</summary>
      <div className="module-controls">
        <div className="calendar-settings-grid">
          <SelectControl label="Тема сетки" value={state.settings.gridTheme} options={["soft", "classic", "journal", "minimal"]} onChange={(value) => actions.updateSetting("gridTheme", value as GridTheme)} />
          <SelectControl label="Вид отображения" value={state.settings.gridDisplayMode} options={gridModes.map(([mode]) => mode)} onChange={(value) => actions.updateSetting("gridDisplayMode", value as GridDisplayMode)} />
          <SelectControl label="Плотность сетки" value={state.settings.gridDensity} options={["compact", "standard", "comfortable"]} onChange={(value) => actions.updateSetting("gridDensity", value as Density)} />
          <SelectControl label="Клик по ячейке" value={state.settings.gridClickAction} options={["cycle", "details"]} onChange={(value) => actions.updateSetting("gridClickAction", value as "cycle" | "details")} />
          <SelectControl label="Дней на мобильном" value={String(state.settings.mobileGridDays)} options={["7", "14", "30"]} onChange={(value) => actions.updateSetting("mobileGridDays", Number(value) as 7 | 14 | 30)} />
        </div>
        <Toggle label="Показывать выходные" checked={state.settings.showWeekends} onChange={(checked) => actions.updateSetting("showWeekends", checked)} />
        <div className="theme-preview-grid grid-theme-previews">
          {[
            ["soft", "Soft"],
            ["classic", "Check"],
            ["journal", "Mood"],
            ["minimal", "Mono"]
          ].map(([theme, title]) => (
            <button
              key={theme}
              className={`grid-theme-preview ${state.settings.gridTheme === theme ? "active" : ""}`}
              onClick={() => actions.updateSetting("gridTheme", theme as GridTheme)}
            >
              <b>{title}</b>
              <span><i /><i /><i /><i /><i /></span>
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
        <details className="quick-subsection">
          <summary>Цвета таблицы</summary>
          <div className="icon-choice-row">
            <button className={state.settings.gridColors.mode === "theme" ? "active" : ""} onClick={() => actions.updateSetting("gridColors", { ...state.settings.gridColors, mode: "theme" })}>из темы</button>
            <button className={state.settings.gridColors.mode === "custom" ? "active" : ""} onClick={() => actions.updateSetting("gridColors", { ...state.settings.gridColors, mode: "custom" })}>свои цвета</button>
          </div>
          {state.settings.gridColors.mode === "custom" && (
            <div className="mini-color-grid grid-color-grid">
              {(Object.keys(gridColorLabels) as Array<keyof Omit<UserSettings["gridColors"], "mode">>).map((key) => (
                <label key={key}>
                  <span>{gridColorLabels[key]}</span>
                  <input type="color" value={state.settings.gridColors[key]} onChange={(event) => actions.updateSetting("gridColors", { ...state.settings.gridColors, [key]: event.target.value })} />
                </label>
              ))}
            </div>
          )}
        </details>
      </div>
    </details>
  );
}

function CalendarGrid({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
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
  if (!selectors.periodDates.length) return <div className="empty action-empty"><b>В выбранном периоде нет дат</b><span>Проверьте диапазон или верните выходные в настройках сетки.</span></div>;
  const renderers: Record<GridDisplayMode, React.ReactNode> = {
    calendar: <CalendarMonthGrid habits={visibleHabits} compact={false} state={state} selectors={selectors} actions={actions} />,
    compact: <CalendarMonthGrid habits={visibleHabits} compact state={state} selectors={selectors} actions={actions} />,
    matrix: <WeekMatrixGrid habits={visibleHabits} state={state} selectors={selectors} actions={actions} />,
    week: <WeekFocusGrid habits={visibleHabits} state={state} selectors={selectors} actions={actions} />,
    habit: <HabitTimelineGrid habits={visibleHabits} state={state} selectors={selectors} actions={actions} />,
    timeline: <TimelineGrid habits={visibleHabits} state={state} selectors={selectors} actions={actions} />,
    heat: <HeatGrid habits={visibleHabits} state={state} selectors={selectors} actions={actions} />
  };
  return <div className={`grid-mode density-grid-${state.settings.gridDensity}`}>{renderers[state.settings.gridDisplayMode] || renderers.calendar}</div>;
}

function CalendarMonthGrid({
  habits,
  compact,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  compact: boolean;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const weeks = chunkWeeks(selectors.periodDates);
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
      <div className="legend">
        {state.settings.activeStatuses.map((status) => <span key={status}><i className={statusMeta[status].className} />{state.settings.statusIcons[status] || statusMeta[status].short} {statusMeta[status].label}</span>)}
      </div>
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
  return (
    <button
      className={`calendar-mark ${compact ? "compact-mark" : ""} ${className}`}
      title={title}
      onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
      onDoubleClick={() => actions.openCellSheet({ habitId: habit.id, date })}
    >
      {state.settings.visibleGrid.color && <i style={{ background: habit.color }} />}
      {compact && status !== "planned" && <em>{statusIcon(status, state)}</em>}
      {!compact && <span className="calendar-mark-title">{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</span>}
      {!compact && state.settings.visibleGrid.statusText && <em>{statusIcon(status, state)}</em>}
      {!compact && !state.settings.visibleGrid.statusText && status !== "planned" && <em>{statusIcon(status, state)}</em>}
      {state.settings.visibleGrid.noteMarker && log?.note && <small className="marker-note-inline" />}
      {!compact && state.settings.visibleGrid.type && <small>{habitTypeLabels[habit.type]}</small>}
      {!compact && state.settings.visibleGrid.target && habit.target > 1 && <small>{habit.target}</small>}
    </button>
  );
}

function WeekMatrixGrid({
  habits,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const weeks = chunkBySeven(selectors.periodDates);
  return (
    <div>
      <div className="week-matrix-stack">
        {weeks.map((week, index) => (
          <div className="week-matrix" key={index}>
            <div className="week-matrix-title">Дни {index * 7 + 1}-{index * 7 + week.length}</div>
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
      <div className="legend">
        {state.settings.activeStatuses.map((status) => <span key={status}><i className={statusMeta[status].className} />{state.settings.statusIcons[status] || statusMeta[status].short} {statusMeta[status].label}</span>)}
      </div>
    </div>
  );
}

function WeekFocusGrid({
  habits,
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const dates = selectors.periodDates.slice(-7);
  return (
    <div>
      <div className="week-focus-grid">
        {dates.map((date) => (
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
  state,
  selectors,
  actions
}: {
  habits: Habit[];
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
        {chunkBySeven(selectors.periodDates).map((group, index) => (
          <div className="habit-strip-row" key={index}>
            {group.map((date) => (
              <button
                className={`habit-day-chip ${statusClass(selectors.getLog(habit.id, date)?.status || (selectors.isDue(habit, date) ? "planned" : undefined))}`}
                key={date}
                title={`${habit.title} · ${formatDate(date)}`}
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
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  return (
    <div>
      <div className="timeline-grid">
        {selectors.periodDates.map((date) => (
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
                  style={{ "--habit-color": habit.color } as React.CSSProperties & Record<"--habit-color", string>}
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
  state,
  selectors,
  actions
}: {
  habits: Habit[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  return (
    <div>
      <div className="heat-grid">
        {selectors.periodDates.map((date) => {
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
  const themeClass = ["classic", "journal", "minimal"].includes(state.settings.gridTheme) ? state.settings.gridTheme : "";
  return (
    <div className={`grid-cell ${date === todayKey() ? "today" : ""} ${themeClass}`}>
      <button
        className={className}
        title={`${habit.title} · ${formatDate(date)} · ${state.settings.gridClickAction === "cycle" ? "быстрая смена статуса" : "детали"}`}
        onClick={() => state.settings.gridClickAction === "cycle" ? actions.cycleHabitStatus(habit.id, date) : actions.openCellSheet({ habitId: habit.id, date })}
      >
        {state.settings.gridTheme === "classic" && status === "done" ? statusIcon(status, state) : ""}
        {state.settings.gridTheme !== "classic" && visibleStatus && status && status !== "planned" ? statusIcon(status, state) : ""}
        {state.settings.visibleGrid.noteMarker && log?.note && <i className="marker-note" />}
        {state.settings.visibleGrid.moodMarker && (log?.mood || state.notes[date]?.mood) && <i className="marker-mood" />}
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
  if (state.settings.visibleGrid.streak) parts.push(`streak ${stats.streak}`);
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

function Legend({ statuses, state }: { statuses: HabitStatus[]; state?: AppState }) {
  return (
    <div className="legend">
      {statuses.map((status) => <span key={status}><i className={statusMeta[status].className} />{state ? `${statusIcon(status, state)} ` : ""}{statusMeta[status].label}</span>)}
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

function chunkBySeven(dates: string[]) {
  const groups: string[][] = [];
  for (let index = 0; index < dates.length; index += 7) groups.push(dates.slice(index, index + 7));
  return groups;
}

function clampDays(value: string) {
  return Math.min(365, Math.max(1, Number(value || 30)));
}
