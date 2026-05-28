import type { AppActions, AppState, GridDisplayMode, InterfaceTheme, UserSettings } from "../types";
import { themeOptions } from "../lib/defaults";

const gridModes: Array<{ id: GridDisplayMode; icon: string; title: string }> = [
  { id: "calendar", icon: "▦", title: "Календарь" },
  { id: "compact", icon: "▪", title: "Компактно" },
  { id: "matrix", icon: "☷", title: "Таблица" }
];

const customThemeLabels: Record<keyof UserSettings["customTheme"], string> = {
  bg: "Фон",
  surface: "Панели",
  text: "Текст",
  accent: "Акцент",
  done: "Done",
  partial: "Partial",
  skipped: "Skip",
  missed: "Miss",
  planned: "Plan"
};

export function QuickControls({ state, actions }: { state: AppState; actions: AppActions }) {
  return (
    <div className="quick-control-dock">
      <details className="quick-popover">
        <summary className="quick-icon" title="Тема">◐</summary>
        <div className="quick-panel">
          <div className="quick-panel-head">
            <b>Тема</b>
            <span>{themeOptions.find((theme) => theme.id === state.settings.interfaceTheme)?.title || "Custom"}</span>
          </div>
          <div className="theme-dot-grid">
            {themeOptions.map((theme) => (
              <button
                key={theme.id}
                className={`theme-dot ${state.settings.interfaceTheme === theme.id ? "active" : ""}`}
                title={theme.title}
                onClick={() => actions.updateSetting("interfaceTheme", theme.id as InterfaceTheme)}
              >
                {theme.colors.map((color) => <i key={color} style={{ background: color }} />)}
              </button>
            ))}
          </div>
          {state.settings.interfaceTheme === "custom" && (
            <div className="mini-color-grid">
              {(Object.keys(state.settings.customTheme) as Array<keyof UserSettings["customTheme"]>).map((key) => (
                <label key={key}>
                  <span>{customThemeLabels[key]}</span>
                  <input
                    type="color"
                    value={state.settings.customTheme[key]}
                    onChange={(event) => actions.updateSetting("customTheme", { ...state.settings.customTheme, [key]: event.target.value })}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </details>
      <details className="quick-popover">
        <summary className="quick-icon" title="Режим сетки">▣</summary>
        <div className="quick-panel quick-panel-narrow">
          <div className="quick-panel-head">
            <b>Сетка</b>
            <span>переключается сразу</span>
          </div>
          <div className="icon-choice-row">
            {gridModes.map((mode) => (
              <button
                key={mode.id}
                className={state.settings.gridDisplayMode === mode.id ? "active" : ""}
                title={mode.title}
                onClick={() => actions.updateSetting("gridDisplayMode", mode.id)}
              >
                <b>{mode.icon}</b>
                <span>{mode.title}</span>
              </button>
            ))}
          </div>
          <div className="icon-choice-row">
            <button className={state.settings.gridClickAction === "cycle" ? "active" : ""} onClick={() => actions.updateSetting("gridClickAction", "cycle")}>✓ цикл</button>
            <button className={state.settings.gridClickAction === "details" ? "active" : ""} onClick={() => actions.updateSetting("gridClickAction", "details")}>⋯ детали</button>
          </div>
        </div>
      </details>
    </div>
  );
}
