import type { AppActions, AppSelectors, AppState, DailyNote } from "../types";
import { formatDate } from "../lib/date";
import { statusMeta } from "../lib/defaults";

export function Inspector({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  const logs = selectors.activeHabits.map((habit) => ({ habit, log: selectors.getLog(habit.id, state.selectedDate) }));
  const complete = logs.filter(({ log }) => log?.status === "done").length;
  if (state.view === "today") {
    return <TodayDiaryInspector note={note} state={state} actions={actions} />;
  }
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
    </aside>
  );
}

function TodayDiaryInspector({ note, state, actions }: { note: DailyNote; state: AppState; actions: AppActions }) {
  return (
    <aside className="inspector today-diary-inspector">
      <div className="panel inspector-panel today-diary-panel">
        <div className="section-head">
          <div>
            <h3>Запись дня</h3>
            <p className="muted">{formatDate(state.selectedDate)}</p>
          </div>
          <button className="btn ghost" onClick={() => actions.setView("diary")}>Открыть</button>
        </div>
        <textarea
          className="textarea compact-textarea inspector-note-textarea"
          value={note.text || ""}
          placeholder="Короткая заметка на сегодня"
          onChange={(event) => actions.setNoteField("text", event.target.value)}
        />
      </div>
      <div className="panel inspector-panel today-state-panel">
        <div className="section-head">
          <div>
            <h3>Состояние</h3>
            <p className="muted">Настроение, энергия и стресс за день.</p>
          </div>
        </div>
        <div className="inspector-state-grid">
          <InspectorRange label="Настроение" value={note.mood ?? 3} onChange={(value) => actions.setNoteField("mood", value)} />
          <InspectorRange label="Энергия" value={note.energy ?? 3} onChange={(value) => actions.setNoteField("energy", value)} />
          <InspectorRange label="Стресс" value={note.stress ?? 3} onChange={(value) => actions.setNoteField("stress", value)} />
        </div>
        <div className="inspector-help-note">Состояние сохраняется в дневнике за выбранную дату.</div>
      </div>
    </aside>
  );
}

function InspectorRange({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="inspector-range">
      <span>{label}</span>
      <input type="range" min="1" max="5" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <b>{value}</b>
    </label>
  );
}
