import type { ReactNode } from "react";
import type { AppState, View } from "../types";
import { formatDate } from "../lib/date";
import { AppIcon, type AppIconName } from "./AppIcons";
import { commonText, normalizeLanguage, viewText } from "../lib/i18n";

const baseNavItems: Array<[View, AppIconName]> = [
  ["today", "today"],
  ["grid", "calendar"],
  ["habits", "habits"],
  ["diary", "diary"],
  ["notifications", "notifications"],
  ["analytics", "analytics"],
  ["settings", "settings"]
];

function getNavItems(isAdmin?: boolean) {
  return baseNavItems;
}

export function Sidebar({ state, view, onView }: { state: AppState; view: View; onView: (view: View) => void }) {
  const language = normalizeLanguage(state.settings.language);
  const common = commonText[language];
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>{common.brand}</h1>
        <p>{common.brandSubtitle}</p>
      </div>
      <Nav view={view} onView={onView} className="nav" items={getNavItems(state.profile?.isAdmin)} language={language} />
    </aside>
  );
}

export function MobileNav({ state, view, onView }: { state: AppState; view: View; onView: (view: View) => void }) {
  return <Nav view={view} onView={onView} className="mobile-nav" items={getNavItems(state.profile?.isAdmin)} language={normalizeLanguage(state.settings.language)} />;
}

function Nav({ view, onView, className, items, language }: { view: View; onView: (view: View) => void; className: string; items: Array<readonly [View, AppIconName]>; language: ReturnType<typeof normalizeLanguage> }) {
  return (
    <nav className={className}>
      {items.map(([id, icon]) => {
        const label = viewText[language][id].label;
        return (
          <button className={view === id ? "active" : ""} key={id} onClick={() => onView(id)} title={label}>
            <b><AppIcon name={icon} /></b>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function Topbar({
  state,
  onAdd,
  actionsSlot
}: {
  state: AppState;
  onAdd: () => void;
  actionsSlot?: ReactNode;
}) {
  const language = normalizeLanguage(state.settings.language);
  const title = viewText[language][state.view].title;
  const subtitle = state.view === "today" ? formatDate(state.selectedDate) : viewText[language][state.view].subtitle;
  return (
    <header className="topbar">
      <div className="topbar-heading">
        <h2>{title}</h2>
        {subtitle ? <p className={state.view === "today" ? "topbar-date-line" : undefined}>{subtitle}</p> : null}
      </div>
      <div className="toolbar topbar-toolbar">
        {state.profile ? (
          <div className="topbar-chip topbar-profile-chip">
            <span className="user-avatar">{(state.profile.name || state.profile.email || "U").slice(0, 1).toUpperCase()}</span>
            <span className="topbar-chip-copy">
              <b>{state.profile.name || state.profile.email}</b>
              <em>{state.profile.birthDate}</em>
            </span>
          </div>
        ) : null}
        <button className="btn primary topbar-add-slot" onClick={onAdd}>
          {commonText[language].addHabit}
        </button>
        {actionsSlot ? <div className="topbar-actions-slot">{actionsSlot}</div> : null}
      </div>
    </header>
  );
}
