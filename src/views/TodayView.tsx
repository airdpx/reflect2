import { useEffect, useState } from "react";
import type { AppActions, AppSelectors, AppState, Habit, TodayBlockKey } from "../types";
import { HabitCard } from "../components/HabitCard";
import { habitTemplates } from "../lib/defaults";
import { TodayForecastPanel, TransitPanel } from "../components/Forecast";
import { TodayNumerologyPanel } from "../components/Numerology";
import { normalizeLanguage } from "../lib/i18n";

export function TodayView({
  state,
  selectors,
  actions
}: {
  state: AppState;
  selectors: AppSelectors;
  actions: AppActions;
}) {
  const language = normalizeLanguage(state.settings.language);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth <= 720;
  const dueHabits = selectors.activeHabits.filter((habit) => selectors.isDue(habit, state.selectedDate));
  const attention = selectors.getAttentionHabits();
  const attentionIds = new Set(attention.map(({ habit }) => habit.id));
  const completed = dueHabits.filter((habit) => selectors.getLog(habit.id, state.selectedDate)?.status === "done");
  const open = dueHabits.filter((habit) => selectors.getLog(habit.id, state.selectedDate)?.status !== "done" && !attentionIds.has(habit.id));
  const dueAttention = dueHabits.filter((habit) => attentionIds.has(habit.id) && selectors.getLog(habit.id, state.selectedDate)?.status !== "done");
  const hasHabits = selectors.activeHabits.length > 0;

  const todayLayout = state.settings.todayLayout === "single" ? "single" : "split";
  const mobileBlockVisible = (key: TodayBlockKey) => state.settings.mobileTodayBlocks[key] !== false;
  const isTodayBlockVisible = (key: TodayBlockKey) => state.settings.visibleBlocks[key] && (!isMobile || mobileBlockVisible(key));

  const habitsColumn = (
    <section className="stack">
      <TodayModulesPanel state={state} actions={actions} />
      {hasHabits && isTodayBlockVisible("attention") && <AttentionPanel attention={attention} language={language} />}
      {isTodayBlockVisible("today") && (
        <div className="panel">
          <div className="section-head">
            <div>
              <h3>{language === "en" ? "Habits for the day" : "Привычки на день"}</h3>
              <p className="muted">{language === "en" ? "Quick check-ins without extra steps." : "Быстрая отметка без лишних шагов."}</p>
            </div>
            <div className="section-actions">
              <span className="badge">{completed.length}/{dueHabits.length} {language === "en" ? "done" : "завершено"}</span>
              <button type="button" className="btn ghost" onClick={actions.markDayDone}>{language === "en" ? "All" : "✓ Всё"}</button>
              <button type="button" className="btn ghost" onClick={actions.clearDay}>{language === "en" ? "Clear" : "Очистить"}</button>
              <button type="button" className="btn ghost" onClick={actions.undoLastBulkAction}>{language === "en" ? "Undo" : "↶ Undo"}</button>
            </div>
          </div>
          {hasHabits && dueHabits.length ? (
            <>
              <HabitGroup title={language === "en" ? "Today" : "Сегодня"} habits={open} state={state} selectors={selectors} actions={actions} />
              <HabitGroup title={language === "en" ? "Needs attention" : "Требует внимания"} habits={dueAttention} tone="attention" state={state} selectors={selectors} actions={actions} />
              <HabitGroup title={language === "en" ? "Completed" : "Завершено"} habits={completed} tone="done" state={state} selectors={selectors} actions={actions} />
            </>
          ) : !hasHabits ? (
            <div className="stack">
              <OnboardingIntro actions={actions} language={language} />
              <TemplateChooser actions={actions} language={language} />
            </div>
          ) : (
            <div className="empty action-empty">
              <div>
                <b>{language === "en" ? "Nothing is planned for this day" : "На этот день ничего не запланировано"}</b>
                <span>{language === "en" ? "You can add a habit, choose a template, or open the day diary." : "Можно добавить привычку, выбрать шаблон или перейти к дневнику дня."}</span>
              </div>
              <div className="quick-actions">
                <button type="button" className="btn primary" onClick={() => actions.openHabitModal("new")}>{language === "en" ? "Create habit" : "Создать привычку"}</button>
                <button type="button" className="btn ghost" onClick={() => actions.openHabitTemplate("journal")}>{language === "en" ? "Diary template" : "Шаблон дневника"}</button>
                <button type="button" className="btn ghost" onClick={() => actions.setView("diary")}>{language === "en" ? "Open diary" : "Открыть дневник"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const rightPanels = [];
  if (isTodayBlockVisible("forecast")) rightPanels.push(<TodayForecastPanel key="forecast" state={state} actions={actions} />);
  if (isTodayBlockVisible("numerology")) rightPanels.push(<TodayNumerologyPanel key="numerology" state={state} />);
  if (isTodayBlockVisible("transit")) rightPanels.push(<TransitPanel key="transit" state={state} />);

  if (isMobile) {
    return (
      <div className="stack">
        {rightPanels.length ? <section className="stack observation-column">{rightPanels}</section> : null}
        {habitsColumn}
      </div>
    );
  }

  if (!rightPanels.length || todayLayout === "single") {
    return <div className="stack">{habitsColumn}{rightPanels.length ? <section className="stack observation-column">{rightPanels}</section> : null}</div>;
  }

  return (
    <div className="grid-two">
      {habitsColumn}
      {rightPanels.length ? <section className="stack observation-column">{rightPanels}</section> : null}
    </div>
  );
}

function AttentionPanel({ attention, language }: { attention: ReturnType<AppSelectors["getAttentionHabits"]>; language: "ru" | "en" }) {
  return (
    <div className="panel attention-panel">
      <h3>{language === "en" ? "Needs attention" : "Требует внимания"}</h3>
      {attention.length ? attention.map(({ habit, stats }) => (
        <div className="settings-row" key={habit.id}>
          <span><b>{habit.icon} {habit.title}</b><br /><small className="muted">{stats.daysSince ?? (language === "en" ? "not yet" : "ещё нет")} {language === "en" ? "days without completion" : "дней без выполнения"} · {stats.completion}% {language === "en" ? "for the period" : "за период"}</small></span>
          <span className="badge">{habit.warningThreshold}+ {language === "en" ? "days" : "дней"}</span>
        </div>
      )) : <div className="empty">{language === "en" ? "No soft signals yet." : "Пока нет мягких сигналов."}</div>}
    </div>
  );
}

function TodayModulesPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  return (
    <details className="panel module-panel">
      <summary>{language === "en" ? "Customize Today" : "Настроить экран Сегодня"}</summary>
      <div className="module-controls">
        <div className="icon-choice-row">
          {(["split", "single"] as const).map((layout) => (
            <button
              key={layout}
              className={(state.settings.todayLayout === layout || (layout === "split" && state.settings.todayLayout === "reverse")) ? "active" : ""}
              onClick={() => actions.updateSetting("todayLayout", layout)}
            >
              {layout === "split" ? (language === "en" ? "2 columns" : "2 колонки") : (language === "en" ? "1 column" : "1 колонка")}
            </button>
          ))}
        </div>
        <div className="module-toggle-grid">
          {[
            ["today", language === "en" ? "Habits" : "Привычки"],
            ["forecast", language === "en" ? "Biorhythms" : "Биоритмы"],
            ["numerology", language === "en" ? "Numbers" : "Цифры"],
            ["transit", language === "en" ? "Transit" : "Транзит"],
            ["attention", language === "en" ? "Attention" : "Внимание"],
            ["analytics", language === "en" ? "Analytics" : "Аналитика"]
          ].map(([key, label]) => (
            <label key={key}>
              <input type="checkbox" checked={state.settings.visibleBlocks[key]} onChange={(event) => actions.updateVisible("visibleBlocks", key, event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

function useViewportWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

function OnboardingPanel({ actions, language }: { actions: AppActions; language: "ru" | "en" }) {
  return (
    <section className="stack">
      <OnboardingIntro actions={actions} language={language} />
      <TemplateChooser actions={actions} language={language} />
    </section>
  );
}

function OnboardingIntro({ actions, language }: { actions: AppActions; language: "ru" | "en" }) {
  return (
    <div className="empty action-empty onboarding-inline">
      <div>
        <b>{language === "en" ? "Start with one gentle habit" : "Начните с одной спокойной привычки"}</b>
        <span>{language === "en" ? "Create your own or pick a template, then edit the color, schedule and goal." : "Можно создать свою или взять шаблон, а потом отредактировать цвет, расписание и цель."}</span>
      </div>
      <div className="quick-actions onboarding-actions">
        <button className="btn primary" onClick={() => actions.openHabitModal("new")}>{language === "en" ? "Create habit" : "Создать привычку"}</button>
      </div>
    </div>
  );
}

export function TemplateChooser({ actions, language }: { actions: AppActions; language: "ru" | "en" }) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h3>{language === "en" ? "Habit templates" : "Шаблоны привычек"}</h3>
          <p className="muted">{language === "en" ? "Quick start without an empty form. Any template can be changed before saving." : "Быстрый старт без пустой формы. Любой шаблон можно изменить перед сохранением."}</p>
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
