import { useState } from "react";
import type { AppActions, AppState, Density, ForecastDisplayMode, ForecastScaleId, ForecastSettings, HabitStatus, NumerologyDisplayMode, NumerologyMetricId, NumerologySettings, TodayBlockKey, UserSettings, View } from "../types";
import { SelectControl, Toggle } from "../components/Common";
import { statusMeta } from "../lib/defaults";
import { normalizeLanguage, statusText, viewText } from "../lib/i18n";

const sectionGroups = [
  { id: "today", keys: ["today", "attention", "forecast", "numerology", "transit", "analytics"] as const },
  { id: "diary", keys: ["diary", "mood", "energy", "stress", "noteText", "helped", "blocked"] as const },
  { id: "habits", keys: [] as const },
  { id: "calendar", gridKeys: ["color", "icon", "category", "type", "target", "statusText", "completion", "daysSince"] as const }
] as const;

const mobileBlockKeys: TodayBlockKey[] = ["today", "attention", "forecast", "numerology", "transit", "analytics", "noteText"];
const forecastPlacementKeys: Array<keyof Pick<ForecastSettings, "showInToday" | "showInDiary" | "showInInspector" | "showInGrid">> = ["showInToday", "showInDiary", "showInInspector", "showInGrid"];
const forecastScaleKeys: ForecastScaleId[] = ["physical", "emotional", "intellectual"];
const numerologyPlacementKeys: Array<keyof Pick<NumerologySettings, "showInToday" | "showInDiary" | "showInInspector">> = ["showInToday", "showInDiary", "showInInspector"];
const numerologyMetricKeys: NumerologyMetricId[] = ["personalDay", "personalMonth", "personalYear", "lifePath"];

