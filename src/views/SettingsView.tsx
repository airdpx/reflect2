import { useState } from "react";
import type { AppActions, AppState, Density, GridDisplayMode, GridTheme, HabitStatus, UserSettings, View } from "../types";
import { SelectControl, Toggle } from "../components/Common";
import { statusMeta } from "../lib/defaults";

const blockLabels: Record<string, string> = {
  today: "Сегодня",
  attention: "Требует внимания",
  diary: "Дневник",
  mood: "Настроение",
  energy: "Энергия",
  stress: "Стресс",
  noteText: "Короткая заметка",
  helped: "Что помогло",
  blocked: "Что мешало",
  analytics: "Аналитика",
  streak: "Streak",
  completion: "Процент выполнения",
  lastDone: "Последнее выполнение"
};

const gridLabels: Record<string, string> = {
  color: "Цвет",
  icon: "Иконка",
  category: "Категория",
  type: "Тип",
  target: "Цель",
  statusText: "Символ статуса",
  categoryGroups: "Группировка категорий",
  streak: "Streak",
  completion: "Completion rate",
  daysSince: "Дней с выполнения",
  noteMarker: "Маркер заметки",
  moodMarker: "Маркер настроения"
};

export function SettingsView({ state, actions }: { state: AppState; actions: AppActions }) {
  const [presetName, setPresetName] = useState("");
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");

  return (
    <section className="grid-two">
      <div className="stack">
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Вид</h3>
              <p className="muted">Пресеты меняют отображение, данные остаются на месте.</p>
            </div>
          </div>
          <div className="form-grid">
            <SelectControl label="Display preset" value={state.settings.preset} options={["Simple", "Balanced", "Journal", "Analytical", "Focus"]} onChange={(value) => actions.applyPreset(value as UserSettings["preset"])} />
            <SelectControl label="Плотность" value={state.settings.density} options={["compact", "standard", "comfortable"]} onChange={(value) => actions.updateSetting("density", value as Density)} />
            <SelectControl label="Тема сетки" value={state.settings.gridTheme} options={["soft", "classic", "journal", "minimal"]} onChange={(value) => actions.updateSetting("gridTheme", value as GridTheme)} />
            <SelectControl label="Вид сетки на ПК" value={state.settings.gridDisplayMode} options={["calendar", "compact", "matrix"]} onChange={(value) => actions.updateSetting("gridDisplayMode", value as GridDisplayMode)} />
            <SelectControl label="Клик по ячейке" value={state.settings.gridClickAction} options={["details", "cycle"]} onChange={(value) => actions.updateSetting("gridClickAction", value as "details" | "cycle")} />
            <SelectControl label="Стартовый экран" value={state.settings.defaultView} options={["today", "grid", "diary", "analytics", "settings"]} onChange={(value) => actions.updateSetting("defaultView", value as View)} />
            <SelectControl label="Дней сетки на мобильном" value={String(state.settings.mobileGridDays)} options={["7", "14", "30"]} onChange={(value) => actions.updateSetting("mobileGridDays", Number(value) as 7 | 14 | 30)} />
          </div>
          <Toggle label="Focus mode" checked={state.settings.focusMode} onChange={(checked) => actions.updateSetting("focusMode", checked)} />
          <Toggle label="Правая панель на ПК" checked={state.settings.rightPanel} onChange={(checked) => actions.updateSetting("rightPanel", checked)} />
          <Toggle label="Показывать выходные в сетке" checked={state.settings.showWeekends} onChange={(checked) => actions.updateSetting("showWeekends", checked)} />
          <div className="settings-row">
            <span><b>Режим пользователей</b><br /><small className="muted">Локальные профили сейчас, авторизация позже.</small></span>
            <select className="select compact-select" value={state.settings.activeUserId} onChange={(event) => actions.updateSetting("activeUserId", event.target.value)}>
              {state.settings.localUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </div>
        </div>
        <div className="panel settings-card">
          <h3>Стили сетки</h3>
          <p className="muted">Цветовая тема теперь переключается через круглую кнопку в углу экрана.</p>
          <div className="theme-preview-grid grid-theme-previews">
            {[
              ["soft", "Soft Grid"],
              ["classic", "Classic Check"],
              ["journal", "Journal Mood"],
              ["minimal", "Minimal Mono"]
            ].map(([theme, title]) => (
              <button
                key={theme}
                className={`grid-theme-preview ${state.settings.gridTheme === theme ? "active" : ""}`}
                onClick={() => actions.updateSetting("gridTheme", theme as GridTheme)}
              >
                <b>{title}</b>
                <span><i /><i /><i /><i /><i /></span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Статусы</h3>
              <p className="muted">“Выполнено” всегда включено, остальные можно скрыть.</p>
            </div>
          </div>
          {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
            <Toggle
              key={status}
              label={`${statusMeta[status].short} ${statusMeta[status].label}`}
              hint={status === "done" ? "обязательный статус" : undefined}
              checked={state.settings.activeStatuses.includes(status)}
              disabled={status === "done"}
              onChange={(checked) => actions.toggleStatus(status, checked)}
            />
          ))}
        </div>
        <div className="panel settings-card">
          <h3>Мои пресеты</h3>
          <div className="toolbar preset-toolbar">
            <input className="input" value={presetName} placeholder="Название пресета" onChange={(event) => setPresetName(event.target.value)} />
            <button className="btn" onClick={() => { actions.saveCustomPreset(presetName); setPresetName(""); }}>Сохранить</button>
          </div>
          <div className="chips">
            {Object.keys(state.settings.customPresets).length ? Object.keys(state.settings.customPresets).map((name) => (
              <button key={name} className="chip" onClick={() => actions.applyCustomPreset(name)}>{name}</button>
            )) : <span className="muted">Пока нет сохранённых пресетов.</span>}
          </div>
        </div>
      </div>
      <div className="stack">
        <div className="panel settings-card">
          <h3>Блоки</h3>
          {Object.entries(blockLabels).map(([key, label]) => <Toggle key={key} label={label} checked={state.settings.visibleBlocks[key]} onChange={(checked) => actions.updateVisible("visibleBlocks", key, checked)} />)}
        </div>
        <div className="panel settings-card">
          <h3>Сетка</h3>
          {Object.entries(gridLabels).map(([key, label]) => <Toggle key={key} label={label} checked={state.settings.visibleGrid[key]} onChange={(checked) => actions.updateVisible("visibleGrid", key, checked)} />)}
          <div className="danger-zone">
            <button className="btn ghost" onClick={actions.resetSettings}>Сбросить только настройки</button>
            <button className="btn danger" onClick={actions.resetAll}>Сбросить все данные</button>
          </div>
        </div>
        <div className="panel settings-card">
          <h3>Экспорт / импорт</h3>
          <div className="toolbar preset-toolbar">
            <button className="btn" onClick={() => setExportText(actions.exportData())}>Подготовить экспорт</button>
            <button className="btn" onClick={() => { if (!actions.importData(importText)) alert("Не удалось импортировать JSON"); }}>Импортировать JSON</button>
          </div>
          <textarea className="textarea export-box" value={exportText || importText} placeholder="JSON для экспорта или импорта" onChange={(event) => { setImportText(event.target.value); setExportText(""); }} />
        </div>
      </div>
    </section>
  );
}
