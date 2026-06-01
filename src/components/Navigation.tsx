import type { AppState, View } from "../types";
import { formatDate, todayKey } from "../lib/date";

const navItems: Array<[View, string, string]> = [
  ["today", "Сегодня", "☀️"],
  ["grid", "Календарь", "🗓️"],
  ["habits", "Привычки", "✨"],
  ["diary", "Дневник", "✍️"],
  ["analytics", "Аналитика", "📊"],
  ["settings", "Настройки", "🎛️"]
];

export function Sidebar({ view, onView }: { view: View; onView: (view: View) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Дневник привычек</h1>
        <p>Самонаблюдение онлайн.</p>
      </div>
      <Nav view={view} onView={onView} className="nav" />
    </aside>
  );
}

export function MobileNav({ view, onView }: { view: View; onView: (view: View) => void }) {
  return <Nav view={view} onView={onView} className="mobile-nav" />;
}

function Nav({ view, onView, className }: { view: View; onView: (view: View) => void; className: string }) {
  return (
    <nav className={className}>
      {navItems.map(([id, label, icon]) => (
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
  onDate,
  onAdd
}: {
  state: AppState;
  onDate: (date: string) => void;
  onAdd: () => void;
}) {
  const titles: Record<View, [string, string]> = {
    today: ["Сегодня", formatDate(state.selectedDate)],
    grid: ["Календарь", "Периоды, режимы сетки и мягкие статусы"],
    habits: ["Привычки", "Шаблоны, категории, иконки и расписание"],
    diary: ["Дневник", "Настроение, энергия и заметки за день"],
    analytics: ["Аналитика", "История выполнения и мягкие сигналы"],
    settings: ["Настройки", "Профиль, статусы, прогноз и видимость блоков"]
  };
  const [title, subtitle] = titles[state.view];
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="toolbar">
        {state.profile ? (
          <div className="user-chip">
            <span className="user-avatar">{(state.profile.name || state.profile.email || "U").slice(0, 1).toUpperCase()}</span>
            <span>
              <small>Профиль</small>
              <b>{state.profile.name || state.profile.email}</b>
            </span>
            <em>{state.profile.birthDate}</em>
          </div>
        ) : null}
        <label className="topbar-date">
          <span>Дата наблюдения</span>
          <input className="input date-input" type="date" value={state.selectedDate} onChange={(event) => onDate(event.target.value || todayKey())} />
        </label>
        <button className="btn primary" onClick={onAdd}>
          + Привычка
        </button>
      </div>
    </header>
  );
}
