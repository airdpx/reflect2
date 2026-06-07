"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "../types";
import { languageOptions } from "../lib/i18n";
import { AppIcon } from "./AppIcons";

type LanguagePickerProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  title?: string;
};

export function LanguagePicker({ language, onLanguageChange, title = "Language" }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = languageOptions.find((item) => item.id === language) || languageOptions[0];

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
    <div ref={rootRef} className={`quick-popover ${open ? "open" : ""} language-popover`}>
      <button
        className="quick-icon language-toggle"
        type="button"
        title={`${title}: ${current.title}`}
        aria-label={`${title}: ${current.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerDown={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <AppIcon name="language" />
        <span>{current.label}</span>
      </button>
      {open ? (
        <div className="quick-panel quick-panel-narrow language-panel">
          <div className="quick-panel-head">
            <b>{title}</b>
            <span>{current.title}</span>
          </div>
          <div className="language-choice-grid" role="menu" aria-label={title}>
            {languageOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={language === option.id}
                className={`language-choice ${language === option.id ? "active" : ""}`}
                title={option.title}
                onClick={() => {
                  if (option.id !== language) onLanguageChange(option.id);
                  setOpen(false);
                }}
              >
                <span className="language-choice-label">{option.label}</span>
                <span className="language-choice-title">{option.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
