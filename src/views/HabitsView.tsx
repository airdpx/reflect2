import { useState } from "react";
import type { AppActions, AppSelectors, AppState, Habit } from "../types";
import { habitTemplates, habitTypeLabels } from "../lib/defaults";
import { normalizeLanguage } from "../lib/i18n";

export function HabitsView({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  const text = language === "en" ? {
    active: "Active",
    archive: "Archive",
    empty: "No habits yet",
    emptyActiveTitle: "Add your first habit",
    emptyActiveText: "You can start with a template on the right or create your own.",
    emptyArchiveTitle: "Archive is empty",
    emptyArchiveText: "Habits that are no longer needed every day will appear here.",
    habitsCount: (count: number) => `${count} habits`,
    categoryFallback: "no category",
    target: "goal",
    days: "days",
    streak: "streak",
    edit: "Edit",
    archiveAction: "Archive",
    restore: "Restore",
    templates: "Templates",
    templatesHint: "Choose a starter and edit it before saving.",
    drag: "Drag"
  } : {
    active: "Активные",
    archive: "Архив",
    empty: "Пока пусто",
    emptyActiveTitle: "Добавьте первую привычку",
    emptyActiveText: "Можно начать с шаблона справа или создать свою.",
    emptyArchiveTitle: "Архив пуст",
    emptyArchiveText: "Сюда попадут привычки, которые не нужны каждый день.",
    habitsCount: (count: number) => `${count} привычек`,
    categoryFallback: "без категории",
    target: "цель",
    days: "дней",
    streak: "серия",
    edit: "Изменить",
    archiveAction: "В архив",
    restore: "Вернуть",
    templates: "Шаблоны",
    templatesHint: "Выберите заготовку и отредактируйте перед сохранением.",
    drag: "Перетащить"
  };
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const active = state.habits.filter((habit) => !habit.archived);
  const archived = state.habits.filter((habit) => habit.archived);
  return (
    <section className="stack habits-view">
      <div className="grid-two habits-layout">
        <div className="stack">
          <HabitList title={text.active} habits={active} state={state} selectors={selectors} actions={actions} draggedHabitId={draggedHabitId} onDrag={setDraggedHabitId} text={text} />
          <HabitList title={text.archive} habits={archived} state={state} selectors={selectors} actions={actions} draggedHabitId={draggedHabitId} onDrag={setDraggedHabitId} text={text} />
        </div>
        <div className="panel habits-template-panel">
          <div className="section-head">
            <div>
              <h3>{text.templates}</h3>
              <p className="muted">{text.templatesHint}</p>
            </div>
          </div>
          <div className="template-grid compact-template-grid">
            {habitTemplates.map((template) => (
              <button className="template-card" key={template.id} onClick={() => actions.openHabitTemplate(template.id)}>
                <i style={{ background: template.color }}>{template.icon}</i>
                <b>{template.title}</b>
                <span>{template.category} · {habitTypeLabels[template.type]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HabitList({
  title,
  habits,
  state,
  selectors,
  actions,
  draggedHabitId,
  onDrag,
  text
}: {
  title: string;
  habits: Habit[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
  draggedHabitId: string | null;
  onDrag: (habitId: string | null) => void;
  text: {
    active: string;
    archive: string;
    empty: string;
    emptyActiveTitle: string;
    emptyActiveText: string;
    emptyArchiveTitle: string;
    emptyArchiveText: string;
    habitsCount: (count: number) => string;
    categoryFallback: string;
    target: string;
    days: string;
    streak: string;
    edit: string;
    archiveAction: string;
    restore: string;
  };
}) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{habits.length ? text.habitsCount(habits.length) : text.empty}</p>
        </div>
      </div>
      {habits.length ? (
        <div className="habit-admin-list">
          {habits.map((habit) => {
            const stats = selectors.calculateStats(habit);
            return (
                <article
                className={`habit-admin-card ${draggedHabitId === habit.id ? "dragging" : ""}`}
                key={habit.id}
                draggable
                onDragStart={() => onDrag(habit.id)}
                onDragEnd={() => onDrag(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedHabitId) actions.reorderHabit(draggedHabitId, habit.id);
                  onDrag(null);
                }}
                >
                  <b className="drag-handle" title={text.drag}>⋮⋮</b>
                  <i style={{ background: habit.color }}>{habit.icon}</i>
                  <div>
                    <strong>{habit.title}</strong>
                  <span>{habit.category || text.categoryFallback} · {habitTypeLabels[habit.type]} · {text.target} {habit.target}</span>
                  {habit.description ? <small className="muted habit-description">{habit.description}</small> : null}
                  <small>{habit.schedule.length}/7 {text.days} · {text.streak} {stats.streak} · {stats.completion}%</small>
                  </div>
                <div className="habit-admin-actions">
                  <button className="btn ghost" onClick={() => actions.openHabitModal(habit.id)}>{text.edit}</button>
                  <button className="btn ghost" onClick={() => actions.saveHabit({ ...habit, archived: !habit.archived })}>{habit.archived ? text.restore : text.archiveAction}</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty action-empty">
          <div>
            <b>{title === text.active ? text.emptyActiveTitle : text.emptyArchiveTitle}</b>
            <span>{title === text.active ? text.emptyActiveText : text.emptyArchiveText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
