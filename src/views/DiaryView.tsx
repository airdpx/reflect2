import type { AppActions, AppState, DailyNote } from "../types";
import { DiaryForecastStrip } from "../components/Forecast";
import { addDays, formatDate, fromKey, rangeDates, todayKey, toKey } from "../lib/date";

export function DiaryPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  const historyDays = state.settings.diaryHistoryDays || 30;
  const historyStart = toKey(addDays(fromKey(state.selectedDate || todayKey()), -(historyDays - 1)));
  const historyDates = rangeDates(historyStart, state.selectedDate);
  const history = Object.entries(state.notes)
    .filter(([date]) => date >= historyStart && date <= state.selectedDate)
    .sort((a, b) => b[0].localeCompare(a[0]));
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>Дневник дня</h3>
          <p className="muted">Компактные отметки состояния, заметки и история по периоду.</p>
        </div>
        <div className="segmented">
          <button className={state.settings.diaryLayout === "compact" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "compact")}>Компактно</button>
          <button className={state.settings.diaryLayout === "full" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "full")}>Полно</button>
        </div>
      </div>
      <div className="panel nested-panel diary-history-panel">
        <div className="section-head compact-head">
          <div>
            <h3>История заметок</h3>
            <p className="muted">Календарь с отмеченными датами и лента записей за выбранный период.</p>
          </div>
          <div className="diary-history-strip">
            {[7, 14, 30, 90, 180].map((days) => (
              <button key={days} className={historyDays === days ? "active" : ""} onClick={() => actions.updateSetting("diaryHistoryDays", days)}>
                {days} д
              </button>
            ))}
          </div>
        </div>
        <div className="diary-history-calendar">
          <div className="diary-history-calendar-head">
            <span className="muted">{formatDate(historyStart, "short")} → {formatDate(state.selectedDate, "short")}</span>
            <span className="badge">{history.filter(([, entry]) => Boolean(entry.text || entry.helped || entry.blocked)).length} заметок</span>
          </div>
          <div className="diary-history-calendar-grid">
            {historyDates.map((date) => {
              const entry = state.notes[date];
              const hasNote = Boolean(entry && (entry.text || entry.helped || entry.blocked));
              return (
                <button
                  key={date}
                  className={`diary-history-day ${date === todayKey() ? "today" : ""} ${date === state.selectedDate ? "selected" : ""}`}
                  onClick={() => actions.setSelectedDate(date)}
                  title={formatDate(date)}
                >
                  <b>{date.slice(8, 10)}</b>
                  <span>{date.slice(5, 7)}</span>
                  {hasNote ? <i className="diary-history-note" /> : null}
                </button>
              );
            })}
          </div>
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
      <DiaryForecastStrip state={state} actions={actions} />
      <div className="stack">
        <div className="form-grid">
          <RangeField name="mood" label="Настроение" value={note.mood ?? 3} state={state} actions={actions} />
          <RangeField name="energy" label="Энергия" value={note.energy ?? 3} state={state} actions={actions} />
          <RangeField name="stress" label="Стресс" value={note.stress ?? 3} state={state} actions={actions} />
        </div>
        {state.settings.visibleBlocks.noteText && <div className="field">
          <label>Короткая заметка</label>
          <textarea className={`textarea diary-note-textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.text || ""} onChange={(event) => actions.setNoteField("text", event.target.value)} />
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
        <div className="panel nested-panel diary-history-panel">
          <div className="section-head">
            <div>
              <h3>Лента заметок</h3>
              <p className="muted">Записи за выбранный период с быстрым переходом по датам.</p>
            </div>
          </div>
          <div className="history-list">
            {history.length ? history.map(([date, entry]) => (
              <button className="settings-row diary-history-row" key={date} onClick={() => actions.setSelectedDate(date)}>
                <span>
                  <b>{formatDate(date, "short")}</b><br />
                  <small className="muted">{entry.text || "Без текста"}</small>
                </span>
                <span className="badge">{entry.mood || entry.energy || entry.stress ? `м:${entry.mood || "–"} э:${entry.energy || "–"} с:${entry.stress || "–"}` : "заметка"}</span>
              </button>
            )) : <div className="empty">Пока нет заметок за другие дни.</div>}
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
    <div className="field compact-scale-field scale-slider-field vertical-scale-field">
      <label>{label}</label>
      <div className="vertical-scale-box">
        <span className="muted">1</span>
        <div className="vertical-range-wrap">
          <input
            className="range-input vertical-range"
            type="range"
            min="1"
            max="5"
            step="1"
            value={value}
            onChange={(event) => actions.setNoteField(name, Number(event.target.value))}
          />
        </div>
        <span className="vertical-value">{value}</span>
      </div>
      <div className="scale-ticks"><span>1</span><span>3</span><span>5</span></div>
    </div>
  );
}
