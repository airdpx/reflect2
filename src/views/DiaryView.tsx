import { useEffect, useMemo, useRef, useState } from "react";
import type { AppActions, AppState, DailyNote } from "../types";
import { addDays, formatDate, fromKey, todayKey, toKey } from "../lib/date";

export function DiaryPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  const note = state.notes[state.selectedDate] || {};
  const historyDays = state.settings.diaryHistoryDays || 30;
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const sortedHistory = useMemo(() => Object.entries(state.notes).sort((a, b) => b[0].localeCompare(a[0])), [state.notes]);
  const periodHistory = useMemo(() => {
    const historyStart = toKey(addDays(fromKey(state.selectedDate || todayKey()), -(historyDays - 1)));
    return sortedHistory.filter(([date]) => date >= historyStart && date <= state.selectedDate);
  }, [historyDays, sortedHistory, state.selectedDate]);
  const history = state.settings.diaryHistoryMode === "all" ? sortedHistory : periodHistory;
  const visibleHistory = state.settings.diaryHistoryMode === "all" ? history.slice(0, visibleCount) : history;

  useEffect(() => {
    setVisibleCount(20);
  }, [state.settings.diaryHistoryMode, state.settings.diaryHistoryDays, state.selectedDate, state.notes]);

  useEffect(() => {
    if (state.settings.diaryHistoryMode !== "all") return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(current + 20, history.length));
      }
    }, { rootMargin: "180px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [history.length, state.settings.diaryHistoryMode, visibleCount]);

  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>Дневник дня</h3>
          <p className="muted">Компактные отметки состояния, заметки и история по периоду.</p>
        </div>
        <div className="section-actions">
          <div className="segmented">
            <button className={state.settings.diaryLayout === "compact" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "compact")}>Компактно</button>
            <button className={state.settings.diaryLayout === "full" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "full")}>Полно</button>
          </div>
          <div className="segmented">
            <button className={state.settings.diaryHistoryMode === "period" ? "active" : ""} onClick={() => actions.updateSetting("diaryHistoryMode", "period")}>Период</button>
            <button className={state.settings.diaryHistoryMode === "all" ? "active" : ""} onClick={() => actions.updateSetting("diaryHistoryMode", "all")}>Все</button>
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
      <div className="stack">
        <div className="form-grid diary-scales-grid">
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
          <div className="section-head compact-head">
            <div>
              <h3>История заметок</h3>
              <p className="muted">{state.settings.diaryHistoryMode === "all" ? "Все заметки с догрузкой по мере прокрутки." : "Записи за выбранный период."}</p>
            </div>
            {state.settings.diaryHistoryMode === "period" ? (
              <div className="diary-history-strip">
                {[7, 14, 30, 90, 180].map((days) => (
                  <button key={days} className={historyDays === days ? "active" : ""} onClick={() => actions.updateSetting("diaryHistoryDays", days)}>
                    {days} д
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="history-list">
            {visibleHistory.length ? visibleHistory.map(([date, entry]) => (
              <div className="settings-row diary-history-row" key={date}>
                <span className="diary-history-main">
                  <b className="diary-history-date">{formatDate(date, "short")}</b>
                  <small className="muted">{entry.text || "Без текста"}</small>
                </span>
                <span className="diary-history-meta">
                  <span className="badge">{entry.mood || entry.energy || entry.stress ? `м:${entry.mood || "–"} э:${entry.energy || "–"} с:${entry.stress || "–"}` : "заметка"}</span>
                  <button className="btn ghost diary-delete-btn" title="Удалить заметку" onClick={() => actions.deleteNote(date)}>Удалить</button>
                </span>
              </div>
            )) : <div className="empty">Пока нет заметок за другие дни.</div>}
            {state.settings.diaryHistoryMode === "all" && visibleCount < history.length ? (
              <div ref={loadMoreRef} className="diary-history-sentinel" aria-hidden="true" />
            ) : null}
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
    <div className="field compact-scale-field scale-slider-field diary-scale-field">
      <label>{label}</label>
      <div className="scale-inline-row">
        <span className="muted scale-edge">1</span>
        <input
          className="range-input scale-inline-range"
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={(event) => actions.setNoteField(name, Number(event.target.value))}
        />
        <span className="scale-value">{value}</span>
      </div>
      <div className="scale-ticks"><span>1</span><span>3</span><span>5</span></div>
    </div>
  );
}
