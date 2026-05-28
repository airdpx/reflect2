import type { Habit, HabitLog, HabitStats, UserSettings } from "../types";
import { addDays, formatDate, fromKey, rangeDates, todayKey, toKey } from "./date";

export function logKey(habitId: string, dateKey: string) {
  return `${habitId}:${dateKey}`;
}

export function isHabitDue(habit: Habit, dateKey: string) {
  return habit.schedule.includes(fromKey(dateKey).getDay());
}

export function getPeriodDates(period: UserSettings["defaultPeriod"], showWeekends = true) {
  const today = fromKey(todayKey());
  const withoutHiddenWeekends = (dates: string[]) => showWeekends ? dates : dates.filter((date) => {
    const day = fromKey(date).getDay();
    return day !== 0 && day !== 6;
  });
  if (period.mode === "week") {
    const day = today.getDay() || 7;
    const start = addDays(today, 1 - day);
    return withoutHiddenWeekends(rangeDates(toKey(start), toKey(addDays(start, 6))));
  }
  if (period.mode === "month") {
    return withoutHiddenWeekends(rangeDates(
      toKey(new Date(today.getFullYear(), today.getMonth(), 1)),
      toKey(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    ));
  }
  if (period.mode === "custom") return withoutHiddenWeekends(rangeDates(period.start, period.end));
  return withoutHiddenWeekends(Array.from({ length: period.days }, (_, i) => toKey(addDays(today, i - period.days + 1))));
}

export function getPeriodLabel(period: UserSettings["defaultPeriod"]) {
  if (period.mode === "week") return "Текущая неделя";
  if (period.mode === "month") return "Текущий месяц";
  if (period.mode === "custom") return `${formatDate(period.start, "short")} – ${formatDate(period.end, "short")}`;
  return `Последние ${period.days} дней`;
}

export function calculateHabitStats(
  habit: Habit,
  dates: string[],
  logs: Record<string, HabitLog>
): HabitStats {
  const getLog = (date: string) => logs[logKey(habit.id, date)] || null;
  const dueDates = dates.filter((date) => isHabitDue(habit, date));
  const doneDates = dueDates.filter((date) => isSuccessfulLog(habit, getLog(date)));
  const partialDates = dueDates.filter((date) => getLog(date)?.status === "partial");
  const lastDone = [...dueDates].reverse().find((date) => isSuccessfulLog(habit, getLog(date)));
  const completion = dueDates.length
    ? Math.round(((doneDates.length + partialDates.length * 0.5) / dueDates.length) * 100)
    : 0;
  const daysSince = lastDone
    ? Math.max(0, Math.floor((fromKey(todayKey()).getTime() - fromKey(lastDone).getTime()) / 86400000))
    : null;
  const missedPlanned = dueDates.filter((date) => date < todayKey() && !getLog(date)).length;
  return {
    due: dueDates.length,
    done: doneDates.length,
    completion,
    streak: getStreak(habit, logs),
    bestStreak: getBestStreak(habit, rangeDates(toKey(addDays(fromKey(todayKey()), -180)), todayKey()), logs),
    lastDone,
    daysSince,
    missedPlanned
  };
}

function getStreak(habit: Habit, logs: Record<string, HabitLog>) {
  let streak = 0;
  for (let d = fromKey(todayKey()); streak < 370; d = addDays(d, -1)) {
    const key = toKey(d);
    if (!isHabitDue(habit, key)) continue;
    if (isSuccessfulLog(habit, logs[logKey(habit.id, key)] || null)) streak += 1;
    else break;
  }
  return streak;
}

function getBestStreak(habit: Habit, dates: string[], logs: Record<string, HabitLog>) {
  let best = 0;
  let current = 0;
  for (const date of dates) {
    if (!isHabitDue(habit, date)) continue;
    if (isSuccessfulLog(habit, logs[logKey(habit.id, date)] || null)) current += 1;
    else current = 0;
    best = Math.max(best, current);
  }
  return best;
}

function isSuccessfulLog(habit: Habit, log: HabitLog | null) {
  if (!log) return false;
  if (habit.type === "avoid") return log.status === "done" || log.status === "skipped";
  if (habit.type === "numeric") return (log.value || 0) >= habit.target || log.status === "done";
  if (habit.type === "multiple") return (log.completedCount || 0) >= habit.target || log.status === "done";
  if (habit.type === "reflection") return Boolean(log.note) || log.status === "done";
  return log.status === "done";
}

export function getAttentionHabits(habits: Habit[], dates: string[], logs: Record<string, HabitLog>) {
  return habits
    .map((habit) => ({ habit, stats: calculateHabitStats(habit, dates, logs) }))
    .filter(({ habit, stats }) => (stats.daysSince ?? 999) >= habit.warningThreshold || stats.missedPlanned >= habit.warningThreshold)
    .slice(0, 5);
}
