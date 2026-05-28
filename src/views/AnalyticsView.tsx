import type { AppSelectors } from "../types";

export function StatsPanel({ selectors }: { selectors: AppSelectors }) {
  const rows = selectors.activeHabits.map((habit) => selectors.calculateStats(habit));
  const avg = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.completion, 0) / rows.length) : 0;
  const streak = rows.reduce((max, item) => Math.max(max, item.streak), 0);
  const best = rows.reduce((max, item) => Math.max(max, item.bestStreak), 0);
  const attention = selectors.getAttentionHabits().length;
  return (
    <div className="panel">
      <h3>Краткая аналитика</h3>
      <div className="stats">
        <div className="stat"><strong>{avg}%</strong><span>выполнение</span></div>
        <div className="stat"><strong>{streak}</strong><span>текущий streak</span></div>
        <div className="stat"><strong>{best}</strong><span>лучший streak</span></div>
        <div className="stat"><strong>{attention}</strong><span>сигналы</span></div>
      </div>
    </div>
  );
}

export function AnalyticsView({ selectors }: { selectors: AppSelectors }) {
  return (
    <section className="stack">
      <StatsPanel selectors={selectors} />
      <div className="panel">
        <h3>История привычек</h3>
        {selectors.activeHabits.map((habit) => {
          const stats = selectors.calculateStats(habit);
          return (
            <div className="settings-row" key={habit.id}>
              <span><b>{habit.icon} {habit.title}</b><br /><small className="muted">Лучший streak {stats.bestStreak} · пропущено плановых {stats.missedPlanned}</small></span>
              <span className="badge">{stats.completion}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
