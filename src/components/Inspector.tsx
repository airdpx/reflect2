import type { AppSelectors, AppState } from "../types";
import { formatDate } from "../lib/date";
import { statusMeta } from "../lib/defaults";
import { InspectorForecastSummary } from "./Forecast";

export function Inspector({ state, selectors }: { state: AppState; selectors: AppSelectors }) {
  const note = state.notes[state.selectedDate] || {};
  const logs = selectors.activeHabits.map((habit) => ({ habit, log: selectors.getLog(habit.id, state.selectedDate) }));
  const complete = logs.filter(({ log }) => log?.status === "done").length;
  return (
    <aside className="inspector">
      <div className="panel inspector-panel">
        <h3>{formatDate(state.selectedDate)}</h3>
        <div className="inspector-summary"><strong>{complete}/{logs.length}</strong><span>привычек выполнено</span></div>
        {logs.map(({ habit, log }) => (
          <div className="settings-row" key={habit.id}>
            <span>{habit.icon} {habit.title}</span>
            <span className="badge">{log?.status ? statusMeta[log.status].label : "нет отметки"}</span>
          </div>
        ))}
      </div>
      <div className="panel inspector-panel">
        <h3>Дневник</h3>
        <div className="mini-metrics">
          <span>Настроение <b>{note.mood ?? "—"}</b></span>
          <span>Энергия <b>{note.energy ?? "—"}</b></span>
          <span>Стресс <b>{note.stress ?? "—"}</b></span>
        </div>
        <p className="muted">{note.text || "Заметки на этот день пока нет."}</p>
      </div>
      <InspectorForecastSummary state={state} />
    </aside>
  );
}
