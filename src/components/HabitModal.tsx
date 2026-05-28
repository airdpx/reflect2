import type { FormEvent } from "react";
import type { AppActions, Habit, HabitType } from "../types";
import { Field } from "./Common";
import { habitTypeHints, habitTypeLabels } from "../lib/defaults";
import { todayKey } from "../lib/date";

export function HabitModal({
  habit,
  isTemplateDraft = false,
  actions
}: {
  habit: Habit | null;
  isTemplateDraft?: boolean;
  actions: AppActions;
}) {
  const h = habit || {
    title: "",
    description: "",
    color: "#9caf88",
    icon: "○",
    category: "",
    type: "boolean" as HabitType,
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 4
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const schedule = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-weekday].active")).map((button) => Number(button.dataset.weekday));
    actions.saveHabit({
      id: habit?.id || crypto.randomUUID(),
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || ""),
      color: String(form.get("color") || "#9caf88"),
      icon: String(form.get("icon") || "○"),
      category: String(form.get("category") || ""),
      type: String(form.get("type") || "boolean") as HabitType,
      target: Number(form.get("target") || 1),
      schedule: schedule.length ? schedule : [1, 2, 3, 4, 5, 6, 0],
      archived: false,
      warningThreshold: Number(form.get("warningThreshold") || 4),
      createdAt: habit?.createdAt || todayKey()
    });
  }

  return (
    <div className="modal open">
      <div className="modal-card">
        <div className="modal-head">
          <h3>{isTemplateDraft ? "Новая привычка из шаблона" : habit ? "Редактировать привычку" : "Новая привычка"}</h3>
          {isTemplateDraft && <span className="badge">шаблон можно изменить</span>}
          <button className="icon-btn" onClick={() => actions.openHabitModal(null)}>×</button>
        </div>
        <form className="stack" onSubmit={submit}>
          <div className="form-grid">
            <Field label="Название"><input className="input" name="title" required defaultValue={h.title} /></Field>
            <Field label="Категория"><input className="input" name="category" defaultValue={h.category} /></Field>
            <Field label="Иконка"><input className="input" name="icon" defaultValue={h.icon} /></Field>
            <Field label="Цвет"><input className="input" type="color" name="color" defaultValue={h.color} /></Field>
            <Field label="Тип">
              <select className="select" name="type" defaultValue={h.type}>
                {(Object.keys(habitTypeLabels) as HabitType[]).map((type) => <option key={type} value={type}>{habitTypeLabels[type]}</option>)}
              </select>
            </Field>
            <Field label="Цель / количество"><input className="input" type="number" min="1" name="target" defaultValue={h.target} /></Field>
            <Field label="Порог внимания, дней"><input className="input" type="number" min="1" name="warningThreshold" defaultValue={h.warningThreshold} /></Field>
          </div>
          <Field label="Описание"><textarea className="textarea" name="description" defaultValue={h.description} /></Field>
          <div className="hint-grid">
            {(Object.keys(habitTypeHints) as HabitType[]).map((type) => (
              <div className={`hint-card ${h.type === type ? "active" : ""}`} key={type}>
                <b>{habitTypeLabels[type]}</b>
                <span>{habitTypeHints[type]}</span>
              </div>
            ))}
          </div>
          <div className="field">
            <label>Дни недели</label>
            <div className="weekdays">
              {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((label, day) => (
                <button type="button" className={`chip ${h.schedule.includes(day) ? "active" : ""}`} data-weekday={day} key={day} onClick={(event) => event.currentTarget.classList.toggle("active")}>{label}</button>
              ))}
            </div>
          </div>
          <div className="toolbar">
            <button className="btn primary" type="submit">Сохранить</button>
            {habit && !isTemplateDraft && <button className="btn danger" type="button" onClick={() => actions.deleteHabit(habit.id)}>Удалить</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
