import { useEffect, useMemo, useState } from "react";
import type { AppActions, AppSelectors, AppState, HabitStatus } from "../types";
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
        <div className="stat"><strong>{series}</strong><span>серия</span></div>
        <div className="stat"><strong>{best}</strong><span>лучшая серия</span></div>
        <div className="stat"><strong>{attention}</strong><span>сигналы</span></div>
      </div>
    </div>
  );
}

export function AnalyticsView({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const chartDays = Math.max(7, Math.min(180, state.settings.analyticsHistoryDays || 30));
  const start = toKey(addDays(fromKey(todayKey()), -(chartDays - 1)));
  const dates = rangeDates(start, todayKey());
  const visibleStatuses: HabitStatus[] = state.settings.activeStatuses.length ? [...state.settings.activeStatuses] : ["done", "partial", "skipped"];

  useEffect(() => {
    setSelectedHabitIds((current) => {
      const valid = current.filter((habitId) => selectors.activeHabits.some((habit) => habit.id === habitId));
      if (valid.length) return valid;
      return selectors.activeHabits.slice(0, Math.min(4, selectors.activeHabits.length)).map((habit) => habit.id);
    });
  }, [selectors.activeHabits]);

  const selectedHabits = useMemo(
    () => selectors.activeHabits.filter((habit) => selectedHabitIds.includes(habit.id)),
    [selectors.activeHabits, selectedHabitIds]
  );

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
      <div className="panel analytics-wave-panel">
        <div className="section-head">
          <div>
            <h3>График привычек</h3>
            <p className="muted">Выбери несколько привычек, чтобы видеть их на одном волновом графике с иконками статусов на датах.</p>
          </div>
        </div>
        <div className="analytics-habit-picks">
          {selectors.activeHabits.map((habit) => (
            <label key={habit.id} className={`analytics-habit-pick ${selectedHabitIds.includes(habit.id) ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={selectedHabitIds.includes(habit.id)}
                onChange={(event) => {
                  setSelectedHabitIds((current) => (
                    event.target.checked
                      ? Array.from(new Set([...current, habit.id]))
                      : current.filter((item) => item !== habit.id)
                  ));
                }}
              />
              <span style={{ background: habit.color }} />
              <b>{habit.icon} {habit.title}</b>
            </label>
          ))}
        </div>
        <div className="analytics-wave-chart">
          {selectedHabits.length ? (
            <>
              <div className="analytics-wave-axis">
                {dates.map((date) => (
                  <span key={date}>{formatDate(date, "short")}</span>
                ))}
              </div>
              <WaveChart state={state} selectors={selectors} habits={selectedHabits} dates={dates} visibleStatuses={visibleStatuses} />
            </>
          ) : (
            <div className="empty action-empty">
              <b>Выбери хотя бы одну привычку</b>
              <span>График станет наглядным, когда здесь появится хотя бы одна линия.</span>
            </div>
          )}
        </div>
        <div className="diary-history-strip analytics-period-strip">
          {[7, 14, 30, 90, 180].map((days) => (
            <button
              key={days}
              className={state.settings.analyticsHistoryDays === days ? "active" : ""}
              onClick={() => actions.updateSetting("analyticsHistoryDays", days)}
            >
              {days} д
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaveChart({
  state,
  selectors,
  habits,
  dates,
  visibleStatuses
}: {
  state: AppState;
  selectors: AppSelectors;
  habits: AppState["habits"];
  dates: string[];
  visibleStatuses: HabitStatus[];
}) {
  const laneHeight = 54;
  const topPad = 20;
  const bottomPad = 24;
  const width = 1200;
  const height = topPad + bottomPad + Math.max(1, habits.length) * laneHeight;
  const innerWidth = width - 24;
  const lineGrid = dates.length > 1 ? dates.map((_, index) => 12 + (index / (dates.length - 1)) * innerWidth) : [12];
  const statusColor = (status: HabitStatus | undefined, habitColor: string) => {
    if (!status) return `color-mix(in srgb, ${habitColor} 24%, var(--surface-soft))`;
    return `color-mix(in srgb, ${habitColor} 72%, var(--surface))`;
  };

  return (
    <div className="analytics-wave-stage">
      <svg className="analytics-wave-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {lineGrid.map((x) => (
          <line key={x} x1={x} y1={10} x2={x} y2={height - 10} className="analytics-wave-gridline" />
        ))}
        {habits.map((habit, habitIndex) => {
          const laneTop = topPad + habitIndex * laneHeight;
          const laneMid = laneTop + laneHeight / 2;
          const points = dates.map((date, dateIndex) => {
            const log = selectors.getLog(habit.id, date);
            const status = log?.status;
            const score = statusToScore(status);
            const x = dates.length > 1 ? 12 + (dateIndex / (dates.length - 1)) * innerWidth : width / 2;
            const wave = Math.sin((dateIndex / Math.max(1, dates.length - 1)) * Math.PI * 2 + habitIndex * 0.8) * 4;
            const y = laneMid + (2.8 - score) * 7 + wave;
            return { x, y, status };
          });
          const path = smoothPath(points);
          return (
            <g key={habit.id}>
              <line x1="12" y1={laneMid} x2={width - 12} y2={laneMid} className="analytics-wave-baseline" />
              <path d={path} className="analytics-wave-path" style={{ stroke: habit.color }} />
              {points.map((point, pointIndex) => {
                const date = dates[pointIndex];
                const status = point.status;
                const icon = status && visibleStatuses.includes(status) ? state.settings.statusIcons[status] || statusMeta[status].short : "";
                const label = status ? `${habit.title} · ${statusMeta[status].label} · ${formatDate(date, "short")}` : `${habit.title} · ${formatDate(date, "short")}`;
                return (
                  <g key={`${habit.id}-${date}`} transform={`translate(${point.x},${point.y})`}>
                    <circle
                      r="9"
                      fill={statusColor(status, habit.color)}
                      stroke={habit.color}
                      strokeWidth="1.5"
                    />
                    {icon ? (
                      <text className="analytics-wave-icon" textAnchor="middle" dominantBaseline="central" aria-label={label}>
                        {icon}
                      </text>
                    ) : (
                      <circle r="2.6" fill={habit.color} opacity="0.65" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function statusToScore(status?: HabitStatus | null) {
  switch (status) {
    case "done":
      return 4.5;
    case "partial":
      return 3.2;
    case "skipped":
      return 2.2;
    case "missed":
      return 1.4;
    case "planned":
      return 2.8;
    default:
      return 2.6;
  }
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev.x + current.x) / 2;
    const midY = (prev.y + current.y) / 2;
    path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  path += ` T ${last.x} ${last.y}`;
  return path;
}
