import type { AppActions, AppState, InterfaceTheme, UserSettings } from "../types";
import { themeOptions } from "../lib/defaults";

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
        <summary className="quick-icon" title="Тема">🎨</summary>
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
    </div>
  );
}
