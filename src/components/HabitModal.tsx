import { useState } from "react";
import type { FormEvent } from "react";
import type { AppActions, Habit, HabitType } from "../types";
import { Field } from "./Common";
import { habitCategoryPresets, habitIconPresets, habitTypeHints, habitTypeLabels } from "../lib/defaults";
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
    icon: "💧",
    category: "",
    type: "boolean" as HabitType,
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 4
  };
  const [icon, setIcon] = useState(h.icon);
  const [category, setCategory] = useState(h.category);
  const [type, setType] = useState<HabitType>(h.type);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const schedule = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-weekday].active")).map((button) => Number(button.dataset.weekday));
    actions.saveHabit({
      id: habit?.id || crypto.randomUUID(),
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || ""),
      color: String(form.get("color") || "#9caf88"),
      icon: String(form.get("icon") || icon || "💧"),
      category: String(form.get("category") || category || ""),
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
            <Field label="Категория">
              <input className="input" name="category" value={category} list="habit-category-presets" onChange={(event) => setCategory(event.target.value)} />
              <datalist id="habit-category-presets">
                {habitCategoryPresets.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Field>
            <Field label="Иконка"><input className="input icon-input" name="icon" value={icon} maxLength={4} onChange={(event) => setIcon(event.target.value.slice(0, 4))} /></Field>
            <Field label="Цвет"><input className="input" type="color" name="color" defaultValue={h.color} /></Field>
            <Field label="Тип">
              <select className="select" name="type" value={type} onChange={(event) => setType(event.target.value as HabitType)}>
                {(Object.keys(habitTypeLabels) as HabitType[]).map((type) => <option key={type} value={type}>{habitTypeLabels[type]}</option>)}
              </select>
            </Field>
            <Field label="Цель / количество"><input className="input" type="number" min="1" name="target" defaultValue={h.target} /></Field>
            <Field label="Порог внимания, дней"><input className="input" type="number" min="1" name="warningThreshold" defaultValue={h.warningThreshold} /></Field>
          </div>
          <div className="picker-panel">
            <div>
              <span className="picker-label">Иконки</span>
              <div className="preset-icon-grid">
                {habitIconPresets.map((item) => <button type="button" key={item} className={icon === item ? "active" : ""} onClick={() => setIcon(item)}>{item}</button>)}
              </div>
            </div>
            <div>
              <span className="picker-label">Категории</span>
              <div className="category-chip-row">
                {habitCategoryPresets.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
              </div>
            </div>
          </div>
          <Field label="Описание"><textarea className="textarea" name="description" defaultValue={h.description} /></Field>
          <div className="hint-grid">
            {(Object.keys(habitTypeHints) as HabitType[]).map((itemType) => (
              <div className={`hint-card ${itemType === type ? "active" : ""}`} key={itemType}>
                <b>{habitTypeLabels[itemType]}</b>
                <span>{habitTypeHints[itemType]}</span>
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
