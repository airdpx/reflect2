import type { AppActions, AppSelectors, AppState, Habit } from "../types";
import { habitTypeLabels, statusMeta } from "../lib/defaults";

export function HabitCard({
  habit,
  state,
  selectors,
  actions
}: {
  habit: Habit;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const log = selectors.getLog(habit.id, state.selectedDate);
  const stats = selectors.calculateStats(habit);
  const statusLabel = log?.status ? statusMeta[log.status]?.label : "нет отметки";
  const needsAttention = (stats.daysSince ?? 999) >= habit.warningThreshold || stats.missedPlanned >= habit.warningThreshold;
  return (
    <article className="habit-card">
      <i className="habit-dot" style={{ background: habit.color }} />
      <div>
        <div className="habit-title">
          {state.settings.visibleGrid.icon && <span>{habit.icon}</span>}
          <strong>{habit.title}</strong>
          {state.settings.visibleGrid.category && habit.category ? <span className="badge">{habit.category}</span> : null}
        </div>
        <div className="habit-meta">
          <span>{habitTypeLabels[habit.type]}</span>
          <span>{statusLabel}</span>
          {state.settings.visibleGrid.streak && <span>streak {stats.streak}</span>}
          {state.settings.visibleGrid.daysSince && <span>{stats.daysSince ?? "нет"} дней с выполнения</span>}
          {needsAttention && <span className="signal">внимание</span>}
        </div>
      </div>
      <div className="quick-actions">
        {state.settings.activeStatuses.map((status) => (
          <button
            className={`status-btn ${statusMeta[status].className} ${log?.status === status ? "active" : ""}`}
            key={status}
            title={statusMeta[status].label}
            onClick={() => actions.setLog(habit.id, state.selectedDate, { status })}
          >
            {statusMeta[status].short}
          </button>
        ))}
        <button className="status-btn" title="Детали" onClick={() => actions.openCellSheet({ habitId: habit.id, date: state.selectedDate })}>
          ⋯
        </button>
        <button className="status-btn" title="Редактировать" onClick={() => actions.openHabitModal(habit.id)}>
          ⚙
        </button>
      </div>
    </article>
  );
}
