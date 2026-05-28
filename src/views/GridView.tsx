import { Fragment } from "react";
import type React from "react";
import type { AppActions, AppSelectors, AppState, Habit } from "../types";
import { formatDate, todayKey, weekdayShort } from "../lib/date";
import { habitTypeLabels, statusMeta } from "../lib/defaults";
import { TemplateChooser } from "./TodayView";

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
            <div className="segmented">
              <button className={state.settings.gridDisplayMode === "calendar" ? "active" : ""} onClick={() => actions.updateSetting("gridDisplayMode", "calendar")}>Календарь</button>
              <button className={state.settings.gridDisplayMode === "compact" ? "active" : ""} onClick={() => actions.updateSetting("gridDisplayMode", "compact")}>Компактно</button>
              <button className={state.settings.gridDisplayMode === "matrix" ? "active" : ""} onClick={() => actions.updateSetting("gridDisplayMode", "matrix")}>Таблица</button>
            </div>
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
      <CalendarGrid state={state} selectors={selectors} actions={actions} />
    </section>
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
  if (state.settings.gridDisplayMode === "calendar") {
    return <CalendarMonthGrid habits={visibleHabits} compact={false} state={state} selectors={selectors} actions={actions} />;
  }
  if (state.settings.gridDisplayMode === "compact") {
    return <CalendarMonthGrid habits={visibleHabits} compact state={state} selectors={selectors} actions={actions} />;
  }
  if (state.settings.gridDisplayMode === "matrix") {
    return <WeekMatrixGrid habits={visibleHabits} state={state} selectors={selectors} actions={actions} />;
  }
  return (
    <div>
      <div className="calendar-wrap">
        <div className="calendar-grid" style={{ "--days": selectors.periodDates.length } as React.CSSProperties & Record<"--days", number>}>
          <div className="grid-head">Привычка</div>
          {selectors.periodDates.map((date) => <div className={`grid-head ${date === todayKey() ? "today" : ""}`} key={date}><span>{weekdayShort(date)}</span><b>{formatDate(date, "short")}</b></div>)}
          {visibleHabits.map((habit) => (
            <Fragment key={habit.id}>
              <div className="grid-name">
                {state.settings.visibleGrid.color && <i className="habit-dot" style={{ height: 20, background: habit.color }} />}
                <div className="grid-habit-text">
                  <strong>{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</strong>
                  <span>{gridHabitMeta(habit, state, selectors)}</span>
                </div>
              </div>
              {selectors.periodDates.map((date) => <GridCell key={`${habit.id}-${date}`} habit={habit} date={date} state={state} selectors={selectors} actions={actions} />)}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="legend">
        {state.settings.activeStatuses.map((status) => <span key={status}><i className={statusMeta[status].className} />{statusMeta[status].label}</span>)}
      </div>
    </div>
  );
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
            <div className="calendar-day-list">
              {habits.filter((habit) => selectors.isDue(habit, date)).map((habit) => (
                <CalendarHabitMark key={`${habit.id}-${date}`} habit={habit} date={date} compact={compact} state={state} selectors={selectors} actions={actions} />
              ))}
            </div>
          </div>
        ) : <div className="calendar-day empty-day" key={`empty-${index}`} />)}
      </div>
      <div className="legend">
        {state.settings.activeStatuses.map((status) => <span key={status}><i className={statusMeta[status].className} />{statusMeta[status].label}</span>)}
      </div>
    </div>
  );
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
      {!compact && <span className="calendar-mark-title">{state.settings.visibleGrid.icon ? habit.icon : ""} {habit.title}</span>}
      {!compact && state.settings.visibleGrid.statusText && <em>{statusMeta[status].short}</em>}
      {!compact && !state.settings.visibleGrid.statusText && status !== "planned" && <em>{statusMeta[status].short}</em>}
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
        {state.settings.activeStatuses.map((status) => <span key={status}><i className={statusMeta[status].className} />{statusMeta[status].label}</span>)}
      </div>
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
        {state.settings.gridTheme === "classic" && status === "done" ? "✓" : ""}
        {state.settings.gridTheme !== "classic" && visibleStatus && status && status !== "planned" ? statusMeta[status].short : ""}
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
