import type { AppActions, AppState, DailyNote } from "../types";

export function DiaryPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  return (
    <div className="panel">
      <h3>Дневник дня</h3>
      <div className="stack">
        <div className="form-grid">
          <RangeField name="mood" label="Настроение" value={note.mood ?? 3} state={state} actions={actions} />
          <RangeField name="energy" label="Энергия" value={note.energy ?? 3} state={state} actions={actions} />
          <RangeField name="stress" label="Стресс" value={note.stress ?? 3} state={state} actions={actions} />
        </div>
        <div className="field">
          <label>Короткая заметка</label>
          <textarea className="textarea" value={note.text || ""} onChange={(event) => actions.setNoteField("text", event.target.value)} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Что помогло</label>
            <textarea className="textarea" value={note.helped || ""} onChange={(event) => actions.setNoteField("helped", event.target.value)} />
          </div>
          <div className="field">
            <label>Что мешало</label>
            <textarea className="textarea" value={note.blocked || ""} onChange={(event) => actions.setNoteField("blocked", event.target.value)} />
          </div>
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
    <div className="field">
      <label>{label}: <b>{value}</b></label>
      <input type="range" min="1" max="5" value={value} onChange={(event) => actions.setNoteField(name, Number(event.target.value))} />
    </div>
  );
}
