import type { AppActions, AppState, GridDisplayMode, InterfaceTheme, UserSettings } from "../types";
import { themeOptions } from "../lib/defaults";

const gridModes: Array<{ id: GridDisplayMode; icon: string; title: string }> = [
  { id: "calendar", icon: "▦", title: "Календарь" },
  { id: "compact", icon: "●", title: "Компактно" },
  { id: "matrix", icon: "☷", title: "Таблица" },
  { id: "week", icon: "▤", title: "Неделя" },
  { id: "habit", icon: "◉", title: "Привычка" },
  { id: "timeline", icon: "⋯", title: "Лента" },
  { id: "heat", icon: "▥", title: "Heat" }
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
            <span>{gridModes.find((mode) => mode.id === state.settings.gridDisplayMode)?.title}</span>
          </div>
          <div className="grid-icon-row">
            {gridModes.map((mode) => (
              <button
                key={mode.id}
                className={state.settings.gridDisplayMode === mode.id ? "active" : ""}
                title={mode.title}
                onClick={() => actions.updateSetting("gridDisplayMode", mode.id)}
              >
                {mode.icon}
              </button>
            ))}
          </div>
          <div className="grid-icon-row density-icon-row">
            {(["compact", "standard", "comfortable"] as const).map((density) => (
              <button
                key={density}
                className={state.settings.gridDensity === density ? "active" : ""}
                title={`Плотность: ${density}`}
                onClick={() => actions.updateSetting("gridDensity", density)}
              >
                {density === "compact" ? "·" : density === "standard" ? "•" : "●"}
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
