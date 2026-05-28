import type { AppActions, AppState, DailyNote } from "../types";

export function DiaryPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>Дневник дня</h3>
          <p className="muted">Компактные отметки состояния и свободные заметки.</p>
        </div>
        <div className="segmented">
          <button className={state.settings.diaryLayout === "compact" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "compact")}>Компактно</button>
          <button className={state.settings.diaryLayout === "full" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "full")}>Полно</button>
        </div>
      </div>
      <details className="module-panel inline-module-panel">
        <summary>Поля дневника</summary>
        <div className="module-toggle-grid">
          {[
            ["mood", "Настроение"],
            ["energy", "Энергия"],
            ["stress", "Стресс"],
            ["noteText", "Заметка"],
            ["helped", "Помогло"],
            ["blocked", "Мешало"]
          ].map(([key, label]) => (
            <label key={key}>
              <input type="checkbox" checked={state.settings.visibleBlocks[key]} onChange={(event) => actions.updateVisible("visibleBlocks", key, event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </details>
      <div className="stack">
        <div className="form-grid">
          <RangeField name="mood" label="Настроение" value={note.mood ?? 3} state={state} actions={actions} />
          <RangeField name="energy" label="Энергия" value={note.energy ?? 3} state={state} actions={actions} />
          <RangeField name="stress" label="Стресс" value={note.stress ?? 3} state={state} actions={actions} />
        </div>
        {state.settings.visibleBlocks.noteText && <div className="field">
          <label>Короткая заметка</label>
          <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.text || ""} onChange={(event) => actions.setNoteField("text", event.target.value)} />
        </div>}
        <div className={`form-grid ${state.settings.diaryLayout === "compact" ? "compact-diary-grid" : ""}`}>
          {state.settings.visibleBlocks.helped && <div className="field">
            <label>Что помогло</label>
            <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.helped || ""} onChange={(event) => actions.setNoteField("helped", event.target.value)} />
          </div>}
          {state.settings.visibleBlocks.blocked && <div className="field">
            <label>Что мешало</label>
            <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.blocked || ""} onChange={(event) => actions.setNoteField("blocked", event.target.value)} />
          </div>}
        </div>
      </div>
    </div>
  );
}

export function DiaryView(props: { state: AppState; actions: AppActions }) {
  return <section className="stack"><DiaryPanel {...props} /></section>;
}

function RangeField({
  name,
  label,
  value,
  state,
  actions
}: {
  name: keyof Pick<DailyNote, "mood" | "energy" | "stress">;
  label: string;
  value: number;
  state: AppState;
  actions: AppActions;
}) {
  if (!state.settings.visibleBlocks[name]) return null;
  return (
    <div className="field compact-scale-field">
      <label>{label}: <b>{value}</b></label>
      <div className="scale-buttons">
        {[1, 2, 3, 4, 5].map((item) => (
          <button key={item} className={value === item ? "active" : ""} onClick={() => actions.setNoteField(name, item)}>{item}</button>
        ))}
      </div>
    </div>
  );
}
