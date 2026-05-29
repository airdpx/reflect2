import type { AppSelectors, AppState, HabitStatus } from "../types";
import { addDays, fromKey, rangeDates, todayKey, toKey, formatDate } from "../lib/date";
import { statusMeta } from "../lib/defaults";

export function StatsPanel({ selectors }: { selectors: AppSelectors }) {
  if (!selectors.hasAnyLogs) {
    return (
      <div className="panel">
        <h3>Краткая аналитика</h3>
        <div className="empty action-empty">
          <b>Аналитика появится после первых отметок</b>
          <span>Пока здесь не будет нулей как оценки. Сделайте несколько спокойных отметок, и статистика станет полезной.</span>
        </div>
      </div>
    );
  }
  const rows = selectors.activeHabits.map((habit) => selectors.calculateStats(habit));
  const avg = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.completion, 0) / rows.length) : 0;
  const series = rows.reduce((max, item) => Math.max(max, item.streak), 0);
  const best = rows.reduce((max, item) => Math.max(max, item.bestStreak), 0);
  const attention = selectors.getAttentionHabits().length;
  return (
    <div className="panel">
      <h3>Краткая аналитика</h3>
      <div className="stats">
        <div className="stat"><strong>{avg}%</strong><span>выполнение</span></div>
        <div className="stat"><strong>{series}</strong><span>текущая серия</span></div>
        <div className="stat"><strong>{best}</strong><span>лучшая серия</span></div>
        <div className="stat"><strong>{attention}</strong><span>сигналы</span></div>
      </div>
    </div>
  );
}

export function AnalyticsView({ state, selectors }: { state: AppState; selectors: AppSelectors }) {
  if (!selectors.hasAnyLogs) {
    return (
      <section className="stack">
        <StatsPanel selectors={selectors} />
      </section>
    );
  }
  return (
    <section className="stack">
      <StatsPanel selectors={selectors} />
      <div className="panel">
        <h3>История привычек</h3>
        {selectors.activeHabits.map((habit) => {
          const stats = selectors.calculateStats(habit);
          return (
            <div className="settings-row" key={habit.id}>
              <span><b>{habit.icon} {habit.title}</b><br /><small className="muted">Лучшая серия {stats.bestStreak} · пропущено плановых {stats.missedPlanned}</small></span>
              <span className="badge">{stats.completion}%</span>
            </div>
          );
        })}
      </div>
      <HabitCharts state={state} selectors={selectors} />
    </section>
  );
}

function HabitCharts({ state, selectors }: { state: AppState; selectors: AppSelectors }) {
  const chartDays = Math.max(14, Math.min(30, state.settings.calendarHistoryDays || 30));
  const start = toKey(addDays(fromKey(todayKey()), -(chartDays - 1)));
  const dates = rangeDates(start, todayKey());
  const visibleStatuses: HabitStatus[] = state.settings.activeStatuses.length ? [...state.settings.activeStatuses] : ["done", "partial", "skipped"];
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>Графики по привычкам</h3>
          <p className="muted">События в календаре показаны теми же иконками статусов: выполнено, частично, пропуск.</p>
        </div>
      </div>
      <div className="analytics-chart-list">
        {selectors.activeHabits.map((habit) => {
          const stats = selectors.calculateStats(habit);
          return (
            <div className="analytics-chart-card" key={habit.id}>
              <div className="analytics-chart-head">
                <strong>{habit.icon} {habit.title}</strong>
                <small>{habit.description || `${stats.completion}% выполнения`}</small>
              </div>
              <div className="analytics-chart-bars" title={habit.title}>
                {dates.map((date) => {
                  const log = selectors.getLog(habit.id, date);
                  const status = log?.status;
                  const visible = status && visibleStatuses.includes(status);
                  const label = status ? `${statusMeta[status].label} · ${formatDate(date, "short")}` : `Нет отметки · ${formatDate(date, "short")}`;
                  return (
                    <span
                      key={date}
                      className={`analytics-chart-bar ${status ? statusMeta[status].className : ""}`}
                      title={label}
                    >
                      {visible && state.settings.statusIcons[status as HabitStatus] ? state.settings.statusIcons[status as HabitStatus] : (status ? statusMeta[status].short : "·")}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
