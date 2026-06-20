import { useEffect, useMemo, useState } from "react";
import type { AppActions, AppSelectors, AppState, HabitStatus } from "../types";
import { addDays, fromKey, rangeDates, todayKey, toKey, formatDate } from "../lib/date";
import { calculateAverageHabitsPerDay, getAttentionHabits, logKey } from "../lib/analytics";
import { statusMeta } from "../lib/defaults";
import { normalizeLanguage } from "../lib/i18n";

type StatsPanelMode = "compact" | "full";

export function StatsPanel({
  selectors,
  state,
  mode = "full",
  title,
  habitsOverride,
  datesOverride
}: {
  selectors: AppSelectors;
  state: AppState;
  mode?: StatsPanelMode;
  title?: string;
  habitsOverride?: AppState["habits"];
  datesOverride?: string[];
}) {
  const language = normalizeLanguage(state.settings.language);
  const habits = habitsOverride || selectors.activeHabits;
  const dates = datesOverride || selectors.periodDates;
  const text = language === "en" ? {
    title: "Digital Analytics",
    emptyTitle: "Analytics will appear after your first check-ins",
    emptyText: "No zeros as a judgment here. Make a few gentle check-ins, and the statistics will become useful.",
    summaryTitle: "What this means",
    summaryFallback: "Add a few check-ins and the summary will explain your rhythm in plain language.",
    completion: "Average rhythm",
    completionHint: "Average completion across active habits for the selected period.",
    current: "Current streak",
    currentHint: "The longest ongoing streak among active habits right now.",
    best: "Best streak",
    bestHint: "The strongest streak recorded in the selected history window.",
    signals: "Attention flags",
    signalsHint: "Habits that crossed their soft attention threshold.",
    habitsPerDay: "Habits per day",
    habitsPerDayHint: "Average successful check-ins per day across the last 30 days.",
    currentEmpty: "—",
    chartTitle: "Habit Trend Map",
    chartHint: "Select several habits to see them on one wave chart with status icons by date.",
    chooseHabitTitle: "Choose at least one habit",
    chooseHabitText: "The chart becomes clearer when at least one line is visible."
  } : {
    title: "Цифровая аналитика",
    emptyTitle: "Аналитика появится после первых отметок",
    emptyText: "Пока здесь не будет нулей как оценки. Сделайте несколько спокойных отметок, и статистика станет полезной.",
    summaryTitle: "Что это значит",
    summaryFallback: "Сделайте несколько отметок, и блок начнёт объяснять ритм дня простым языком.",
    completion: "Средний ритм",
    completionHint: "Средний процент выполнения активных привычек за выбранный период.",
    current: "Текущая серия",
    currentHint: "Самая длинная текущая серия среди активных привычек.",
    best: "Лучший рекорд",
    bestHint: "Лучшая серия, собранная в выбранном окне истории.",
    signals: "Сигналы внимания",
    signalsHint: "Привычки, которые вышли за мягкий порог внимания.",
    habitsPerDay: "Привычек в день",
    habitsPerDayHint: "Среднее число успешных отметок за день за последние 30 дней.",
    currentEmpty: "—",
    chartTitle: "Карта ритмов",
    chartHint: "Выбери несколько привычек, чтобы видеть их на одном волновом графике с иконками статусов на датах.",
    chooseHabitTitle: "Выбери хотя бы одну привычку",
    chooseHabitText: "График станет наглядным, когда здесь появится хотя бы одна линия."
  };

  const hasAnyLogs = habits.some((habit) => dates.some((date) => Boolean(state.logs[logKey(habit.id, date)])));

  if (!hasAnyLogs) {
    return (
      <div className="panel analytics-summary-panel analytics-summary-panel-prominent">
        <h3>{title || text.title}</h3>
        <div className="analytics-summary-banner analytics-summary-banner-empty">
          <strong>{text.emptyTitle}</strong>
          <span>{text.emptyText}</span>
        </div>
        <div className="analytics-summary-grid">
          {[
            [text.completion, text.completionHint],
            [text.current, text.currentHint],
            [text.best, text.bestHint],
            [text.signals, text.signalsHint],
            [text.habitsPerDay, text.habitsPerDayHint]
          ].map(([label, hint], index) => (
            <div
              className={`analytics-summary-card analytics-summary-card-empty analytics-summary-card-${["done", "accent", "warm", "warn", "accent"][index]}`}
              key={label}
            >
              <b>{text.currentEmpty}</b>
              <span>{label}</span>
              <small>{hint}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const rows = habits.map((habit) => selectors.calculateStats(habit, dates));
  const avg = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.completion, 0) / rows.length) : 0;
  const series = rows.reduce((max, item) => Math.max(max, item.streak), 0);
  const best = rows.reduce((max, item) => Math.max(max, item.bestStreak), 0);
  const attention = getAttentionHabits(habits, dates, state.logs).length;
  const averageHabitsPerDay = calculateAverageHabitsPerDay(habits, state.logs, 30);
  const averageHabitsPerDayLabel = new Intl.NumberFormat(language === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 1 }).format(averageHabitsPerDay);
  const summary = summarizeAnalytics(language, avg, series, best, attention);
  return (
    <div className="panel analytics-summary-panel analytics-summary-panel-prominent">
      <h3>{title || text.title}</h3>
      <div className="analytics-summary-banner">
        <strong>{text.summaryTitle}</strong>
        <span>{summary || text.summaryFallback}</span>
      </div>
      <div className="analytics-summary-grid">
        <div className="analytics-summary-card analytics-summary-card-done">
          <b>{avg}%</b>
          <span>{text.completion}</span>
          <small>{text.completionHint}</small>
        </div>
        <div className="analytics-summary-card analytics-summary-card-accent">
          <b>{series}</b>
          <span>{text.current}</span>
          <small>{text.currentHint}</small>
        </div>
        <div className="analytics-summary-card analytics-summary-card-warm">
          <b>{best}</b>
          <span>{text.best}</span>
          <small>{text.bestHint}</small>
        </div>
        <div className="analytics-summary-card analytics-summary-card-warn">
          <b>{attention}</b>
          <span>{text.signals}</span>
          <small>{text.signalsHint}</small>
        </div>
        <div className="analytics-summary-card analytics-summary-card-average">
          <b>{averageHabitsPerDayLabel}</b>
          <span>{text.habitsPerDay}</span>
          <small>{text.habitsPerDayHint}</small>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsView({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [showAllSnapshot, setShowAllSnapshot] = useState(false);
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
  const snapshotRows = useMemo(() => {
    return selectors.activeHabits
      .map((habit) => ({ habit, stats: selectors.calculateStats(habit) }))
      .sort((a, b) => {
        const priorityA = a.stats.daysSince ?? 999;
        const priorityB = b.stats.daysSince ?? 999;
        return priorityB - priorityA || a.stats.completion - b.stats.completion;
      })
      .map(({ habit, stats }) => ({
        habit,
        stats,
        tone: stats.completion >= 80 ? "done" : stats.completion >= 55 ? "accent" : stats.completion >= 35 ? "warm" : "warn",
        note: language === "en"
          ? stats.daysSince === null
            ? "No successful check-ins yet"
            : stats.daysSince >= habit.warningThreshold
              ? `${stats.daysSince} days since the last win`
              : `${stats.streak} day${stats.streak === 1 ? "" : "s"} in a row`
          : stats.daysSince === null
            ? "Пока нет успешных отметок"
            : stats.daysSince >= habit.warningThreshold
              ? `${stats.daysSince} дней с последнего успеха`
              : `${stats.streak} дн${stats.streak === 1 ? "ь" : stats.streak < 5 ? "я" : "ей"} подряд`
      }));
  }, [language, selectors]);
  const visibleSnapshotRows = showAllSnapshot ? snapshotRows : snapshotRows.slice(0, 5);

  if (!selectors.hasAnyLogs) {
    return (
      <section className="stack">
        <StatsPanel selectors={selectors} state={state} mode="full" />
      </section>
    );
  }

  return (
    <section className="stack">
      <StatsPanel selectors={selectors} state={state} mode="full" />
      <div className="panel analytics-wave-panel analytics-wave-panel-prominent">
        <div className="section-head">
          <div>
            <h3>{language === "en" ? "Habit Trend Map" : "Карта ритмов"}</h3>
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
                  <span key={date}>{formatDate(date, "short", language)}</span>
                ))}
              </div>
              <WaveChart state={state} selectors={selectors} habits={selectedHabits} dates={dates} visibleStatuses={visibleStatuses} />
            </>
          ) : (
            <div className="empty action-empty">
              <b>{language === "en" ? "Choose at least one habit" : "Выбери хотя бы одну привычку"}</b>
              <span>{language === "en" ? "The chart becomes clearer when at least one line is visible." : "График станет наглядным, когда здесь появится хотя бы одна линия."}</span>
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
              {days} {language === "en" ? "d" : "д"}
            </button>
          ))}
        </div>
        {snapshotRows.length ? (
          <div className="panel analytics-snapshot-panel">
            <div className="section-head analytics-snapshot-head">
              <div>
                <h3>{language === "en" ? "Habit snapshot" : "Снимок привычек"}</h3>
                <p className="muted">
                  {language === "en"
                    ? `Showing ${visibleSnapshotRows.length} of ${snapshotRows.length} habits sorted by the soft attention order.`
                    : `Показаны ${visibleSnapshotRows.length} из ${snapshotRows.length} привычек, отсортированных по мягкому порядку внимания.`}
                </p>
              </div>
              {snapshotRows.length > 5 ? (
                <button className="btn ghost" onClick={() => setShowAllSnapshot((current) => !current)}>
                  {showAllSnapshot
                    ? (language === "en" ? "Show less" : "Свернуть")
                    : (language === "en" ? "Show all habits" : "Показать все привычки")}
                </button>
              ) : null}
            </div>
            <div className="analytics-insight-rows">
              {visibleSnapshotRows.map(({ habit, stats, tone, note }) => (
                <div className={`analytics-insight-row analytics-insight-row-${tone}`} key={habit.id}>
                  <div className="analytics-insight-left">
                    <span className="analytics-insight-icon" style={{ background: habit.color }}>{habit.icon}</span>
                    <div>
                      <strong>{habit.title}</strong>
                      <span>{habit.category || (language === "en" ? "No category" : "Без категории")}</span>
                    </div>
                  </div>
                  <div className="analytics-insight-metrics">
                    <span><b>{stats.completion}%</b>{language === "en" ? " rhythm" : " выполнение"}</span>
                    <span><b>{stats.streak}</b>{language === "en" ? " current" : " текущая"}</span>
                    <span><b>{stats.bestStreak}</b>{language === "en" ? " best" : " лучший"}</span>
                    <span>{note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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

function summarizeAnalytics(language: "ru" | "en", avg: number, series: number, best: number, attention: number) {
  if (language === "en") {
    const parts: string[] = [];
    if (avg >= 80) parts.push("The rhythm is steady and ready for bigger goals.");
    else if (avg >= 55) parts.push("The rhythm is workable and benefits from a little consistency.");
    else parts.push("The rhythm is uneven, so it helps to focus on fewer habits for now.");

    if (series > 0) parts.push(`The current streak reaches ${series}, showing where momentum is already alive.`);
    if (best > series) parts.push(`The best streak is ${best}, so there is room to grow beyond today’s pace.`);
    if (attention > 0) parts.push(`${attention} habit${attention === 1 ? "" : "s"} need a softer look.`);
    return parts.join(" ");
  }

  const parts: string[] = [];
  if (avg >= 80) parts.push("Ритм устойчивый: можно брать более заметные цели.");
  else if (avg >= 55) parts.push("Ритм рабочий: лучше держать курс без перегруза.");
  else parts.push("Ритм неровный: сейчас полезнее сфокусироваться на меньшем числе привычек.");

  if (series > 0) parts.push(`Текущая серия дошла до ${series}, значит, у ритма уже есть опора.`);
  if (best > series) parts.push(`Личный рекорд — ${best}, так что здесь ещё есть запас роста.`);
  if (attention > 0) parts.push(`${attention} привычк${attention === 1 ? "а" : attention < 5 ? "и" : "ек"} просят мягкого внимания.`);
  return parts.join(" ");
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
