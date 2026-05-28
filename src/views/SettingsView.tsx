import { useState } from "react";
import type { AppActions, AppState, Density, ForecastDisplayMode, ForecastProviderId, ForecastScaleId, ForecastSettings, HabitStatus, UserSettings, View } from "../types";
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
  forecast: "Прогноз дня",
  analytics: "Аналитика",
  streak: "Streak",
  completion: "Процент выполнения",
  lastDone: "Последнее выполнение"
};

const forecastPlacementOptions: Array<[keyof Pick<ForecastSettings, "showInToday" | "showInDiary" | "showInInspector" | "showInGrid">, string]> = [
  ["showInToday", "Сегодня"],
  ["showInDiary", "Дневник"],
  ["showInInspector", "Правая панель"],
  ["showInGrid", "Маркер в сетке"]
];

const forecastScaleOptions: Array<[ForecastScaleId, string]> = [
  ["physical", "Физическая"],
  ["emotional", "Эмоциональная"],
  ["intellectual", "Интеллектуальная"]
];

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
            <SelectControl label="Стартовый экран" value={state.settings.defaultView} options={["today", "grid", "habits", "diary", "analytics", "settings"]} onChange={(value) => actions.updateSetting("defaultView", value as View)} />
          </div>
          <Toggle label="Focus mode" checked={state.settings.focusMode} onChange={(checked) => actions.updateSetting("focusMode", checked)} />
          <Toggle label="Правая панель на ПК" checked={state.settings.rightPanel} onChange={(checked) => actions.updateSetting("rightPanel", checked)} />
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Профиль</h3>
              <p className="muted">Дата рождения задаётся при регистрации и используется для прогноза.</p>
            </div>
          </div>
          <div className="settings-row">
            <span><b>Аккаунт</b></span>
            <span className="badge">{state.profile?.email || "Гость"}</span>
          </div>
          <div className="settings-row">
            <span><b>Дата рождения</b></span>
            <span className="badge">{state.profile?.birthDate || "не задана"}</span>
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
              label={`${state.settings.statusIcons[status] || statusMeta[status].short} ${statusMeta[status].label}`}
              hint={status === "done" ? "обязательный статус" : undefined}
              checked={state.settings.activeStatuses.includes(status)}
              disabled={status === "done"}
              onChange={(checked) => actions.toggleStatus(status, checked)}
            />
          ))}
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Прогноз дня</h3>
              <p className="muted">Мягкий ориентир на основе биоритмов. Будущие источники подключатся сюда же.</p>
            </div>
          </div>
          <Toggle label="Включить прогноз" checked={state.settings.forecast.enabled} onChange={(checked) => actions.updateSetting("forecast", { ...state.settings.forecast, enabled: checked })} />
          <div className="form-grid">
            <SelectControl label="Источник" value={state.settings.forecast.provider} options={["biorhythm"]} onChange={(value) => actions.updateSetting("forecast", { ...state.settings.forecast, provider: value as ForecastProviderId })} />
            <SelectControl label="Вид" value={state.settings.forecast.displayMode} options={["compact", "cards", "minimal"]} onChange={(value) => actions.updateSetting("forecast", { ...state.settings.forecast, displayMode: value as ForecastDisplayMode })} />
          </div>
          <p className="muted">Дата рождения берётся из профиля аккаунта, поэтому здесь её менять не нужно.</p>
          <div className="module-toggle-grid">
            {forecastPlacementOptions.map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.forecast[key]} onChange={(event) => actions.updateSetting("forecast", { ...state.settings.forecast, [key]: event.target.checked })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="module-toggle-grid">
            {forecastScaleOptions.map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.forecast.visibleScales[key]} onChange={(event) => actions.updateSetting("forecast", { ...state.settings.forecast, visibleScales: { ...state.settings.forecast.visibleScales, [key]: event.target.checked } })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
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
