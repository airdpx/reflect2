import type { AppActions, AppState } from "../types";
import { ThemePicker } from "./ThemePicker";
import { AppIcon } from "./AppIcons";
import { LanguagePicker } from "./LanguagePicker";
import { commonText, normalizeLanguage, viewText } from "../lib/i18n";

export function QuickControls({ state, actions }: { state: AppState; actions: AppActions }) {
  const language = normalizeLanguage(state.settings.language);
  const common = commonText[language];
  return (
    <div className="quick-control-dock">
      <ThemePicker
        className=""
        theme={state.settings.interfaceTheme}
        customTheme={state.settings.customTheme}
        onThemeChange={(theme) => actions.updateSetting("interfaceTheme", theme)}
        onCustomThemeChange={(theme) => actions.updateSetting("customTheme", theme)}
        title={common.theme}
      />
      <LanguagePicker
        language={language}
        onLanguageChange={(nextLanguage) => actions.updateSetting("language", nextLanguage)}
        title={common.language}
      />
      {state.profile?.isAdmin ? (
        <button className="quick-icon quick-management" onClick={() => actions.setView("management")} title={viewText[language].management.label} aria-label={viewText[language].management.label}>
          <AppIcon name="management" />
        </button>
      ) : null}
      {state.profile ? (
        <button className="quick-icon quick-signout" onClick={actions.signOut} title={common.signOut} aria-label={common.signOut}>
          ⎋
        </button>
      ) : null}
    </div>
  );
}
