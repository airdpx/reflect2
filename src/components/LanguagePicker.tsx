"use client";

import type { Language } from "../types";
import { languageOptions } from "../lib/i18n";
import { AppIcon } from "./AppIcons";

type LanguagePickerProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  title?: string;
};

export function LanguagePicker({ language, onLanguageChange, title = "Language" }: LanguagePickerProps) {
  const current = languageOptions.find((item) => item.id === language) || languageOptions[0];
  const next = current.id === "ru" ? languageOptions[1] : languageOptions[0];

  return (
    <button
      className="quick-icon language-toggle language-toggle-inline"
      type="button"
      title={`${title}: ${current.title}. ${next.id === language ? current.title : next.title}`}
      aria-label={`${title}: ${current.title}. ${next.id === language ? current.title : next.title}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onLanguageChange(next.id);
      }}
    >
      <AppIcon name="language" />
      <span>{current.label}</span>
    </button>
  );
}
