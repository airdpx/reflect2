import { useEffect, useMemo, useRef, useState } from "react";
import type { AppActions, AppState, DailyNote, DiaryCustomFieldDefinition } from "../types";
import { addDays, formatDate, fromKey, todayKey, toKey } from "../lib/date";
import { normalizeLanguage } from "../lib/i18n";

export function DiaryPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  const text = language === "en" ? {
    title: "Daily diary",
    subtitle: "Compact state check-ins, notes and period history.",
    compact: "Compact",
    full: "Full",
    period: "Period",
    all: "All",
    fields: "Diary fields",
    history: "Note history",
    historyAll: "All notes with lazy loading as you scroll.",
    historyPeriod: "Entries for the selected period.",
    noHistory: "No notes for other days yet.",
    noText: "No text",
    doneText: "Done",
    notDoneText: "Not done",
    healthText: "Health",
    financeText: "Finance",
    customFields: "Custom fields",
    customFieldPlaceholder: "Field name",
    addField: "Add field",
    removeField: "Remove field",
    customEmpty: "Add a personal field for recurring diary topics.",
    note: "note",
    delete: "Delete",
    loading: "Loading..."
  } : {
    title: "Дневник дня",
    subtitle: "Компактные отметки состояния, заметки и история по периоду.",
    compact: "Компактно",
    full: "Полно",
    period: "Период",
    all: "Все",
    fields: "Поля дневника",
    history: "История заметок",
    historyAll: "Все заметки с догрузкой по мере прокрутки.",
    historyPeriod: "Записи за выбранный период.",
    noHistory: "Пока нет заметок за другие дни.",
    noText: "Без текста",
    doneText: "Сделано",
    notDoneText: "Не сделано",
    healthText: "Здоровье",
    financeText: "Финансы",
    customFields: "Свои поля",
    customFieldPlaceholder: "Название поля",
    addField: "Добавить поле",
    removeField: "Удалить поле",
    customEmpty: "Добавьте своё поле для повторяющейся темы дневника.",
    note: "заметка",
    delete: "Удалить",
    loading: "Загружаю..."
  };
  const note = state.notes[state.selectedDate] || {};
  const [customFieldName, setCustomFieldName] = useState("");
  const summaryLabels = useMemo(() => ({
    done: language === "en" ? "Done" : "Сделано",
    notDone: language === "en" ? "Not done" : "Не сделано",
    health: language === "en" ? "Health" : "Здоровье",
    finance: language === "en" ? "Finance" : "Финансы"
  }), [language]);
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
  const customFields = state.settings.diaryCustomFields || [];

  function addCustomField() {
    const label = customFieldName.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!label || customFields.some((field) => field.label.toLocaleLowerCase() === label.toLocaleLowerCase())) return;
    const id = `diary-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    actions.updateSetting("diaryCustomFields", [...customFields, { id, label, enabled: true }]);
    setCustomFieldName("");
  }

  function updateCustomField(fieldId: string, patch: Partial<DiaryCustomFieldDefinition>) {
    actions.updateSetting("diaryCustomFields", customFields.map((field) => field.id === fieldId ? { ...field, ...patch } : field));
  }

  function removeCustomField(fieldId: string) {
    actions.updateSetting("diaryCustomFields", customFields.filter((field) => field.id !== fieldId));
  }
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
          <h3>{text.title}</h3>
          <p className="muted">{text.subtitle}</p>
        </div>
        <div className="section-actions">
          <div className="segmented">
            <button type="button" className={state.settings.diaryLayout === "compact" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "compact")}>{text.compact}</button>
            <button type="button" className={state.settings.diaryLayout === "full" ? "active" : ""} onClick={() => actions.updateSetting("diaryLayout", "full")}>{text.full}</button>
          </div>
          <div className="segmented">
            <button
              type="button"
              className={state.settings.diaryHistoryMode === "period" ? "active" : ""}
              aria-pressed={state.settings.diaryHistoryMode === "period"}
              onClick={() => actions.updateSetting("diaryHistoryMode", "period")}
            >
              {text.period}
            </button>
            <button
              type="button"
              className={state.settings.diaryHistoryMode === "all" ? "active" : ""}
              aria-pressed={state.settings.diaryHistoryMode === "all"}
              onClick={() => actions.updateSetting("diaryHistoryMode", "all")}
            >
              {text.all}
            </button>
          </div>
        </div>
      </div>
      <details className="module-panel inline-module-panel">
        <summary>{text.fields}</summary>
        <div className="module-toggle-grid">
          {[
            ["mood", language === "en" ? "Mood" : "Настроение"],
            ["energy", language === "en" ? "Energy" : "Энергия"],
            ["stress", language === "en" ? "Stress" : "Стресс"],
            ["noteText", language === "en" ? "Note" : "Заметка"],
            ["helped", language === "en" ? "What was done" : "Что сделано"],
            ["blocked", language === "en" ? "What was not done" : "Что не сделано"],
            ["health", language === "en" ? "Health" : "Здоровье"],
            ["finance", language === "en" ? "Finance" : "Финансы"]
          ].map(([key, label]) => (
            <label key={key}>
              <input type="checkbox" checked={state.settings.visibleBlocks[key]} onChange={(event) => actions.updateVisible("visibleBlocks", key, event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="diary-custom-fields-manager">
          <div className="diary-custom-field-toolbar">
            <input
              className="input"
              value={customFieldName}
              maxLength={60}
              placeholder={text.customFieldPlaceholder}
              onChange={(event) => setCustomFieldName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomField();
                }
              }}
            />
            <button type="button" className="btn" disabled={!customFieldName.trim()} onClick={addCustomField}>+ {text.addField}</button>
          </div>
          {customFields.length ? (
            <div className="diary-custom-field-options">
              {customFields.map((field) => (
                <div className="diary-custom-field-option" key={field.id}>
                  <label>
                    <input type="checkbox" checked={field.enabled} onChange={(event) => updateCustomField(field.id, { enabled: event.target.checked })} />
                    <span>{field.label}</span>
                  </label>
                  <button type="button" className="icon-btn diary-custom-field-remove" title={text.removeField} aria-label={`${text.removeField}: ${field.label}`} onClick={() => removeCustomField(field.id)}>×</button>
                </div>
              ))}
            </div>
          ) : <p className="muted diary-custom-field-empty">{text.customEmpty}</p>}
        </div>
      </details>
      <div className="stack">
        <div className="form-grid diary-scales-grid">
          <RangeField name="mood" label={language === "en" ? "Mood" : "Настроение"} value={note.mood ?? 3} state={state} actions={actions} />
          <RangeField name="energy" label={language === "en" ? "Energy" : "Энергия"} value={note.energy ?? 3} state={state} actions={actions} />
          <RangeField name="stress" label={language === "en" ? "Stress" : "Стресс"} value={note.stress ?? 3} state={state} actions={actions} />
        </div>
        {state.settings.visibleBlocks.noteText && <div className="field">
          <label>{language === "en" ? "Short note" : "Короткая заметка"}</label>
          <textarea className={`textarea diary-note-textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.text || ""} onChange={(event) => actions.setNoteField("text", event.target.value)} />
        </div>}
        <div className={`form-grid ${state.settings.diaryLayout === "compact" ? "compact-diary-grid" : ""}`}>
          {state.settings.visibleBlocks.helped && <div className="field">
            <label>{summaryLabels.done}</label>
            <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.helped || ""} onChange={(event) => actions.setNoteField("helped", event.target.value)} />
          </div>}
          {state.settings.visibleBlocks.blocked && <div className="field">
            <label>{summaryLabels.notDone}</label>
            <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.blocked || ""} onChange={(event) => actions.setNoteField("blocked", event.target.value)} />
          </div>}
          {state.settings.visibleBlocks.health && <div className="field">
            <label>{summaryLabels.health}</label>
            <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.health || ""} onChange={(event) => actions.setNoteField("health", event.target.value)} />
          </div>}
          {state.settings.visibleBlocks.finance && <div className="field">
            <label>{summaryLabels.finance}</label>
            <textarea className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`} value={note.finance || ""} onChange={(event) => actions.setNoteField("finance", event.target.value)} />
          </div>}
          {customFields.filter((field) => field.enabled).map((field) => (
            <div className="field" key={field.id}>
              <label>{field.label}</label>
              <textarea
                className={`textarea ${state.settings.diaryLayout === "compact" ? "compact-textarea" : ""}`}
                value={note.customFields?.[field.id]?.value || ""}
                onChange={(event) => actions.setNoteField("customFields", {
                  ...(note.customFields || {}),
                  [field.id]: { label: field.label, value: event.target.value }
                })}
              />
            </div>
          ))}
        </div>
        <div className="panel nested-panel diary-history-panel">
              <div className="section-head compact-head">
              <div>
              <h3>{text.history}</h3>
              <p className="muted">{state.settings.diaryHistoryMode === "all" ? text.historyAll : text.historyPeriod}</p>
            </div>
            {state.settings.diaryHistoryMode === "period" ? (
              <div className="diary-history-strip">
                {[7, 14, 30, 90, 180].map((days) => (
                  <button type="button" key={days} className={historyDays === days ? "active" : ""} onClick={() => actions.updateSetting("diaryHistoryDays", days)}>
                    {days} {language === "en" ? "d" : "д"}
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
                  <span className="diary-history-summary">{renderDiarySummaryLines(entry, text, customFields).map((line, index) => (
                    <small key={`${date}-${index}`} className={`diary-history-summary-line diary-history-summary-line-${line.kind}`}>
                      {line.label ? <b className={`diary-history-summary-label diary-history-summary-label-${line.kind}`}>{line.label}</b> : null}
                      <span className="diary-history-summary-text">{line.text}</span>
                    </small>
                  ))}</span>
                </span>
                <span className="diary-history-meta">
                  <span className="badge">{entry.mood || entry.energy || entry.stress ? `${language === "en" ? "M" : "м"}:${entry.mood || "–"} ${language === "en" ? "E" : "э"}:${entry.energy || "–"} ${language === "en" ? "S" : "с"}:${entry.stress || "–"}` : text.note}</span>
                  <button className="btn ghost diary-delete-btn" title={text.delete} onClick={() => actions.deleteNote(date)}>{text.delete}</button>
                </span>
              </div>
            )) : <div className="empty">{text.noHistory}</div>}
            {state.settings.diaryHistoryMode === "all" && visibleCount < history.length ? (
              <div ref={loadMoreRef} className="diary-history-sentinel" aria-hidden="true" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type DiarySummaryLine = { kind: "text" | "done" | "notDone" | "health" | "finance" | "custom"; label?: string; text: string };

function renderDiarySummaryLines(entry: DailyNote, text: { noText: string; doneText: string; notDoneText: string; healthText: string; financeText: string }, definitions: DiaryCustomFieldDefinition[]): DiarySummaryLine[] {
  const items: DiarySummaryLine[] = [];
  const note = String(entry.text || "").trim();
  const done = String(entry.helped || "").trim();
  const notDone = String(entry.blocked || "").trim();
  const health = String(entry.health || "").trim();
  const finance = String(entry.finance || "").trim();

  if (note) items.push({ kind: "text", text: note });
  if (done) items.push({ kind: "done", label: `${text.doneText}:`, text: done });
  if (notDone) items.push({ kind: "notDone", label: `${text.notDoneText}:`, text: notDone });
  if (health) items.push({ kind: "health", label: `${text.healthText}:`, text: health });
  if (finance) items.push({ kind: "finance", label: `${text.financeText}:`, text: finance });
  Object.entries(entry.customFields || {}).forEach(([fieldId, field]) => {
    const value = String(field?.value || "").trim();
    if (!value) return;
    const label = definitions.find((definition) => definition.id === fieldId)?.label || field.label;
    items.push({ kind: "custom", label: `${label}:`, text: value });
  });

  return items.length ? items : [{ kind: "text", label: undefined, text: text.noText }];
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
