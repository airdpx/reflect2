import type { AppActions, AppState } from "../types";
import { ThemePicker } from "./ThemePicker";
import { AppIcon } from "./AppIcons";

export function QuickControls({ state, actions }: { state: AppState; actions: AppActions }) {
  return (
    <div className="quick-control-dock">
      <ThemePicker
        className=""
        theme={state.settings.interfaceTheme}
        customTheme={state.settings.customTheme}
        onThemeChange={(theme) => actions.updateSetting("interfaceTheme", theme)}
        onCustomThemeChange={(theme) => actions.updateSetting("customTheme", theme)}
      />
      {state.profile?.isAdmin ? (
        <button className="quick-icon quick-management" onClick={() => actions.setView("management")} title="Управление" aria-label="Управление">
          <AppIcon name="management" />
        </button>
      ) : null}
      {state.profile ? (
        <button className="quick-icon quick-signout" onClick={actions.signOut} title="Выйти из аккаунта" aria-label="Выйти из аккаунта">
          ⎋
        </button>
      ) : null}
    </div>
  );
}