function getSettingsCopy(language: "ru" | "en") {
  if (language === "en") {
    return {
      viewTitle: "View",
      viewHint: "Presets change the layout, data stays put.",
      displayPresetLabel: "Display preset",
      densityLabel: "Density",
      startViewLabel: "Start screen",
      focusModeLabel: "Focus mode",
      rightPanelLabel: "Right panel on desktop",
      profileTitle: "Profile",
      profileHint: "Birth date is set during registration and powers forecasts and recommendations.",
      accountLabel: "Account",
      birthDateLabel: "Birth date",
      statusesTitle: "Statuses",
      statusesHint: "\"Done\" is always on, the rest can be hidden.",
      calendarTitle: "Calendar",
      calendarHint: "How much history to show in the calendar.",
      historyLabel: "Calendar history",
      mobileTitle: "Today on mobile",
      mobileHint: "You can hide individual blocks only in the mobile Today screen.",
      forecastTitle: "Biorhythms",
      forecastHint: "An orientation for self-observation, without pressure or medical claims.",
      forecastEnableLabel: "Enable biorhythms",
      forecastDisplayLabel: "Display",
      forecastBirthHint: "Birth date comes from the account profile, so you do not need to change it here.",
      numerologyTitle: "Numbers",
      numerologyHint: "Personal Day, Personal Month, Personal Year and Life Path are calculated from the birth date and the selected day.",
      numerologyEnableLabel: "Enable numbers",
      numerologyDisplayLabel: "Display",
      presetsTitle: "My presets",
      presetsHint: "Quick start without an empty form. Any preset can be changed before saving.",
      presetInputPlaceholder: "Preset name",
      presetSaveLabel: "Save",
      presetEmpty: "No saved presets yet.",
      blocksTitle: "Blocks",
      blocksHint: "What information is visible in the dashboard and compact surfaces.",
      navigationTitle: "Navigation",
      navigationHint: "Start screen and focus mode are configured here too.",
      calendarCardTitle: "Calendar",
      calendarCardHint: "Table styling and visibility settings now live in the Calendar section.",
      diaryCardTitle: "Diary",
      diaryCardHint: "History, fields and compactness are grouped in one place.",
      exportTitle: "Export / import",
      exportHint: "You can keep a backup or move data between devices.",
      exportPrepareLabel: "Prepare export",
      exportImportLabel: "Import JSON",
      exportPlaceholder: "JSON for export or import",
      exportResetLabel: "Reset settings only",
      blocks: {
        today: "Today",
        attention: "Needs attention",
        diary: "Diary",
        mood: "Mood",
        energy: "Energy",
        stress: "Stress",
        noteText: "Short note",
        helped: "What helped",
        blocked: "What got in the way",
        forecast: "Biorhythms",
        numerology: "Numbers",
        transit: "Transit",
        analytics: "Analytics",
        completion: "Completion rate",
        lastDone: "Last completion"
      },
      mobile: {
        today: "Habits",
        attention: "Attention",
        forecast: "Biorhythms",
        numerology: "Numbers",
        transit: "Transit",
        analytics: "Analytics",
        noteText: "Short note"
      },
      grid: {
        color: "Habit color",
        icon: "Habit icon",
        category: "Category",
        type: "Type",
        target: "Goal",
        statusText: "Status icon",
        compactMeta: "Compact metadata",
        completion: "Completion",
        daysSince: "Days since completion",
        noteMarker: "Note marker",
        moodMarker: "Mood marker"
      },
      forecastPlacement: {
        showInToday: "Today",
        showInDiary: "Diary",
        showInInspector: "Right panel",
        showInGrid: "Grid marker"
      },
      forecastScales: {
        physical: "Physical",
        emotional: "Emotional",
        intellectual: "Intellectual"
      },
      numerologyPlacement: {
        showInToday: "Today",
        showInDiary: "Diary",
        showInInspector: "Right panel"
      },
      numerologyMetrics: {
        personalDay: "Personal Day",
        personalMonth: "Personal Month",
        personalYear: "Personal Year",
        lifePath: "Life Path"
      },
      sectionGroups: {
        today: { title: "Today", hint: "Main screen, forecasts, the day’s recommendations, transit and analytics." },
        diary: { title: "Diary", hint: "State, notes and period history." },
        habits: { title: "Habits", hint: "List, archive, streaks and templates." },
        calendar: { title: "Calendar", hint: "What data is visible in the table and mini views." }
      },
      statusDesc: {
        done: "mandatory status",
        current: "Setting up a habit?"
      },
      oneShot: {
        view: "View",
        value: "value"
      }
    } as const;
  }

  return {
    viewTitle: "Вид",
    viewHint: "Пресеты меняют отображение, данные остаются на месте.",
    displayPresetLabel: "Пресет отображения",
    densityLabel: "Плотность",
    startViewLabel: "Стартовый экран",
    focusModeLabel: "Режим фокуса",
    rightPanelLabel: "Правая панель на ПК",
    profileTitle: "Профиль",
    profileHint: "Дата рождения задаётся при регистрации и используется для прогноза и рекомендаций.",
    accountLabel: "Аккаунт",
    birthDateLabel: "Дата рождения",
    statusesTitle: "Статусы",
    statusesHint: "“Выполнено” всегда включено, остальные можно скрыть.",
    calendarTitle: "Календарь",
    calendarHint: "Сколько истории показывать в календаре.",
    historyLabel: "История календаря",
    mobileTitle: "Сегодня на мобильном",
    mobileHint: "Можно скрывать отдельные блоки только в мобильной версии экрана Сегодня.",
    forecastTitle: "Биоритмы",
    forecastHint: "Ориентир для самонаблюдения, без давления и без медицинских обещаний.",
    forecastEnableLabel: "Включить биоритмы",
    forecastDisplayLabel: "Вид",
    forecastBirthHint: "Дата рождения берётся из профиля аккаунта, поэтому здесь её менять не нужно.",
    numerologyTitle: "Цифры",
    numerologyHint: "Числа Personal Day, Personal Month, Personal Year и Life Path считаются по дате рождения и выбранному дню.",
    numerologyEnableLabel: "Включить цифры",
    numerologyDisplayLabel: "Вид",
    presetsTitle: "Мои пресеты",
    presetsHint: "Быстрый старт без пустой формы. Любой шаблон можно изменить перед сохранением.",
    presetInputPlaceholder: "Название пресета",
    presetSaveLabel: "Сохранить",
    presetEmpty: "Пока нет сохранённых пресетов.",
    blocksTitle: "Блоки",
    blocksHint: "Какие данные видны в панели и компактных экранах.",
    navigationTitle: "Навигация",
    navigationHint: "Стартовый экран и режим фокуса настраиваются здесь же.",
    calendarCardTitle: "Календарь",
    calendarCardHint: "Настройки оформления и видимости теперь живут в разделе календаря.",
    diaryCardTitle: "Дневник",
    diaryCardHint: "История, поля и компактность собраны в один блок.",
    exportTitle: "Экспорт / импорт",
    exportHint: "Можно сделать резервную копию или перенести данные между устройствами.",
    exportPrepareLabel: "Подготовить экспорт",
    exportImportLabel: "Импортировать JSON",
    exportPlaceholder: "JSON для экспорта или импорта",
    exportResetLabel: "Сбросить только настройки",
    blocks: {
      today: "Сегодня",
      attention: "Требует внимания",
      diary: "Дневник",
      mood: "Настроение",
      energy: "Энергия",
      stress: "Стресс",
      noteText: "Короткая заметка",
      helped: "Что помогло",
      blocked: "Что мешало",
      forecast: "Биоритмы",
      numerology: "Цифры",
      transit: "Транзит",
      analytics: "Аналитика",
      completion: "Процент выполнения",
      lastDone: "Последнее выполнение"
    },
    mobile: {
      today: "Привычки",
      attention: "Внимание",
      forecast: "Биоритмы",
      numerology: "Цифры",
      transit: "Транзит",
      analytics: "Аналитика",
      noteText: "Короткая заметка"
    },
    grid: {
      color: "Цвет привычки",
      icon: "Иконка привычки",
      category: "Категория",
      type: "Тип",
      target: "Цель",
      statusText: "Иконка статуса",
      compactMeta: "Компактные метки",
      completion: "Процент",
      daysSince: "Дней без выполнения",
      noteMarker: "Маркер заметки",
      moodMarker: "Маркер настроения"
    },
    forecastPlacement: {
      showInToday: "Сегодня",
      showInDiary: "Дневник",
      showInInspector: "Правая панель",
      showInGrid: "Маркер в сетке"
    },
    forecastScales: {
      physical: "Физическая",
      emotional: "Эмоциональная",
      intellectual: "Интеллектуальная"
    },
    numerologyPlacement: {
      showInToday: "Сегодня",
      showInDiary: "Дневник",
      showInInspector: "Правая панель"
    },
    numerologyMetrics: {
      personalDay: "Personal Day",
      personalMonth: "Personal Month",
      personalYear: "Personal Year",
      lifePath: "Life Path"
    },
    sectionGroups: {
      today: { title: "Сегодня", hint: "Главный экран, прогнозы, рекомендации дня, транзит и аналитика." },
      diary: { title: "Дневник", hint: "Состояние, заметка и история по периоду." },
      habits: { title: "Привычки", hint: "Список, архив, серии и шаблоны." },
      calendar: { title: "Календарь", hint: "Какие данные видны в таблице и мини-режимах." }
    },
    statusDesc: {
      done: "обязательный статус",
      current: "Настраиваете привычку?"
    },
    oneShot: {
      view: "Вид",
      value: "значение"
    }
  } as const;
}

