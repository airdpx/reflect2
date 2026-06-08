import type { AppActions, AppSelectors, AppState, DailyNote } from "../types";
import { formatDate } from "../lib/date";
import { statusMeta } from "../lib/defaults";
import { normalizeLanguage } from "../lib/i18n";

export function Inspector({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  const logs = selectors.activeHabits.map((habit) => ({ habit, log: selectors.getLog(habit.id, state.selectedDate) }));
  const complete = logs.filter(({ log }) => log?.status === "done").length;
  if (state.view === "today") {
    return <TodayDiaryInspector note={note} state={state} selectors={selectors} actions={actions} />;
  }
  return (
    <aside className="inspector observation-panel">
      <ObservationHeader state={state} actions={actions} title="Наблюдение" />
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

function TodayDiaryInspector({ note, state, selectors, actions }: { note: DailyNote; state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  const rhythmStats = selectors.activeHabits.length ? calculateAverageRhythm(selectors) : null;
  return (
    <aside className="inspector today-diary-inspector observation-panel">
      <ObservationHeader state={state} actions={actions} title="Наблюдение" />
      {state.settings.visibleBlocks.noteText && (
        <div className="panel inspector-panel today-diary-panel">
          <div className="section-head">
            <div>
              <h3>Запись дня</h3>
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
      )}
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
        {rhythmStats ? (
          <div className={`inspector-rhythm-card inspector-rhythm-card-${rhythmStats.tone}`}>
            <span>{language === "en" ? "Average rhythm" : "Средний ритм"}</span>
            <strong>{rhythmStats.value}%</strong>
            <small>{language === "en" ? "Average completion of active habits." : "Средний процент выполнения активных привычек."}</small>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function ObservationHeader({ state, actions, title }: { state: AppState; actions: AppActions; title: string }) {
  return (
    <div className="panel observation-banner">
      <div className="observation-banner-title">
        <h3>{title}</h3>
      </div>
      <label className="observation-date">
        <span>Дата наблюдения</span>
        <input className="input date-input" type="date" value={state.selectedDate} onChange={(event) => actions.setSelectedDate(event.target.value || state.selectedDate)} />
      </label>
    </div>
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

function calculateAverageRhythm(selectors: AppSelectors) {
  const totals = selectors.activeHabits
    .map((habit) => selectors.calculateStats(habit).completion)
    .filter((value) => Number.isFinite(value));
  const rhythm = totals.length ? Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length) : 0;
  const tone = rhythm >= 80 ? "done" : rhythm >= 55 ? "accent" : rhythm >= 35 ? "warm" : "warn";
  return { value: rhythm, tone };
}
