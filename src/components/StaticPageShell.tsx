"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { themeOptions } from "../lib/defaults";
import type { InterfaceTheme } from "../types";
import { AppFooter } from "./Footer";
import { AppIcon } from "./AppIcons";

type StaticPageShellProps = {
  kicker: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  showFooter?: boolean;
};

const STORAGE_KEY = "reflect2_public_theme";

export function StaticPageShell({
  kicker,
  title,
  intro,
  children,
  aside,
  className = "",
  showFooter = true
}: StaticPageShellProps) {
  const [theme, setTheme] = useState<InterfaceTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem(STORAGE_KEY) as InterfaceTheme | null;
    return saved && themeOptions.some((item) => item.id === saved) ? saved : "dark";
  });
  const palette = themeOptions.find((item) => item.id === theme) || themeOptions[0];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const shellStyle = useMemo(() => ({
    "--page-accent": palette.colors[2],
    "--page-text": palette.colors[3]
  } as React.CSSProperties), [palette]);

  return (
    <main className={`static-page theme-${theme} ${className}`.trim()} style={shellStyle}>
      <div className="page-theme-dock">
        <details className="quick-popover">
          <summary className="quick-icon" title="Тема"><AppIcon name="settings" /></summary>
          <div className="quick-panel quick-panel-narrow">
            <div className="quick-panel-head">
              <b>Тема</b>
              <span>{palette.title}</span>
            </div>
            <div className="theme-dot-grid static-theme-grid">
              {themeOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-dot ${theme === item.id ? "active" : ""}`}
                  title={item.title}
                  onClick={() => setTheme(item.id as InterfaceTheme)}
                >
                  {item.colors.map((color) => <i key={color} style={{ background: color }} />)}
                </button>
              ))}
            </div>
          </div>
        </details>
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
