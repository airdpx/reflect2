import { Fragment } from "react";
import type React from "react";
import type { AppActions, AppSelectors, AppState, Habit } from "../types";
import { formatDate, todayKey, weekdayShort } from "../lib/date";
import { statusMeta } from "../lib/defaults";
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
  if (!selectors.periodDates.length) return <div className="empty action-empty"><b>В выбранном периоде нет дат</b><span>Проверьте диапазон или верните выходные в настройках сетки.</span></div>;
  return (
    <div>
      <div className="calendar-wrap">
        <div className="calendar-grid" style={{ "--days": selectors.periodDates.length } as React.CSSProperties & Record<"--days", number>}>
          <div className="grid-head">Привычка</div>
          {selectors.periodDates.map((date) => <div className={`grid-head ${date === todayKey() ? "today" : ""}`} key={date}><span>{weekdayShort(date)}</span><b>{formatDate(date, "short")}</b></div>)}
          {selectors.activeHabits.map((habit) => (
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
  if (state.settings.visibleGrid.streak) parts.push(`streak ${stats.streak}`);
  if (state.settings.visibleGrid.completion) parts.push(`${stats.completion}%`);
  if (state.settings.visibleGrid.daysSince) parts.push(`${stats.daysSince ?? "нет"} дн.`);
  return parts.join(" · ");
}

function clampDays(value: string) {
  return Math.min(365, Math.max(1, Number(value || 30)));
}
