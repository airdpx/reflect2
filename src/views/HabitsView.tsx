import { useState } from "react";
import type { AppActions, AppSelectors, AppState, Habit } from "../types";
import { habitTemplates, habitTypeLabels } from "../lib/defaults";

export function HabitsView({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const active = state.habits.filter((habit) => !habit.archived);
  const archived = state.habits.filter((habit) => habit.archived);
  return (
    <section className="stack habits-view">
      <div className="panel habits-hero">
        <div>
          <h3>Библиотека привычек</h3>
          <p className="muted">Здесь живут иконки, категории, расписание, цели и быстрые шаблоны.</p>
        </div>
        <button className="btn primary" onClick={() => actions.openHabitModal("new")}>+ Добавить привычку</button>
      </div>
      <div className="grid-two habits-layout">
        <div className="stack">
          <HabitList title="Активные" habits={active} state={state} selectors={selectors} actions={actions} draggedHabitId={draggedHabitId} onDrag={setDraggedHabitId} />
          <HabitList title="Архив" habits={archived} state={state} selectors={selectors} actions={actions} draggedHabitId={draggedHabitId} onDrag={setDraggedHabitId} />
        </div>
        <div className="panel">
          <div className="section-head">
            <div>
              <h3>Шаблоны</h3>
              <p className="muted">Выберите заготовку и отредактируйте перед сохранением.</p>
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
  onDrag
}: {
  title: string;
  habits: Habit[];
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
  draggedHabitId: string | null;
  onDrag: (habitId: string | null) => void;
}) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{habits.length ? `${habits.length} привычек` : "Пока пусто"}</p>
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
                  <b className="drag-handle" title="Перетащить">⋮⋮</b>
                  <i style={{ background: habit.color }}>{habit.icon}</i>
                  <div>
                    <strong>{habit.title}</strong>
                  <span>{habit.category || "без категории"} · {habitTypeLabels[habit.type]} · цель {habit.target}</span>
                  <small>{habit.schedule.length}/7 дней · серия {stats.streak} · {stats.completion}%</small>
                  </div>
                <div className="habit-admin-actions">
                  <button className="btn ghost" onClick={() => actions.openHabitModal(habit.id)}>Изменить</button>
                  <button className="btn ghost" onClick={() => actions.saveHabit({ ...habit, archived: !habit.archived })}>{habit.archived ? "Вернуть" : "В архив"}</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty action-empty">
          <div>
            <b>{title === "Активные" ? "Добавьте первую привычку" : "Архив пуст"}</b>
            <span>{title === "Активные" ? "Можно начать с шаблона справа или создать свою." : "Сюда попадут привычки, которые не нужны каждый день."}</span>
          </div>
        </div>
      )}
    </div>
  );
}
