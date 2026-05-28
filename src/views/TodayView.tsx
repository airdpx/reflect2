import type { AppActions, AppSelectors, AppState, Habit } from "../types";
import { HabitCard } from "../components/HabitCard";
import { DiaryPanel } from "./DiaryView";
import { StatsPanel } from "./AnalyticsView";
import { habitTemplates } from "../lib/defaults";

export function TodayView({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const dueHabits = selectors.activeHabits.filter((habit) => selectors.isDue(habit, state.selectedDate));
  const attention = selectors.getAttentionHabits();
  const attentionIds = new Set(attention.map(({ habit }) => habit.id));
  const completed = dueHabits.filter((habit) => selectors.getLog(habit.id, state.selectedDate)?.status === "done");
  const open = dueHabits.filter((habit) => selectors.getLog(habit.id, state.selectedDate)?.status !== "done" && !attentionIds.has(habit.id));
  const dueAttention = dueHabits.filter((habit) => attentionIds.has(habit.id) && selectors.getLog(habit.id, state.selectedDate)?.status !== "done");

  if (!selectors.activeHabits.length) {
    return <OnboardingPanel actions={actions} />;
  }

  return (
    <div className="grid-two">
      <section className="stack">
        {state.settings.visibleBlocks.today && (
          <div className="panel">
            <div className="section-head">
              <div>
                <h3>Привычки на день</h3>
                <p className="muted">Быстрая отметка без лишних шагов.</p>
              </div>
              <div className="section-actions">
                <span className="badge">{completed.length}/{dueHabits.length} завершено</span>
                <button className="btn ghost" onClick={actions.markDayDone}>✓ Всё</button>
                <button className="btn ghost" onClick={actions.clearDay}>Очистить</button>
                <button className="btn ghost" onClick={actions.undoLastBulkAction}>↶ Undo</button>
              </div>
            </div>
            {dueHabits.length ? (
              <>
                <HabitGroup title="Сегодня" habits={open} state={state} selectors={selectors} actions={actions} />
                <HabitGroup title="Требует внимания" habits={dueAttention} tone="attention" state={state} selectors={selectors} actions={actions} />
                <HabitGroup title="Завершено" habits={completed} tone="done" state={state} selectors={selectors} actions={actions} />
              </>
            ) : (
              <div className="empty action-empty">
                <div>
                  <b>На этот день ничего не запланировано</b>
                  <span>Можно добавить привычку, выбрать шаблон или перейти к дневнику дня.</span>
                </div>
                <div className="quick-actions">
                  <button className="btn primary" onClick={() => actions.openHabitModal("new")}>Создать привычку</button>
                  <button className="btn ghost" onClick={() => actions.openHabitTemplate("journal")}>Шаблон дневника</button>
                  <button className="btn ghost" onClick={() => actions.setView("diary")}>Открыть дневник</button>
                </div>
              </div>
            )}
          </div>
        )}
        {state.settings.visibleBlocks.diary && <DiaryPanel state={state} actions={actions} />}
      </section>
      <section className="stack">
        {state.settings.visibleBlocks.attention && (
          <div className="panel">
            <h3>Требует внимания</h3>
            {attention.length ? attention.map(({ habit, stats }) => (
              <div className="settings-row" key={habit.id}>
                <span><b>{habit.icon} {habit.title}</b><br /><small className="muted">{stats.daysSince ?? "ещё нет"} дней без выполнения · {stats.completion}% за период</small></span>
                <span className="badge">{habit.warningThreshold}+ дней</span>
              </div>
            )) : <div className="empty">Пока нет мягких сигналов.</div>}
          </div>
        )}
        {state.settings.visibleBlocks.analytics && selectors.hasAnyLogs && <StatsPanel selectors={selectors} />}
      </section>
    </div>
  );
}

function OnboardingPanel({ actions }: { actions: AppActions }) {
  return (
    <section className="stack">
      <div className="panel onboarding-panel">
        <div>
          <h3>Начните с одной спокойной привычки</h3>
          <p className="muted">Можно создать свою или взять шаблон, а потом отредактировать цвет, расписание и цель.</p>
        </div>
        <div className="quick-actions onboarding-actions">
          <button className="btn primary" onClick={() => actions.openHabitModal("new")}>Создать привычку</button>
          <button className="btn ghost" onClick={() => actions.openHabitTemplate("journal")}>Открыть шаблон дневника</button>
          <button className="btn ghost" onClick={() => actions.setView("diary")}>Дневник дня</button>
        </div>
      </div>
      <TemplateChooser actions={actions} />
    </section>
  );
}

export function TemplateChooser({ actions }: { actions: AppActions }) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>Шаблоны привычек</h3>
          <p className="muted">Быстрый старт без пустой формы. Любой шаблон можно изменить перед сохранением.</p>
        </div>
      </div>
      <div className="template-grid">
        {habitTemplates.map((template) => (
          <button className="template-card" key={template.id} onClick={() => actions.openHabitTemplate(template.id)}>
            <i style={{ background: template.color }}>{template.icon}</i>
            <b>{template.title}</b>
            <span>{template.helper}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HabitGroup({
  title,
  habits,
  tone = "",
  state,
  selectors,
  actions
}: {
  title: string;
  habits: Habit[];
  tone?: string;
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  if (!habits.length) return null;
  return (
    <div className={`habit-group ${tone}`}>
      <div className="habit-group-title">{title}<span>{habits.length}</span></div>
      <div className="habit-list">{habits.map((habit) => <HabitCard key={habit.id} habit={habit} state={state} selectors={selectors} actions={actions} />)}</div>
    </div>
  );
}
