"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { themeOptions } from "../lib/defaults";
import { AppIcon } from "./AppIcons";
import type { InterfaceTheme, UserSettings } from "../types";

type ThemePickerProps = {
  theme: InterfaceTheme;
  onThemeChange: (theme: InterfaceTheme) => void;
  customTheme?: UserSettings["customTheme"];
  onCustomThemeChange?: (theme: UserSettings["customTheme"]) => void;
  className?: string;
  panelClassName?: string;
  gridClassName?: string;
  title?: string;
};

const customThemeLabels: Record<keyof UserSettings["customTheme"], string> = {
  bg: "Фон",
  surface: "Панели",
  text: "Текст",
  accent: "Акцент",
  done: "Выполнено",
  partial: "Частично",
  skipped: "Пропуск",
  missed: "Не выполнено",
  planned: "Запланировано"
};

export function ThemePicker({
  theme,
  onThemeChange,
  customTheme,
  onCustomThemeChange,
  className = "",
  panelClassName = "quick-panel-narrow",
  gridClassName = "",
  title = "Тема"
}: ThemePickerProps) {
  const palette = themeOptions.find((item) => item.id === theme) || themeOptions[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`quick-popover ${open ? "open" : ""} ${className}`.trim()}>
      <button
        className="quick-icon"
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        onPointerDown={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
      >
        <AppIcon name="palette" />
      </button>
      {open ? <div className={`quick-panel ${panelClassName}`.trim()}>
        <div className="quick-panel-head">
          <b>{title}</b>
          <span>{palette.title}</span>
        </div>
        <div className={`theme-dot-grid ${gridClassName}`.trim()}>
          {themeOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`theme-dot ${theme === item.id ? "active" : ""}`}
              title={item.title}
              onClick={() => onThemeChange(item.id as InterfaceTheme)}
            >
              {item.colors.map((color) => <i key={color} style={{ background: color }} />)}
            </button>
          ))}
        </div>
        {theme === "custom" && customTheme && onCustomThemeChange ? (
          <div className="mini-color-grid">
            {(Object.keys(customTheme) as Array<keyof UserSettings["customTheme"]>).map((key) => (
              <label key={key}>
                <span>{customThemeLabels[key]}</span>
                <input
                  type="color"
                  value={customTheme[key]}
                  onChange={(event) => onCustomThemeChange({ ...customTheme, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
        ) : null}
      </div> : null}
    </div>
  );
}
