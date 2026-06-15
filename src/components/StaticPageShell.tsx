"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { themeOptions } from "../lib/defaults";
import { AppFooter } from "./Footer";
import { ThemePicker } from "./ThemePicker";
import { loadPublicThemeState, savePublicThemeState } from "../lib/public-theme";
import { LanguagePicker } from "./LanguagePicker";
import type { Language } from "../types";
import { commonText, normalizeLanguage } from "../lib/i18n";
import { RuntimeTranslator } from "./RuntimeTranslator";

type LocalizedText = string | Record<Language, string>;
type StaticPageShellProps = {
  kicker: LocalizedText;
  title: LocalizedText;
  intro: LocalizedText;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  showFooter?: boolean;
  initialLanguage?: Language;
};

export function StaticPageShell({
  kicker,
  title,
  intro,
  children,
  aside,
  className = "",
  showFooter = true,
  initialLanguage
}: StaticPageShellProps) {
  const [themeState, setThemeState] = useState(() => loadPublicThemeState("dark", initialLanguage));
  const theme = themeState.theme;
  const language = normalizeLanguage(themeState.language);
  const common = commonText[language];
  const palette = themeOptions.find((item) => item.id === theme) || themeOptions[0];

  useEffect(() => {
    savePublicThemeState({ theme, language, customTheme: theme === "custom" ? themeState.customTheme : undefined });
  }, [theme, language, themeState.customTheme]);

  const shellStyle = useMemo(() => ({
    "--page-accent": palette.colors[2],
    "--page-text": palette.colors[3],
    ...(themeState.theme === "custom" && themeState.customTheme ? {
      "--bg": themeState.customTheme.bg,
      "--surface": themeState.customTheme.surface,
      "--surface-soft": themeState.customTheme.surface,
      "--text": themeState.customTheme.text,
      "--accent": themeState.customTheme.accent,
      "--accent-soft": `${themeState.customTheme.accent}24`
    } : {})
  } as React.CSSProperties), [palette, themeState.theme, themeState.customTheme]);
  const localize = (value: LocalizedText) => typeof value === "string" ? value : value[language];

  return (
    <main className={`static-page theme-${theme} ${className}`.trim()} style={shellStyle} data-language={language}>
      <RuntimeTranslator language={language} selector=".static-page" />
      <div className="page-theme-dock">
        <LanguagePicker
          language={language}
          onLanguageChange={(nextLanguage) => setThemeState((current) => ({ ...current, language: nextLanguage }))}
          title={common.language}
        />
        <ThemePicker
          className="static-theme-picker"
          panelClassName="quick-panel-narrow"
          gridClassName="static-theme-grid"
          theme={theme}
          customTheme={themeState.customTheme}
          onThemeChange={(nextTheme) => {
            setThemeState((current) => ({ ...current, theme: nextTheme }));
          }}
          title={common.theme}
          language={language}
        />
      </div>
      <div className="static-page-grid">
        <section className="panel static-page-card content-page-main">
          <div className="static-page-hero-copy">
            <span className="static-page-kicker">{localize(kicker)}</span>
            <h1>{localize(title)}</h1>
            {localize(intro).trim() ? <p className="muted">{localize(intro)}</p> : null}
          </div>
          <div className="content-page-body">{children}</div>
        </section>
        {aside ? <aside className="panel static-page-card content-page-aside">{aside}</aside> : null}
      </div>
      {showFooter ? <AppFooter language={language} /> : null}
    </main>
  );
}
