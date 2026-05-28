import type { AppActions, AppSelectors, AppState } from "../types";
import { Field } from "./Common";
import { formatDate } from "../lib/date";
import { habitTypeLabels, statusMeta } from "../lib/defaults";

export function CellSheet({
  cell,
  state,
  selectors,
  actions
}: {
  cell: { habitId: string; date: string };
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const habit = state.habits.find((item) => item.id === cell.habitId);
  if (!habit) return null;
  const log = selectors.getLog(cell.habitId, cell.date);
  const numericValue = log?.value || 0;
  const completedCount = log?.completedCount || 0;
  const numericProgress = Math.min(100, Math.round((numericValue / Math.max(1, habit.target)) * 100));
  const countProgress = Math.min(100, Math.round((completedCount / Math.max(1, habit.target)) * 100));
  const stats = selectors.calculateStats(habit);
  const history = Object.values(state.logs)
    .filter((item) => item.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  return (
    <div className="sheet open">
      <div className="sheet-card">
        <div className="modal-head">
          <h3>{habit.icon} {habit.title}</h3>
          <button className="icon-btn" onClick={() => actions.openCellSheet(null)}>×</button>
        </div>
        <p className="muted">{formatDate(cell.date)}</p>
        <div className="selected-status">
          <span>Текущая отметка</span>
          <b>{log?.status ? `${statusMeta[log.status].short} ${statusMeta[log.status].label}` : "нет отметки"}</b>
        </div>
        <div className="quick-actions detail-actions">
          {state.settings.activeStatuses.map((status) => (
            <button className={`btn ${log?.status === status ? "primary" : ""}`} key={status} onClick={() => { actions.setLog(cell.habitId, cell.date, { status }); actions.openCellSheet(null); }}>
              {statusMeta[status].short} {statusMeta[status].label}
            </button>
          ))}
        </div>
        <div className="cell-summary">
          <span>Тип: <b>{habitTypeLabels[habit.type]}</b></span>
          <span>Цель: <b>{habit.target}</b></span>
          <span>Статус: <b>{log?.status ? statusMeta[log.status].label : "нет"}</b></span>
        </div>
        <div className="cell-summary">
          <span>Streak: <b>{stats.streak}</b></span>
          <span>Лучший: <b>{stats.bestStreak}</b></span>
          <span>Последнее: <b>{stats.lastDone ? formatDate(stats.lastDone, "short") : "нет"}</b></span>
        </div>
        {habit.type === "numeric" && (
          <div className="type-control">
            <div className="progress-line"><span style={{ width: `${numericProgress}%` }} /></div>
            <Field label={`Значение / цель ${habit.target}`}>
              <input className="input" type="number" min="0" value={numericValue} onChange={(event) => actions.setLog(cell.habitId, cell.date, { value: Number(event.target.value), status: Number(event.target.value) >= habit.target ? "done" : "partial" })} />
            </Field>
            <div className="quick-actions detail-actions">
              {[25, 50, 100].map((percent) => {
                const value = Math.round((habit.target * percent) / 100);
                return <button className="btn ghost" key={percent} onClick={() => actions.setLog(cell.habitId, cell.date, { value, status: value >= habit.target ? "done" : "partial" })}>{percent}%</button>;
              })}
            </div>
          </div>
        )}
        {habit.type === "multiple" && (
          <div className="type-control">
            <div className="progress-line"><span style={{ width: `${countProgress}%` }} /></div>
            <Field label={`Повторы / цель ${habit.target}`}>
              <input className="input" type="number" min="0" max={habit.target} value={completedCount} onChange={(event) => actions.setLog(cell.habitId, cell.date, { completedCount: Number(event.target.value), status: Number(event.target.value) >= habit.target ? "done" : "partial" })} />
            </Field>
            <div className="stepper">
              <button className="btn ghost" onClick={() => actions.setLog(cell.habitId, cell.date, { completedCount: Math.max(0, completedCount - 1), status: completedCount - 1 >= habit.target ? "done" : "partial" })}>−</button>
              <strong>{completedCount}/{habit.target}</strong>
              <button className="btn ghost" onClick={() => actions.setLog(cell.habitId, cell.date, { completedCount: Math.min(habit.target, completedCount + 1), status: completedCount + 1 >= habit.target ? "done" : "partial" })}>+</button>
            </div>
          </div>
        )}
        {habit.type === "avoid" && <p className="muted">Для avoid-привычки “Выполнено” означает спокойный успешный день: нежелательное действие не произошло.</p>}
        {habit.type === "reflection" && <p className="muted">Для reflection-привычки запись сама считается выполнением.</p>}
        <Field label="Заметка к отметке"><textarea className="textarea" value={log?.note || ""} onChange={(event) => actions.setLog(cell.habitId, cell.date, { note: event.target.value, ...(habit.type === "reflection" && event.target.value.trim() ? { status: "done" } : {}) })} /></Field>
        <Field label="Настроение в этой отметке"><input type="range" min="1" max="5" value={log?.mood || 3} onChange={(event) => actions.setLog(cell.habitId, cell.date, { mood: Number(event.target.value) })} /></Field>
        <div className="history-list">
          <h4>Последние отметки</h4>
          {history.length ? history.map((item) => (
            <div className="settings-row" key={`${item.habitId}-${item.date}`}>
              <span><b>{formatDate(item.date, "short")}</b><br /><small className="muted">{item.note || (item.value ? `значение ${item.value}` : item.completedCount ? `${item.completedCount}/${habit.target}` : "без заметки")}</small></span>
              <span className="badge">{item.status ? statusMeta[item.status].label : "нет"}</span>
            </div>
          )) : <div className="empty">История появится после первых отметок.</div>}
        </div>
        <div className="toolbar detail-footer">
          <button className="btn ghost" onClick={() => { actions.openHabitModal(habit.id); actions.openCellSheet(null); }}>Редактировать привычку</button>
          <button className="btn ghost" onClick={() => actions.clearLog(cell.habitId, cell.date)}>Очистить отметку</button>
        </div>
      </div>
    </div>
  );
}