export function SettingsView({ state, actions }: { state: AppState; actions: AppActions }) {
  const [presetName, setPresetName] = useState("");
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const language = normalizeLanguage(state.settings.language);
  const text = getSettingsCopy(language);
  const displayPresetOptions = language === "en"
    ? ["Simple", "Balanced", "Journal", "Analytical", "Focus"]
    : ["Простой", "Сбалансированный", "Журнал", "Аналитический", "Фокус"];
  const densityOptions = language === "en"
    ? [
        { value: "compact", label: "Compact" },
        { value: "standard", label: "Standard" },
        { value: "comfortable", label: "Comfortable" }
      ]
    : [
        { value: "compact", label: "Компактная" },
        { value: "standard", label: "Стандартная" },
        { value: "comfortable", label: "Комфортная" }
      ];
  const defaultViewOptions = [
    { value: "today", label: viewText[language].today.label },
    { value: "grid", label: viewText[language].grid.label },
    { value: "habits", label: viewText[language].habits.label },
    { value: "diary", label: viewText[language].diary.label },
    { value: "notifications", label: viewText[language].notifications.label },
    { value: "analytics", label: viewText[language].analytics.label },
    { value: "settings", label: viewText[language].settings.label },
    ...(state.profile?.isAdmin ? [{ value: "management", label: viewText[language].management.label }] : [])
  ];

  return (
    <section className="grid-two">
      <div className="stack">
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.viewTitle}</h3>
              <p className="muted">{text.viewHint}</p>
            </div>
          </div>
          <div className="form-grid">
            <SelectControl label={text.displayPresetLabel} value={state.settings.preset} options={displayPresetOptions} onChange={(value) => actions.applyPreset(value as UserSettings["preset"])} />
            <SelectControl label={text.densityLabel} value={state.settings.density} options={densityOptions} onChange={(value) => actions.updateSetting("density", value as Density)} />
            <SelectControl label={text.startViewLabel} value={state.settings.defaultView} options={defaultViewOptions} onChange={(value) => actions.updateSetting("defaultView", value as View)} />
          </div>
          <Toggle label={text.focusModeLabel} checked={state.settings.focusMode} onChange={(checked) => actions.updateSetting("focusMode", checked)} />
          <Toggle label={text.rightPanelLabel} checked={state.settings.rightPanel} onChange={(checked) => actions.updateSetting("rightPanel", checked)} />
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.profileTitle}</h3>
              <p className="muted">{text.profileHint}</p>
            </div>
          </div>
          <div className="settings-row">
            <span><b>{text.accountLabel}</b></span>
            <span className="badge">{state.profile?.email || (language === "en" ? "Guest" : "Гость")}</span>
          </div>
          <div className="settings-row">
            <span><b>{text.birthDateLabel}</b></span>
            <span className="badge">{state.profile?.birthDate || (language === "en" ? "not set" : "не задана")}</span>
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.statusesTitle}</h3>
              <p className="muted">{text.statusesHint}</p>
            </div>
          </div>
          {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
            <Toggle
              key={status}
              label={`${state.settings.statusIcons[status] || statusMeta[status].short} ${statusText[language][status]}`}
              hint={status === "done" ? text.statusDesc.done : undefined}
              checked={state.settings.activeStatuses.includes(status)}
              disabled={status === "done"}
              onChange={(checked) => actions.toggleStatus(status, checked)}
            />
          ))}
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.calendarTitle}</h3>
              <p className="muted">{text.calendarHint}</p>
            </div>
          </div>
          <div className="form-grid">
            <SelectControl
              label={text.historyLabel}
              value={String(state.settings.calendarHistoryDays)}
              options={["0", "7", "14", "30", "60", "90", "180", "365"]}
              onChange={(value) => actions.updateSetting("calendarHistoryDays", Number(value))}
            />
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.mobileTitle}</h3>
              <p className="muted">{text.mobileHint}</p>
            </div>
          </div>
          <div className="module-toggle-grid">
            {mobileBlockKeys.map((key) => (
              <Toggle
                key={key}
                label={text.mobile[key]}
                checked={state.settings.mobileTodayBlocks[key]}
                onChange={(checked) => actions.updateVisible("mobileTodayBlocks", key, checked)}
              />
            ))}
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.forecastTitle}</h3>
              <p className="muted">{text.forecastHint}</p>
            </div>
          </div>
          <Toggle label={text.forecastEnableLabel} checked={state.settings.forecast.enabled} onChange={(checked) => actions.updateSetting("forecast", { ...state.settings.forecast, enabled: checked })} />
          <div className="form-grid">
            <SelectControl label={text.forecastDisplayLabel} value={state.settings.forecast.displayMode} options={["compact", "cards", "minimal"]} onChange={(value) => actions.updateSetting("forecast", { ...state.settings.forecast, displayMode: value as ForecastDisplayMode })} />
          </div>
          <p className="muted">{text.forecastBirthHint}</p>
          <div className="module-toggle-grid">
            {forecastPlacementKeys.map((key) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.forecast[key]} onChange={(event) => actions.updateSetting("forecast", { ...state.settings.forecast, [key]: event.target.checked })} />
                <span>{text.forecastPlacement[key]}</span>
              </label>
            ))}
          </div>
          <div className="module-toggle-grid">
            {forecastScaleKeys.map((key) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.forecast.visibleScales[key]} onChange={(event) => actions.updateSetting("forecast", { ...state.settings.forecast, visibleScales: { ...state.settings.forecast.visibleScales, [key]: event.target.checked } })} />
                <span>{text.forecastScales[key]}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>{text.numerologyTitle}</h3>
              <p className="muted">{text.numerologyHint}</p>
            </div>
          </div>
          <Toggle label={text.numerologyEnableLabel} checked={state.settings.numerology.enabled} onChange={(checked) => actions.updateSetting("numerology", { ...state.settings.numerology, enabled: checked })} />
          <div className="form-grid">
            <SelectControl label={text.numerologyDisplayLabel} value={state.settings.numerology.displayMode} options={["compact", "cards", "minimal"]} onChange={(value) => actions.updateSetting("numerology", { ...state.settings.numerology, displayMode: value as NumerologyDisplayMode })} />
          </div>
          <div className="module-toggle-grid">
            {numerologyPlacementKeys.map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={state.settings.numerology[key]}
                  onChange={(event) => actions.updateSetting("numerology", { ...state.settings.numerology, [key]: event.target.checked })}
                />
                <span>{text.numerologyPlacement[key]}</span>
              </label>
            ))}
          </div>
          <div className="module-toggle-grid">
            {numerologyMetricKeys.map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={state.settings.numerology.visibleMetrics[key]}
                  onChange={(event) => actions.updateSetting("numerology", {
                    ...state.settings.numerology,
                    visibleMetrics: { ...state.settings.numerology.visibleMetrics, [key]: event.target.checked }
                  })}
                />
                <span>{text.numerologyMetrics[key]}</span>
              </label>
            ))}
          </div>
          <div className="numerology-weight-grid">
            {numerologyMetricKeys.map((key) => (
              <label key={key} className="field numerology-weight-field">
                <span className="picker-label">{text.numerologyMetrics[key]} · {language === "en" ? "weight" : "вес"}</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={state.settings.numerology.weights[key]}
                  onChange={(event) => actions.updateSetting("numerology", {
                    ...state.settings.numerology,
                    weights: { ...state.settings.numerology.weights, [key]: Number(event.target.value) }
                  })}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="panel settings-card">
          <h3>{text.presetsTitle}</h3>
          <div className="toolbar preset-toolbar">
            <input className="input" value={presetName} placeholder={text.presetInputPlaceholder} onChange={(event) => setPresetName(event.target.value)} />
            <button className="btn" onClick={() => { actions.saveCustomPreset(presetName); setPresetName(""); }}>{text.presetSaveLabel}</button>
          </div>
          <div className="chips">
            {Object.keys(state.settings.customPresets).length ? Object.keys(state.settings.customPresets).map((name) => (
              <button key={name} className="chip" onClick={() => actions.applyCustomPreset(name)}>{name}</button>
            )) : <span className="muted">{text.presetEmpty}</span>}
          </div>
        </div>
      </div>
      <div className="stack">
        <div className="panel settings-card">
          <h3>{text.blocksTitle}</h3>
          <div className="settings-section-list">
            {sectionGroups.map((group) => (
              <details key={group.id} className="settings-section-group" open={group.id === "today" || group.id === "diary"}>
                <summary>
                  <span>{text.sectionGroups[group.id].title}</span>
                  <small>{text.sectionGroups[group.id].hint}</small>
                </summary>
                <div className="settings-section-body">
                  {"keys" in group && group.keys ? group.keys.map((key) => (
                    <Toggle key={key} label={text.blocks[key]} checked={state.settings.visibleBlocks[key]} onChange={(checked) => actions.updateVisible("visibleBlocks", key, checked)} />
                  )) : null}
                  {"gridKeys" in group && group.gridKeys ? group.gridKeys.map((key) => (
                    <Toggle key={key} label={text.grid[key]} checked={state.settings.visibleGrid[key]} onChange={(checked) => actions.updateVisible("visibleGrid", key, checked)} />
                  )) : null}
                  {group.id === "habits" ? (
                    <div className="settings-section-note">
                      <p className="muted">{language === "en" ? "The habit list is managed on the <b>Habits</b> screen. Here we keep only the shared display and navigation modes." : "Список привычек управляется на экране <b>Привычки</b>. Здесь остаются только общие режимы отображения и навигации."}</p>
                    </div>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
          <div className="settings-mini-grid">
            <div className="settings-mini-card">
              <b>{text.navigationTitle}</b>
              <span>{text.navigationHint}</span>
            </div>
            <div className="settings-mini-card">
              <b>{text.calendarCardTitle}</b>
              <span>{text.calendarCardHint}</span>
            </div>
            <div className="settings-mini-card">
              <b>{text.diaryCardTitle}</b>
              <span>{text.diaryCardHint}</span>
            </div>
          </div>
          <div className="danger-zone">
            <button className="btn ghost" onClick={actions.resetSettings}>{text.exportResetLabel}</button>
          </div>
        </div>
        <div className="panel settings-card">
          <h3>{text.exportTitle}</h3>
          <div className="toolbar preset-toolbar">
            <button className="btn" onClick={() => setExportText(actions.exportData())}>{text.exportPrepareLabel}</button>
            <button className="btn" onClick={async () => { if (!(await actions.importData(importText))) alert(language === "en" ? "Could not import JSON" : "Не удалось импортировать JSON"); }}>{text.exportImportLabel}</button>
          </div>
          <textarea className="textarea export-box" value={exportText || importText} placeholder={text.exportPlaceholder} onChange={(event) => { setImportText(event.target.value); setExportText(""); }} />
        </div>
      </div>
    </section>
  );
}
