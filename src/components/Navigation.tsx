import type { AppState, View } from "../types";
import { formatDate } from "../lib/date";

const baseNavItems: Array<[View, string, string]> = [
  ["today", "Сегодня", "☀️"],
  ["grid", "Календарь", "🗓️"],
  ["habits", "Привычки", "✨"],
  ["diary", "Дневник", "✍️"],
  ["notifications", "Оповещения", "🔔"],
  ["analytics", "Аналитика", "📊"],
  ["settings", "Настройки", "🎛️"]
];

function getNavItems(isAdmin?: boolean) {
  return isAdmin ? [...baseNavItems, ["management", "Управление", "🛠️"] as const] : baseNavItems;
}

export function Sidebar({ state, view, onView }: { state: AppState; view: View; onView: (view: View) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Дневник привычек</h1>
        <p>Самонаблюдение онлайн.</p>
      </div>
      <Nav view={view} onView={onView} className="nav" items={getNavItems(state.profile?.isAdmin)} />
    </aside>
  );
}

export function MobileNav({ state, view, onView }: { state: AppState; view: View; onView: (view: View) => void }) {
  return <Nav view={view} onView={onView} className="mobile-nav" items={getNavItems(state.profile?.isAdmin)} />;
}

function Nav({ view, onView, className, items }: { view: View; onView: (view: View) => void; className: string; items: Array<readonly [View, string, string]> }) {
  return (
    <nav className={className}>
      {items.map(([id, label, icon]) => (
        <button className={view === id ? "active" : ""} key={id} onClick={() => onView(id)} title={label}>
          <b>{icon}</b>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Topbar({
  state,
  onAdd
}: {
  state: AppState;
  onAdd: () => void;
}) {
  const titles: Record<View, [string, string]> = {
    today: ["Сегодня", formatDate(state.selectedDate)],
    grid: ["Календарь", "Периоды, режимы сетки и мягкие статусы"],
    habits: ["Привычки", "Шаблоны, категории, иконки и расписание"],
    diary: ["Дневник", "Настроение, энергия и заметки за день"],
    notifications: ["Оповещения", "Интерфейсные и внешние каналы доставки"],
    analytics: ["Аналитика", "История выполнения и мягкие сигналы"],
    settings: ["Настройки", "Профиль, статусы, прогноз и видимость блоков"],
    management: ["Управление", "Пользователи, экспорт и глобальные настройки"]
  };
  const [title, subtitle] = titles[state.view];
  return (
    <header className="topbar">
      <div className="topbar-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
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
        <button className="btn primary" onClick={onAdd}>
          + Привычка
        </button>
      </div>
    </header>
  );
}
