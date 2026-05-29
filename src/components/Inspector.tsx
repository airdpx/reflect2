import type { AppActions, AppSelectors, AppState } from "../types";
import { formatDate, todayKey } from "../lib/date";
import { statusMeta, suggestHabitIcon } from "../lib/defaults";
import { InspectorForecastSummary } from "./Forecast";

export function Inspector({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: Pick<AppActions, "saveHabit" | "updateSetting"> }) {
  const note = state.notes[state.selectedDate] || {};
  const logs = selectors.activeHabits.map((habit) => ({ habit, log: selectors.getLog(habit.id, state.selectedDate) }));
  const complete = logs.filter(({ log }) => log?.status === "done").length;
  const iconCheckedLabel = state.settings.iconSuggestionsCheckedAt === todayKey() ? "сегодня" : state.settings.iconSuggestionsCheckedAt;
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
      {state.settings.visibleBlocks.habitIcons && (
        <div className="panel inspector-panel">
          <div className="section-head">
            <div>
              <h3>Иконки привычек</h3>
              <p className="muted">Подбор по названию и категории, обновляется автоматически раз в день и по кнопке.</p>
            </div>
            <button
              className="btn ghost"
              onClick={() => actions.updateSetting("iconSuggestionsCheckedAt", todayKey())}
            >
              Проверить
            </button>
          </div>
          <p className="muted">Последняя проверка: {iconCheckedLabel}</p>
          <div className="habit-icon-suggestions">
            {state.habits.filter((habit) => !habit.archived).map((habit) => {
              const suggested = suggestHabitIcon(habit.title, habit.category, habit.type);
              const matched = habit.icon === suggested;
              return (
                <div className="settings-row habit-icon-row" key={habit.id}>
                  <span>
                    <b>{habit.icon} {habit.title}</b><br />
                    <small className="muted">Подсказка: {suggested} {matched ? "совпадает" : "можно применить"}</small>
                  </span>
                  {!matched && <button className="btn ghost compact-inline-btn" onClick={() => actions.saveHabit({ ...habit, icon: suggested })}>Применить</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <InspectorForecastSummary state={state} />
    </aside>
  );
}
