"use client";

import type { Language } from "../types";
import { languageOptions } from "../lib/i18n";

type LanguagePickerProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  title?: string;
};

export function LanguagePicker({ language, onLanguageChange, title = "Language" }: LanguagePickerProps) {
  const nextLanguage: Language = language === "en" ? "ru" : "en";
  const current = languageOptions.find((item) => item.id === language) || languageOptions[0];
  const next = languageOptions.find((item) => item.id === nextLanguage) || languageOptions[1];

  return (
    <button
      className="quick-icon language-toggle"
      type="button"
      title={`${title}: ${current.title}. Switch to ${next.title}`}
      aria-label={`${title}: ${current.title}`}
      onClick={() => onLanguageChange(nextLanguage)}
    >
      <span>{current.label}</span>
    </button>
  );
}
