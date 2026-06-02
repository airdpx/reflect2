"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { themeOptions } from "../lib/defaults";
import { AppFooter } from "./Footer";
import { ThemePicker } from "./ThemePicker";
import { loadPublicThemeState, savePublicThemeState } from "../lib/public-theme";

type StaticPageShellProps = {
  kicker: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  showFooter?: boolean;
};

export function StaticPageShell({
  kicker,
  title,
  intro,
  children,
  aside,
  className = "",
  showFooter = true
}: StaticPageShellProps) {
  const [themeState, setThemeState] = useState(() => loadPublicThemeState("dark"));
  const theme = themeState.theme;
  const palette = themeOptions.find((item) => item.id === theme) || themeOptions[0];

  useEffect(() => {
    savePublicThemeState({ theme, customTheme: theme === "custom" ? themeState.customTheme : undefined });
  }, [theme, themeState.customTheme]);

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

  return (
    <main className={`static-page theme-${theme} ${className}`.trim()} style={shellStyle}>
      <div className="page-theme-dock">
        <ThemePicker
          className="static-theme-picker"
          panelClassName="quick-panel-narrow"
          gridClassName="static-theme-grid"
          theme={theme}
          customTheme={themeState.customTheme}
          onThemeChange={(nextTheme) => {
            setThemeState((current) => ({ ...current, theme: nextTheme }));
          }}
        />
      </div>
      <div className="static-page-grid">
        <section className="panel static-page-card content-page-main">
          <div className="static-page-hero-copy">
            <span className="static-page-kicker">{kicker}</span>
            <h1>{title}</h1>
            <p className="muted">{intro}</p>
          </div>
          <div className="content-page-body">{children}</div>
        </section>
        {aside ? <aside className="panel static-page-card content-page-aside">{aside}</aside> : null}
      </div>
      {showFooter ? <AppFooter /> : null}
    </main>
  );
}
