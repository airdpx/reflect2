import type { AppActions, AppSelectors, AppState, DailyNote } from "../types";
import { formatDate } from "../lib/date";
import { statusMeta } from "../lib/defaults";
import { normalizeLanguage, statusText } from "../lib/i18n";

export function Inspector({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  const logs = selectors.activeHabits.map((habit) => ({ habit, log: selectors.getLog(habit.id, state.selectedDate) }));
  const complete = logs.filter(({ log }) => log?.status === "done").length;
  if (state.view === "today") {
    return <TodayDiaryInspector note={note} state={state} selectors={selectors} actions={actions} />;
  }
  return (
    <aside className="inspector observation-panel">
      <ObservationHeader state={state} actions={actions} title={state.settings.language === "en" ? "Observation" : "Наблюдение"} />
      <div className="panel inspector-panel">
        <h3>{formatDate(state.selectedDate, "long", state.settings.language)}</h3>
        <div className="inspector-summary"><strong>{complete}/{logs.length}</strong><span>{state.settings.language === "en" ? "habits completed" : "привычек выполнено"}</span></div>
        {logs.map(({ habit, log }) => (
          <div className="settings-row" key={habit.id}>
            <span>{habit.icon} {habit.title}</span>
            <span className="badge">{log?.status ? statusText[normalizeLanguage(state.settings.language)][log.status] : (state.settings.language === "en" ? "no check-in" : "нет отметки")}</span>
          </div>
        ))}
      </div>
      <div className="panel inspector-panel">
        <h3>{state.settings.language === "en" ? "Diary" : "Дневник"}</h3>
        <div className="mini-metrics">
          <span>{state.settings.language === "en" ? "Mood" : "Настроение"} <b>{note.mood ?? "—"}</b></span>
          <span>{state.settings.language === "en" ? "Energy" : "Энергия"} <b>{note.energy ?? "—"}</b></span>
          <span>{state.settings.language === "en" ? "Stress" : "Стресс"} <b>{note.stress ?? "—"}</b></span>
        </div>
        <p className="muted">{note.text || (state.settings.language === "en" ? "No notes for this day yet." : "Заметки на этот день пока нет.")}</p>
      </div>
      {state.settings.visibleBlocks.analytics ? <AnalyticsSummaryPanel state={state} selectors={selectors} /> : null}
    </aside>
  );
}

function TodayDiaryInspector({ note, state, selectors, actions }: { note: DailyNote; state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  return (
    <aside className="inspector today-diary-inspector observation-panel">
      <ObservationHeader state={state} actions={actions} title={language === "en" ? "Observation" : "Наблюдение"} />
      {state.settings.visibleBlocks.noteText && (
        <div className="panel inspector-panel today-diary-panel">
          <div className="section-head">
            <div>
              <h3>{language === "en" ? "Day note" : "Запись дня"}</h3>
            </div>
            <button className="btn ghost" onClick={() => actions.setView("diary")}>{language === "en" ? "Open" : "Открыть"}</button>
          </div>
          <textarea
            className="textarea compact-textarea inspector-note-textarea"
            value={note.text || ""}
            placeholder={language === "en" ? "Short note for today" : "Короткая заметка на сегодня"}
            onChange={(event) => actions.setNoteField("text", event.target.value)}
          />
        </div>
      )}
      <div className="panel inspector-panel today-state-panel">
        <div className="section-head">
          <div>
            <h3>{language === "en" ? "State" : "Состояние"}</h3>
            <p className="muted">{language === "en" ? "Mood, energy and stress for the day." : "Настроение, энергия и стресс за день."}</p>
          </div>
        </div>
        <div className="inspector-state-grid">
          <InspectorRange label={language === "en" ? "Mood" : "Настроение"} value={note.mood ?? 3} onChange={(value) => actions.setNoteField("mood", value)} />
          <InspectorRange label={language === "en" ? "Energy" : "Энергия"} value={note.energy ?? 3} onChange={(value) => actions.setNoteField("energy", value)} />
          <InspectorRange label={language === "en" ? "Stress" : "Стресс"} value={note.stress ?? 3} onChange={(value) => actions.setNoteField("stress", value)} />
        </div>
        <div className="inspector-help-note">{language === "en" ? "The state is saved in the diary for the selected date." : "Состояние сохраняется в дневнике за выбранную дату."}</div>
      </div>
      {state.settings.visibleBlocks.analytics ? <AnalyticsSummaryPanel state={state} selectors={selectors} /> : null}
    </aside>
  );
}

function AnalyticsSummaryPanel({ state, selectors }: { state: AppState; selectors: AppSelectors }) {
  const language = normalizeLanguage(state.settings.language);
  const rhythmStats = selectors.activeHabits.length ? calculateAverageRhythm(selectors) : null;
  if (!rhythmStats) return null;
  return (
    <div className="panel inspector-panel inspector-analytics-panel">
        <div className="section-head">
          <div>
            <h3>{language === "en" ? "Analytics" : "Аналитика"}</h3>
          </div>
      </div>
      <div className={`inspector-rhythm-card inspector-rhythm-card-${rhythmStats.tone}`}>
        <span>{language === "en" ? "Average rhythm" : "Средний ритм"}</span>
        <strong>{rhythmStats.value}%</strong>
        <small>{language === "en" ? "Average completion of active habits." : "Средний процент выполнения активных привычек."}</small>
      </div>
    </div>
  );
}

function ObservationHeader({ state, actions, title }: { state: AppState; actions: AppActions; title: string }) {
  const language = normalizeLanguage(state.settings.language);
  return (
    <div className="panel observation-banner">
      <div className="observation-banner-title">
        <h3>{title}</h3>
      </div>
      <label className="observation-date">
        <span>{language === "en" ? "Observation date" : "Дата наблюдения"}</span>
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
