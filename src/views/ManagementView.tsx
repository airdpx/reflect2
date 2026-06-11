import { useEffect, useMemo, useState } from "react";
import type { AppState, CalendarFilterMode, Density, HabitType, InterfaceTheme, UserSettings, View } from "../types";
import { AppIcon } from "../components/AppIcons";
import { SelectControl, Toggle } from "../components/Common";
import { createDefaults, statusIconPresets, statusMeta, themeOptions } from "../lib/defaults";
import { normalizeLanguage, viewText } from "../lib/i18n";
import { useRuntimeContent } from "../components/RuntimeContent";

type AdminUserRecord = {
  id: string;
  email: string;
  name: string;
  birthDate: string;
  isAdmin: boolean;
  isBlocked: boolean;
  habitsCount: number;
  calendarMarksCount: number;
  createdAt: string;
  updatedAt: string;
};

const gridAppearancePresets = [
  { value: "classic-square", label: "Классика", theme: "classic", shape: "square" },
  { value: "neon-board-square", label: "Неоновая доска", theme: "neonBoard", shape: "square" },
  { value: "week-checks-ring", label: "Чек-лист недели", theme: "weekChecks", shape: "ring" },
  { value: "signal-cards-square", label: "Сигнальные карточки", theme: "signalCards", shape: "square" },
  { value: "compact-square", label: "Компактные плашки", theme: "compact", shape: "square" },
  { value: "ledger-micro", label: "Ledger micro", theme: "micro", shape: "square" },
  { value: "glass-frame", label: "Стеклянная сетка", theme: "glass", shape: "frame" },
  { value: "heatmap-circle", label: "Тепло-акцент", theme: "heatmap", shape: "circle" },
  { value: "hybrid-ring", label: "Гибридное кольцо", theme: "hybrid", shape: "ring" },
  { value: "soft-circle", label: "Мягкий круг", theme: "soft", shape: "circle" },
  { value: "soft-ring", label: "Мягкое кольцо", theme: "soft", shape: "ring" },
  { value: "ledger-square", label: "Ledger Flat", theme: "ledger", shape: "square" },
  { value: "outline-ring", label: "Outline Ring", theme: "outline", shape: "ring" },
  { value: "slate-pill", label: "Slate Pills", theme: "slate", shape: "pill" },
  { value: "calm-frame", label: "Calm Frame", theme: "calm", shape: "frame" },
  { value: "journal-star", label: "Дневник со звездой", theme: "journal", shape: "star" },
  { value: "minimal-hex", label: "Минимум", theme: "minimal", shape: "hex" },
  { value: "minimal-pill", label: "Минимум-пилюля", theme: "minimal", shape: "pill" }
] as const;

const gridVisibleElementOptions = [
  ["color", "Цвет привычки"],
  ["icon", "Иконка привычки"],
  ["category", "Категория"],
  ["type", "Тип"],
  ["target", "Цель"],
  ["statusText", "Иконка статуса"],
  ["compactMeta", "Компактные метки"],
  ["completion", "Процент"],
  ["daysSince", "Дней без выполнения"],
  ["noteMarker", "Маркер заметки"],
  ["moodMarker", "Маркер настроения"]
] as const;
const calendarFilterModes: Array<[CalendarFilterMode, string]> = [
  ["all", "Все привычки"],
  ["avoid", "Не делать"],
  ["nonDaily", "Не каждый день"],
  ["types", "Выбранные типы"]
];
const calendarTypeLabels: Record<"ru" | "en", Record<HabitType, string>> = {
  ru: {
    boolean: "Обычные",
    daily: "Каждый день",
    numeric: "Числовые",
    multiple: "Несколько раз",
    avoid: "Не делать",
    reflection: "Не каждый день"
  },
  en: {
    boolean: "Boolean",
    daily: "Every day",
    numeric: "Numeric",
    multiple: "Multiple",
    avoid: "Avoid",
    reflection: "Non-daily"
  }
};
const secondaryCalendarFilterModes: Array<[CalendarFilterMode, string]> = [
  ["all", "Все привычки"],
  ["avoid", "Не делать"],
  ["nonDaily", "Не каждый день"],
  ["types", "Выбранные типы"]
];
const secondaryCalendarTypeLabels: Record<"ru" | "en", Record<HabitType, string>> = {
  ru: {
    boolean: "Обычные",
    daily: "Каждый день",
    numeric: "Числовые",
    multiple: "Несколько раз",
    avoid: "Не делать",
    reflection: "Не каждый день"
  },
  en: {
    boolean: "Boolean",
    daily: "Every day",
    numeric: "Numeric",
    multiple: "Multiple",
    avoid: "Avoid",
    reflection: "Non-daily"
  }
};

export function ManagementView({ state }: { state: AppState }) {
  const language = normalizeLanguage(state.settings.language);
  return (
    <section className="grid-two management-layout">
      <div className="stack">
        <AdminUsersPanel currentUserId={state.profile?.id || ""} />
        <RuntimeKnowledgePanel />
        <TransitLibraryPanel language={language} />
      </div>
      <div className="stack">
        <GlobalDefaultsPanel currentSettings={state.settings} />
        <TelegramPanel />
        <ResendKeyPanel />
        <ContactFromEmailPanel />
        <SiteContactPanel />
      </div>
    </section>
  );
}

function AdminUsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminUserRecord> & { password?: string }>>({});

  const currentUser = useMemo(() => users.find((user) => user.id === currentUserId) || null, [users, currentUserId]);

  async function loadUsers() {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users", { signal: controller.signal });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить пользователей");
      setUsers(payload.users || []);
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function saveUser(userId: string) {
    const draft = drafts[userId] || {};
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить пользователя");
    setUsers((items) => items.map((item) => (item.id === userId ? { ...item, ...payload.user } : item)));
    setEditingId(null);
  }

  async function saveUserPayload(userId: string, patch: Partial<AdminUserRecord> & { password?: string }) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить пользователя");
    setUsers((items) => items.map((item) => (item.id === userId ? { ...item, ...payload.user } : item)));
    setDrafts((items) => {
      const next = { ...items };
      delete next[userId];
      return next;
    });
  }

  async function removeUser(userId: string) {
    if (!window.confirm("Удалить пользователя и его данные?")) return;
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось удалить пользователя");
    setUsers((items) => items.filter((item) => item.id !== userId));
  }

  async function changeAdminPassword() {
    if (!adminPassword.trim()) return;
    await saveUserPayload(currentUserId, { password: adminPassword });
    setAdminPassword("");
  }

  async function downloadExport(format: "json" | "sql") {
    const response = await fetch(`/api/admin/export?format=${format}`);
    if (!response.ok) throw new Error("Не удалось подготовить экспорт");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = format === "sql" ? "reflect2-users.sql" : "reflect2-users.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel settings-card admin-panel">
      <div className="section-head">
        <div>
          <h3>Управление пользователями</h3>
          <p className="muted">Список аккаунтов, полные email, привычки и отметки в календаре.</p>
        </div>
      </div>
      <div className="toolbar preset-toolbar admin-toolbar">
        <input className="input" type="password" value={adminPassword} placeholder="Новый пароль администратора" onChange={(event) => setAdminPassword(event.target.value)} />
        <button className="btn icon-btn compact-action" onClick={changeAdminPassword} title="Сменить пароль администратора" aria-label="Сменить пароль администратора" data-tooltip="Сменить пароль администратора">
          <AppIcon name="key" />
        </button>
        <button className="btn ghost icon-btn compact-action" onClick={() => void downloadExport("json")} title="Экспорт базы в JSON" aria-label="Экспорт базы в JSON" data-tooltip="Экспорт базы в JSON">
          <AppIcon name="download" />
        </button>
        <button className="btn ghost icon-btn compact-action" onClick={() => void downloadExport("sql")} title="Экспорт базы в SQL" aria-label="Экспорт базы в SQL" data-tooltip="Экспорт базы в SQL">
          <AppIcon name="database" />
        </button>
      </div>
      {loading ? <p className="muted">Загружаю пользователей...</p> : null}
      {error ? <p className="muted">{error}</p> : null}
      <div className="admin-table">
        <div className="admin-table-head">
          <span>Email</span>
          <span>Имя</span>
          <span>Привычки</span>
          <span>Отметки</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>
        {users.map((user) => {
          const editing = editingId === user.id;
          const draft = drafts[user.id] || user;
          const emailValue = String(draft.email || "");
          const nameValue = String(draft.name || "");
          const birthDateValue = String(draft.birthDate || "");
          return (
            <div className="admin-table-row" key={user.id}>
              {editing ? (
                <>
                  <div className="admin-table-cell admin-table-stack">
                    <input className="input admin-table-input" value={emailValue} onChange={(event) => setDrafts((items) => ({ ...items, [user.id]: { ...draft, email: event.target.value } }))} />
                    <input className="input admin-table-input" value={birthDateValue} type="date" onChange={(event) => setDrafts((items) => ({ ...items, [user.id]: { ...draft, birthDate: event.target.value } }))} />
                  </div>
                  <div className="admin-table-cell admin-table-stack">
                    <input className="input admin-table-input" value={nameValue} onChange={(event) => setDrafts((items) => ({ ...items, [user.id]: { ...draft, name: event.target.value } }))} />
                    <small className="muted">{user.isAdmin ? "Администратор" : "Пользователь"}</small>
                  </div>
                </>
              ) : (
                <>
                  <span className="admin-table-cell admin-table-stack admin-email-cell">
                    <b title={user.email}>{user.email}</b>
                    <small className="muted">{user.birthDate}</small>
                  </span>
                  <span className="admin-table-cell admin-table-stack">
                    <b title={user.name}>{user.name}</b>
                    <small className="muted">{user.isAdmin ? "Администратор" : "Пользователь"}</small>
                  </span>
                </>
              )}
              <span className="admin-table-cell">{user.habitsCount}</span>
              <span className="admin-table-cell">{user.calendarMarksCount}</span>
              <span className="admin-table-cell">
                <span className={`badge ${user.isBlocked ? "danger" : ""}`}>{user.isAdmin ? "admin" : user.isBlocked ? "blocked" : "active"}</span>
              </span>
              <div className="admin-table-actions">
                {editing ? (
                  <button className="btn icon-btn compact-action" onClick={() => saveUser(user.id)} title="Сохранить" aria-label="Сохранить" data-tooltip="Сохранить">
                    <AppIcon name="check" />
                  </button>
                ) : (
                  <button className="btn ghost icon-btn compact-action" onClick={() => setEditingId(user.id)} title="Редактировать" aria-label="Редактировать" data-tooltip="Редактировать">
                    <AppIcon name="edit" />
                  </button>
                )}
                <button className="btn ghost icon-btn compact-action" onClick={() => saveUserPayload(user.id, { isBlocked: !user.isBlocked })} title={user.isBlocked ? "Разблокировать" : "Заблокировать"} aria-label={user.isBlocked ? "Разблокировать" : "Заблокировать"} data-tooltip={user.isBlocked ? "Разблокировать" : "Заблокировать"}>
                  <AppIcon name={user.isBlocked ? "lock" : "ban"} />
                </button>
                {user.id !== currentUserId ? (
                  <button className="btn ghost icon-btn compact-action" onClick={() => saveUserPayload(user.id, { isAdmin: !user.isAdmin })} title={user.isAdmin ? "Убрать admin" : "Сделать admin"} aria-label={user.isAdmin ? "Убрать admin" : "Сделать admin"} data-tooltip={user.isAdmin ? "Убрать admin" : "Сделать admin"}>
                    <AppIcon name="user-plus" />
                  </button>
                ) : null}
                {user.id !== currentUserId ? (
                  <button className="btn danger icon-btn compact-action" onClick={() => removeUser(user.id)} title="Удалить" aria-label="Удалить" data-tooltip="Удалить">
                    <AppIcon name="trash" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {!users.length && !loading ? <div className="empty">Пользователи пока не загружены.</div> : null}
      </div>
      {currentUser ? <p className="muted">Текущий администратор: {currentUser.email}</p> : null}
    </div>
  );
}

function GlobalDefaultsPanel({ currentSettings }: { currentSettings: AppState["settings"] }) {
  const [defaults, setDefaults] = useState<UserSettings>(createDefaults().settings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const language = normalizeLanguage(currentSettings.language);
  const defaultViewOptions = [
    { value: "today", label: viewText[language].today.label },
    { value: "grid", label: viewText[language].grid.label },
    { value: "habits", label: viewText[language].habits.label },
    { value: "diary", label: viewText[language].diary.label },
    { value: "notifications", label: viewText[language].notifications.label },
    { value: "analytics", label: viewText[language].analytics.label },
    { value: "settings", label: viewText[language].settings.label },
    { value: "management", label: viewText[language].management.label }
  ];
  const gridThemeOptions = [
    ["classic", "Классика"],
    ["neonBoard", "Неоновая доска"],
    ["weekChecks", "Чек-лист недели"],
    ["signalCards", "Сигнальные карточки"],
    ["soft", "Мягкий"],
    ["minimal", "Мини"],
    ["journal", "Дневник"],
    ["ledger", "Таблица"],
    ["outline", "Контур"],
    ["slate", "Сланец"],
    ["calm", "Нейтральный"],
    ["compact", "Компактные плашки"],
    ["micro", "Ledger micro"],
    ["glass", "Стеклянная сетка"],
    ["heatmap", "Тепло-акцент"],
    ["hybrid", "Гибридное кольцо"]
  ] as const;
  const gridDisplayModeOptions = [
    ["matrix", "Таблица"],
    ["calendar", "Календарь"],
    ["compact", "Мини"],
    ["week", "Неделя"],
    ["habit", "Привычка"],
    ["timeline", "Лента"],
    ["heat", "Тепло"]
  ] as const;
  const gridHabitColorModeOptions = [
    ["habit", "Как привычка"],
    ["muted", "Приглушённые"],
    ["mono", "Моно"],
    ["alternating", "Чередование"]
  ] as const;
  const appearanceValue = gridAppearancePresets.find((preset) => preset.theme === defaults.gridTheme && preset.shape === defaults.gridMarkerShape)?.value || "classic-square";

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/global-defaults")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить глобальные настройки");
        return payload.defaults as Partial<UserSettings>;
      })
      .then((saved) => {
        if (!mounted) return;
        setDefaults({ ...createDefaults().settings, ...saved });
      })
      .catch(() => {
        if (mounted) setDefaults(createDefaults().settings);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function saveDefaults() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/global-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить");
      setMessage("Глобальные настройки сохранены.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  }

  function useCurrentSettings() {
    setDefaults(structuredClone(currentSettings));
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>Глобальные настройки</h3>
          <p className="muted">Применяются для новых пользователей после регистрации.</p>
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn ghost" onClick={useCurrentSettings}>Взять текущие как дефолт</button>
        <button className="btn" onClick={saveDefaults} disabled={loading}>{loading ? "Сохраняю..." : "Сохранить дефолт"}</button>
      </div>
      <div className="form-grid">
        <SelectControl label="Тема" value={defaults.interfaceTheme} options={themeOptions.map((item) => ({ value: item.id, label: item.title }))} onChange={(value) => setDefaults((state) => ({ ...state, interfaceTheme: value as InterfaceTheme }))} />
        <SelectControl
          label={language === "en" ? "Display preset" : "Пресет отображения"}
          value={defaults.preset}
          options={language === "en" ? ["Simple", "Balanced", "Journal", "Analytical", "Focus"] : ["Простой", "Сбалансированный", "Журнал", "Аналитический", "Фокус"]}
          onChange={(value) => setDefaults((state) => ({ ...state, preset: value as UserSettings["preset"] }))}
        />
        <SelectControl
          label={language === "en" ? "Density" : "Плотность"}
          value={defaults.density}
          options={language === "en"
            ? [
                { value: "compact", label: "Compact" },
                { value: "standard", label: "Standard" },
                { value: "comfortable", label: "Comfortable" }
              ]
            : [
                { value: "compact", label: "Компактная" },
                { value: "standard", label: "Стандартная" },
                { value: "comfortable", label: "Комфортная" }
              ]}
          onChange={(value) => setDefaults((state) => ({ ...state, density: value as Density }))}
        />
        <SelectControl label="Стартовый экран" value={defaults.defaultView} options={defaultViewOptions} onChange={(value) => setDefaults((state) => ({ ...state, defaultView: value as View }))} />
      </div>
        <div className="panel settings-card inner-settings-card">
          <div className="section-head">
            <div>
              <h3>Календарь и таблица</h3>
              <p className="muted">Все элементы оформления календаря и таблицы, как в пользовательском разделе.</p>
          </div>
        </div>
        <div className="form-grid">
          <SelectControl label="Оформление таблицы" value={appearanceValue} options={gridAppearancePresets.map(({ value, label }) => ({ value, label }))} onChange={(value) => {
            const preset = gridAppearancePresets.find((item) => item.value === value);
            if (!preset) return;
            setDefaults((state) => ({ ...state, gridTheme: preset.theme as UserSettings["gridTheme"], gridMarkerShape: preset.shape as UserSettings["gridMarkerShape"] }));
          }} />
          <SelectControl label="Режим таблицы" value={defaults.gridDisplayMode} options={gridDisplayModeOptions.map(([value, label]) => ({ value, label }))} onChange={(value) => setDefaults((state) => ({ ...state, gridDisplayMode: value as UserSettings["gridDisplayMode"] }))} />
          <SelectControl label="Цвет привычек" value={defaults.gridHabitColorMode} options={gridHabitColorModeOptions.map(([value, label]) => ({ value, label }))} onChange={(value) => setDefaults((state) => ({ ...state, gridHabitColorMode: value as UserSettings["gridHabitColorMode"] }))} />
          <SelectControl label="Цвета таблицы" value={defaults.gridColors.mode} options={[
            { value: "theme", label: "По теме" },
            { value: "custom", label: "Свои цвета" }
          ]} onChange={(value) => setDefaults((state) => ({ ...state, gridColors: { ...state.gridColors, mode: value as "theme" | "custom" } }))} />
          <SelectControl label="Плотность сетки" value={defaults.gridDensity} options={[
            { value: "compact", label: "Компактная" },
            { value: "standard", label: "Стандартная" },
            { value: "comfortable", label: "Комфортная" }
          ]} onChange={(value) => setDefaults((state) => ({ ...state, gridDensity: value as Density }))} />
          <SelectControl label="Клик по ячейке" value={defaults.gridClickAction} options={[
            { value: "cycle", label: "cycle" },
            { value: "details", label: "details" }
          ]} onChange={(value) => setDefaults((state) => ({ ...state, gridClickAction: value as "cycle" | "details" }))} />
          <SelectControl label="История календаря" value={String(defaults.calendarHistoryDays)} options={[
            { value: "0", label: "0" },
            { value: "7", label: "7" },
            { value: "14", label: "14" },
            { value: "30", label: "30" },
            { value: "60", label: "60" },
            { value: "90", label: "90" },
            { value: "180", label: "180" },
            { value: "365", label: "365" }
          ]} onChange={(value) => setDefaults((state) => ({ ...state, calendarHistoryDays: Number(value) }))} />
          <SelectControl
            label="Фильтр привычек"
            value={defaults.calendarFilterMode}
            options={calendarFilterModes.map(([value, label]) => ({ value, label }))}
            onChange={(value) => setDefaults((state) => ({ ...state, calendarFilterMode: value as CalendarFilterMode }))}
          />
        </div>
        <Toggle label="Показывать выходные" checked={defaults.showWeekends} onChange={(checked) => setDefaults((state) => ({ ...state, showWeekends: checked }))} />
        {defaults.calendarFilterMode === "types" ? (
          <div className="module-toggle-grid type-toggle-grid">
            {(Object.keys(calendarTypeLabels[language]) as HabitType[]).map((type) => (
              <Toggle
                key={type}
                label={calendarTypeLabels[language][type]}
                checked={defaults.calendarFilterTypes[type]}
                onChange={(checked) => setDefaults((state) => ({
                  ...state,
                  calendarFilterTypes: { ...state.calendarFilterTypes, [type]: checked }
                }))}
              />
            ))}
          </div>
        ) : null}
        {defaults.gridColors.mode === "custom" ? (
          <div className="mini-color-grid calendar-color-grid">
            {[
              ["bg", "Фон"],
              ["head", "Шапка"],
              ["cell", "Ячейки"],
              ["today", "Сегодня"],
              ["line", "Линии"],
              ["habitSingle", "Привычки: один цвет"],
              ["habitAltA", "Привычки: цвет A"],
              ["habitAltB", "Привычки: цвет B"]
            ].map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="color"
                  value={defaults.gridColors[key as keyof typeof defaults.gridColors] as string}
                  onChange={(event) => setDefaults((state) => ({ ...state, gridColors: { ...state.gridColors, [key]: event.target.value } }))}
                />
              </label>
            ))}
          </div>
        ) : null}
        <div className="panel settings-card inner-settings-card">
          <div className="section-head">
            <div>
              <h3>Второй календарь</h3>
              <p className="muted">Отдельный блок с собственным фильтром привычек и историей.</p>
            </div>
          </div>
          <Toggle label="Показывать второй календарь" checked={defaults.secondaryCalendar.enabled} onChange={(checked) => setDefaults((state) => ({ ...state, secondaryCalendar: { ...state.secondaryCalendar, enabled: checked } }))} />
          <div className="form-grid">
            <SelectControl
              label="История второго календаря"
              value={String(defaults.secondaryCalendar.historyDays)}
              options={["0", "7", "14", "30", "60", "90", "180", "365"]}
              onChange={(value) => setDefaults((state) => ({ ...state, secondaryCalendar: { ...state.secondaryCalendar, historyDays: Number(value) } }))}
            />
            <SelectControl
              label="Фильтр привычек"
              value={defaults.secondaryCalendar.filterMode}
              options={secondaryCalendarFilterModes.map(([value, label]) => ({ value, label }))}
              onChange={(value) => setDefaults((state) => ({ ...state, secondaryCalendar: { ...state.secondaryCalendar, filterMode: value as CalendarFilterMode } }))}
            />
          </div>
          <Toggle
            label="Показывать выходные"
            checked={defaults.secondaryCalendar.showWeekends}
            onChange={(checked) => setDefaults((state) => ({ ...state, secondaryCalendar: { ...state.secondaryCalendar, showWeekends: checked } }))}
          />
          {defaults.secondaryCalendar.filterMode === "types" ? (
            <div className="module-toggle-grid type-toggle-grid">
              {(Object.keys(secondaryCalendarTypeLabels[language]) as HabitType[]).map((type) => (
                <Toggle
                  key={type}
                  label={secondaryCalendarTypeLabels[language][type]}
                  checked={defaults.secondaryCalendar.selectedTypes[type]}
                  onChange={(checked) => setDefaults((state) => ({
                    ...state,
                    secondaryCalendar: {
                      ...state.secondaryCalendar,
                      selectedTypes: { ...state.secondaryCalendar.selectedTypes, [type]: checked }
                    }
                  }))}
                />
              ))}
            </div>
          ) : null}
        </div>
        <details className="quick-subsection" open>
          <summary>Фильтр и видимость</summary>
          <div className="module-controls">
            <SelectControl
              label="Категория"
              value={defaults.selectedCategory}
              options={[{ value: "all", label: "all" }]}
              onChange={(value) => setDefaults((state) => ({ ...state, selectedCategory: value }))}
            />
            <Toggle label="Показывать выходные" checked={defaults.showWeekends} className="compact-check-row" onChange={(checked) => setDefaults((state) => ({ ...state, showWeekends: checked }))} />
          </div>
        </details>
        <details className="quick-subsection" open>
          <summary>Видимые элементы</summary>
          <div className="module-toggle-grid">
            {gridVisibleElementOptions.map(([key, label]) => (
              <Toggle
                key={key}
                label={label}
                checked={defaults.visibleGrid[key]}
                onChange={(checked) => setDefaults((state) => ({ ...state, visibleGrid: { ...state.visibleGrid, [key]: checked } }))}
              />
            ))}
          </div>
        </details>
        <details className="quick-subsection" open>
          <summary>Иконки отметок</summary>
          <div className="status-icon-grid">
            {(Object.keys(defaults.statusIcons) as (keyof typeof defaults.statusIcons)[]).map((status) => (
              <label key={status}>
                <span>{statusMeta[status].label}</span>
                <input
                  maxLength={4}
                  value={defaults.statusIcons[status]}
                  onChange={(event) => setDefaults((state) => ({ ...state, statusIcons: { ...state.statusIcons, [status]: event.target.value.slice(0, 4) } }))}
                />
                <div className="tiny-preset-row">
                  {statusIconPresets[status].map((icon) => (
                    <button
                      type="button"
                      key={`${status}-${icon}`}
                      className={defaults.statusIcons[status] === icon ? "active" : ""}
                      onClick={() => setDefaults((state) => ({ ...state, statusIcons: { ...state.statusIcons, [status]: icon } }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </label>
            ))}
          </div>
        </details>
      </div>
      <div className="module-toggle-grid">
        <Toggle label="Правая панель" checked={defaults.rightPanel} onChange={(checked) => setDefaults((state) => ({ ...state, rightPanel: checked }))} />
        <Toggle label="Биоритмы" checked={defaults.forecast.enabled} onChange={(checked) => setDefaults((state) => ({ ...state, forecast: { ...state.forecast, enabled: checked } }))} />
        <Toggle label="Оповещения" checked={defaults.notifications.enabled} onChange={(checked) => setDefaults((state) => ({ ...state, notifications: { ...state.notifications, enabled: checked } }))} />
      </div>
      <div className="module-toggle-grid">
        <Toggle label="Сегодня" checked={defaults.visibleBlocks.today} onChange={(checked) => setDefaults((state) => ({ ...state, visibleBlocks: { ...state.visibleBlocks, today: checked } }))} />
        <Toggle label="Дневник" checked={defaults.visibleBlocks.diary} onChange={(checked) => setDefaults((state) => ({ ...state, visibleBlocks: { ...state.visibleBlocks, diary: checked } }))} />
        <Toggle label="Прогноз" checked={defaults.visibleBlocks.forecast} onChange={(checked) => setDefaults((state) => ({ ...state, visibleBlocks: { ...state.visibleBlocks, forecast: checked } }))} />
        <Toggle label="Транзит" checked={defaults.visibleBlocks.transit} onChange={(checked) => setDefaults((state) => ({ ...state, visibleBlocks: { ...state.visibleBlocks, transit: checked } }))} />
      </div>
      <p className="muted">{message || "Можно настроить базовую тему, стартовый экран и важные блоки по умолчанию."}</p>
    </div>
  );
}

function SiteContactPanel() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/site-contact")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить почту контактов");
        return String(payload.email || "");
      })
      .then((saved) => {
        if (mounted) setEmail(saved);
      })
      .catch(() => {
        if (mounted) setEmail("");
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function saveEmail() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/site-contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить email");
      setMessage("Почта для контактов сохранена.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>Получатель формы</h3>
          <p className="muted">Адрес, на который приходят сообщения с формы контактов.</p>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Email получателя</label>
          <input className="input" type="email" value={email} placeholder="support@practway.app" onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn" onClick={saveEmail} disabled={loading}>{loading ? "Сохраняю..." : "Сохранить email"}</button>
      </div>
      <p className="muted">{message || "На странице контактов будет использован именно этот адрес."}</p>
    </div>
  );
}

function RuntimeKnowledgePanel() {
  const { content, setContent } = useRuntimeContent();
  const [draft, setDraft] = useState(() => structuredClone(content));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/runtime-content")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить базу знаний");
        return payload.content;
      })
      .then((saved) => {
        if (!mounted) return;
        setDraft(structuredClone(saved));
      })
      .catch(() => {
        if (mounted) setDraft(structuredClone(content));
      });
    return () => {
      mounted = false;
    };
  }, [content]);

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/runtime-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить базу знаний");
      setDraft(structuredClone(payload.content));
      setContent(structuredClone(payload.content));
      setMessage("Глобальная база знаний сохранена.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить базу знаний");
    } finally {
      setLoading(false);
    }
  }

  function updateForecast(path: Array<string | number>, value: string | number) {
    setDraft((current) => {
      const next = structuredClone(current);
      setDeep(next, ["forecast", ...path], value);
      return next;
    });
  }

  function updateNumerology(path: Array<string | number>, value: string | number) {
    setDraft((current) => {
      const next = structuredClone(current);
      setDeep(next, ["numerology", ...path], value);
      return next;
    });
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>База знаний</h3>
          <p className="muted">Глобальные описания биоритмов, цифр и правил, редактируемые для всей системы.</p>
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn" onClick={save} disabled={loading}>{loading ? "Сохраняю..." : "Сохранить базу знаний"}</button>
      </div>
      <details className="quick-subsection" open>
        <summary>Биоритмы</summary>
        <div className="form-grid">
          {(["low", "steady", "high"] as const).map((tone) => (
            <div className="field" key={tone}>
              <label>{tone}</label>
              <input
                className="input"
                value={draft.forecast.summaryLabels.ru[tone]}
                onChange={(event) => updateForecast(["summaryLabels", "ru", tone], event.target.value)}
              />
              <input
                className="input"
                value={draft.forecast.summaryLabels.en[tone]}
                onChange={(event) => updateForecast(["summaryLabels", "en", tone], event.target.value)}
              />
            </div>
          ))}
          {(["physical", "emotional", "intellectual"] as const).map((scale) => (
            <div className="panel inner-settings-card" key={scale}>
              <div className="field">
                <label>{scale}</label>
                <input className="input" type="number" min="1" max="365" value={draft.forecast.scales[scale].cycle} onChange={(event) => updateForecast(["scales", scale, "cycle"], Number(event.target.value))} />
                <input className="input" value={draft.forecast.scales[scale].label.ru} onChange={(event) => updateForecast(["scales", scale, "label", "ru"], event.target.value)} />
                <input className="input" value={draft.forecast.scales[scale].label.en} onChange={(event) => updateForecast(["scales", scale, "label", "en"], event.target.value)} />
                <textarea className="input" rows={2} value={draft.forecast.scales[scale].note.ru} onChange={(event) => updateForecast(["scales", scale, "note", "ru"], event.target.value)} />
                <textarea className="input" rows={2} value={draft.forecast.scales[scale].note.en} onChange={(event) => updateForecast(["scales", scale, "note", "en"], event.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </details>
      <details className="quick-subsection" open>
        <summary>Цифры</summary>
        <div className="form-grid">
          {(["low", "steady", "high"] as const).map((tone) => (
            <div className="field" key={tone}>
              <label>{tone}</label>
              <input className="input" value={draft.numerology.summaryLabels.ru[tone]} onChange={(event) => updateNumerology(["summaryLabels", "ru", tone], event.target.value)} />
              <input className="input" value={draft.numerology.summaryLabels.en[tone]} onChange={(event) => updateNumerology(["summaryLabels", "en", tone], event.target.value)} />
            </div>
          ))}
          {Object.entries(draft.numerology.metrics).map(([metricId, metric]) => (
            <div className="panel inner-settings-card" key={metricId}>
              <div className="field">
                <label>{metricId}</label>
                <input className="input" value={metric.label.ru} onChange={(event) => updateNumerology(["metrics", metricId, "label", "ru"], event.target.value)} />
                <input className="input" value={metric.label.en} onChange={(event) => updateNumerology(["metrics", metricId, "label", "en"], event.target.value)} />
              </div>
            </div>
          ))}
          {Object.entries(draft.numerology.interpretations)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([value, interpretation]) => (
              <div className="panel inner-settings-card" key={value}>
                <div className="field">
                  <label>{value}</label>
                  <input className="input" value={interpretation.label.ru} onChange={(event) => updateNumerology(["interpretations", value, "label", "ru"], event.target.value)} />
                  <input className="input" value={interpretation.label.en} onChange={(event) => updateNumerology(["interpretations", value, "label", "en"], event.target.value)} />
                  <textarea className="input" rows={2} value={interpretation.note.ru} onChange={(event) => updateNumerology(["interpretations", value, "note", "ru"], event.target.value)} />
                  <textarea className="input" rows={2} value={interpretation.note.en} onChange={(event) => updateNumerology(["interpretations", value, "note", "en"], event.target.value)} />
                  <input className="input" type="number" min="0" max="100" value={interpretation.score} onChange={(event) => updateNumerology(["interpretations", value, "score"], Number(event.target.value))} />
                </div>
              </div>
            ))}
        </div>
        <div className="form-grid">
          {(["low", "steady", "high"] as const).map((tone) => (
            <div className="field" key={`${tone}-rec`}>
              <label>{`${tone} recommendation`}</label>
              <textarea className="input" rows={3} value={draft.numerology.recommendation[tone].ru} onChange={(event) => updateNumerology(["recommendation", tone, "ru"], event.target.value)} />
              <textarea className="input" rows={3} value={draft.numerology.recommendation[tone].en} onChange={(event) => updateNumerology(["recommendation", tone, "en"], event.target.value)} />
            </div>
          ))}
        </div>
      </details>
      <p className="muted">{message || "Эта база используется в прогнозах, цифровой аналитике и уведомлениях."}</p>
    </div>
  );
}

function TransitLibraryPanel({ language }: { language: "ru" | "en" }) {
  type TransitDraft = {
    id: string;
    title: string;
    titleEn: string;
    periodStart: string;
    periodEnd: string;
    listingUrl: string;
    descriptionUrl: string;
    pageNumber: number;
    gateSunNumber: string;
    gateSunName: string;
    gateSunUrl: string;
    gateEarthNumber: string;
    gateEarthName: string;
    gateEarthUrl: string;
    paragraphs: string;
    paragraphsEn: string;
    helped: string;
    helpedEn: string;
    blocked: string;
    blockedEn: string;
    publishedAt: string;
  };

  const [records, setRecords] = useState<TransitDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    void load();
    return () => {
      mounted = false;
    };

    async function load() {
      try {
        const response = await fetch("/api/admin/transits");
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить транзиты");
        if (!mounted) return;
        setRecords((payload.transits || []).map((item: Record<string, unknown>) => ({
          id: String(item.id || ""),
          title: String(item.title || ""),
          titleEn: String(item.titleEn || ""),
          periodStart: String(item.periodStart || ""),
          periodEnd: String(item.periodEnd || ""),
          listingUrl: String(item.listingUrl || ""),
          descriptionUrl: String(item.descriptionUrl || ""),
          pageNumber: Number(item.pageNumber || 0),
          gateSunNumber: String(item.gateSunNumber || ""),
          gateSunName: String(item.gateSunName || ""),
          gateSunUrl: String(item.gateSunUrl || ""),
          gateEarthNumber: String(item.gateEarthNumber || ""),
          gateEarthName: String(item.gateEarthName || ""),
          gateEarthUrl: String(item.gateEarthUrl || ""),
          paragraphs: Array.isArray(item.paragraphs) ? item.paragraphs.join("\n") : "",
          paragraphsEn: Array.isArray(item.paragraphsEn) ? item.paragraphsEn.join("\n") : "",
          helped: Array.isArray(item.helped) ? item.helped.join("\n") : "",
          helpedEn: Array.isArray(item.helpedEn) ? item.helpedEn.join("\n") : "",
          blocked: Array.isArray(item.blocked) ? item.blocked.join("\n") : "",
          blockedEn: Array.isArray(item.blockedEn) ? item.blockedEn.join("\n") : "",
          publishedAt: String(item.publishedAt || "")
        })));
      } catch (error) {
        if (mounted) setMessage(error instanceof Error ? error.message : "Не удалось загрузить транзиты");
      }
    }
  }, []);

  async function syncTransits() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/transits", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось синхронизировать транзиты");
      setMessage(`Импортировано: ${payload.result.importedItems}`);
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось синхронизировать транзиты");
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    const response = await fetch("/api/admin/transits");
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить транзиты");
    setRecords((payload.transits || []).map((item: Record<string, unknown>) => ({
      id: String(item.id || ""),
      title: String(item.title || ""),
      titleEn: String(item.titleEn || ""),
      periodStart: String(item.periodStart || ""),
      periodEnd: String(item.periodEnd || ""),
      listingUrl: String(item.listingUrl || ""),
      descriptionUrl: String(item.descriptionUrl || ""),
      pageNumber: Number(item.pageNumber || 0),
      gateSunNumber: String(item.gateSunNumber || ""),
      gateSunName: String(item.gateSunName || ""),
      gateSunUrl: String(item.gateSunUrl || ""),
      gateEarthNumber: String(item.gateEarthNumber || ""),
      gateEarthName: String(item.gateEarthName || ""),
      gateEarthUrl: String(item.gateEarthUrl || ""),
      paragraphs: Array.isArray(item.paragraphs) ? item.paragraphs.join("\n") : "",
      paragraphsEn: Array.isArray(item.paragraphsEn) ? item.paragraphsEn.join("\n") : "",
      helped: Array.isArray(item.helped) ? item.helped.join("\n") : "",
      helpedEn: Array.isArray(item.helpedEn) ? item.helpedEn.join("\n") : "",
      blocked: Array.isArray(item.blocked) ? item.blocked.join("\n") : "",
      blockedEn: Array.isArray(item.blockedEn) ? item.blockedEn.join("\n") : "",
      publishedAt: String(item.publishedAt || "")
    })));
  }

  async function saveTransit(record: TransitDraft) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/transits/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...record,
          paragraphs: listify(record.paragraphs),
          paragraphsEn: listify(record.paragraphsEn),
          helped: listify(record.helped),
          helpedEn: listify(record.helpedEn),
          blocked: listify(record.blocked),
          blockedEn: listify(record.blockedEn)
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить транзит");
      setMessage("Транзит сохранён.");
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить транзит");
    } finally {
      setLoading(false);
    }
  }

  function updateTransit(id: string, key: keyof TransitDraft, value: string | number) {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, [key]: value } : record));
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>База транзитов</h3>
          <p className="muted">Все транзиты, описания, помогают и мешают — для правок на глобальном уровне.</p>
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn" onClick={syncTransits} disabled={loading}>{loading ? "Синхронизирую..." : "Синхронизировать Humdes"}</button>
      </div>
      <div className="stack">
        {records.map((record) => (
          <details className="panel inner-settings-card" key={record.id}>
            <summary>{(language === "en" ? record.titleEn : record.title) || record.descriptionUrl}</summary>
            <div className="form-grid">
              <div className="field"><label>Title (RU)</label><input className="input" value={record.title} onChange={(event) => updateTransit(record.id, "title", event.target.value)} /></div>
              <div className="field"><label>Title (EN)</label><input className="input" value={record.titleEn} onChange={(event) => updateTransit(record.id, "titleEn", event.target.value)} /></div>
              <div className="field"><label>Start</label><input className="input" type="date" value={record.periodStart} onChange={(event) => updateTransit(record.id, "periodStart", event.target.value)} /></div>
              <div className="field"><label>End</label><input className="input" type="date" value={record.periodEnd} onChange={(event) => updateTransit(record.id, "periodEnd", event.target.value)} /></div>
              <div className="field"><label>Page</label><input className="input" type="number" value={record.pageNumber} onChange={(event) => updateTransit(record.id, "pageNumber", Number(event.target.value))} /></div>
              <div className="field"><label>Sun gate</label><input className="input" value={record.gateSunNumber} onChange={(event) => updateTransit(record.id, "gateSunNumber", event.target.value)} /><input className="input" value={record.gateSunName} onChange={(event) => updateTransit(record.id, "gateSunName", event.target.value)} /><input className="input" value={record.gateSunUrl} onChange={(event) => updateTransit(record.id, "gateSunUrl", event.target.value)} /></div>
              <div className="field"><label>Earth gate</label><input className="input" value={record.gateEarthNumber} onChange={(event) => updateTransit(record.id, "gateEarthNumber", event.target.value)} /><input className="input" value={record.gateEarthName} onChange={(event) => updateTransit(record.id, "gateEarthName", event.target.value)} /><input className="input" value={record.gateEarthUrl} onChange={(event) => updateTransit(record.id, "gateEarthUrl", event.target.value)} /></div>
              <div className="field"><label>Paragraphs (RU)</label><textarea className="input" rows={6} value={record.paragraphs} onChange={(event) => updateTransit(record.id, "paragraphs", event.target.value)} /></div>
              <div className="field"><label>Paragraphs (EN)</label><textarea className="input" rows={6} value={record.paragraphsEn} onChange={(event) => updateTransit(record.id, "paragraphsEn", event.target.value)} /></div>
              <div className="field"><label>Помогают / Helps (RU)</label><textarea className="input" rows={4} value={record.helped} onChange={(event) => updateTransit(record.id, "helped", event.target.value)} /></div>
              <div className="field"><label>Помогают / Helps (EN)</label><textarea className="input" rows={4} value={record.helpedEn} onChange={(event) => updateTransit(record.id, "helpedEn", event.target.value)} /></div>
              <div className="field"><label>Мешают / Hinders (RU)</label><textarea className="input" rows={4} value={record.blocked} onChange={(event) => updateTransit(record.id, "blocked", event.target.value)} /></div>
              <div className="field"><label>Мешают / Hinders (EN)</label><textarea className="input" rows={4} value={record.blockedEn} onChange={(event) => updateTransit(record.id, "blockedEn", event.target.value)} /></div>
              <div className="field"><label>Published</label><input className="input" value={record.publishedAt} onChange={(event) => updateTransit(record.id, "publishedAt", event.target.value)} /></div>
            </div>
            <div className="toolbar preset-toolbar">
              <button className="btn" onClick={() => saveTransit(record)} disabled={loading}>Сохранить</button>
            </div>
          </details>
        ))}
      </div>
      <p className="muted">{message || "Если данных в базе не хватает, здесь можно синхронизировать и поправить описания."}</p>
    </div>
  );
}

function setDeep(target: any, path: Array<string | number>, value: unknown) {
  let current: any = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = String(path[index]);
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[String(path[path.length - 1])] = value;
}

function listify(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function TelegramPanel() {
  const [enabled, setEnabled] = useState(false);
  const [botUsername, setBotUsername] = useState("");
  const [botToken, setBotToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [state, setState] = useState({
    botTokenMasked: "",
    botTokenLast4: "",
    botTokenConfiguredInDb: false,
    botTokenSource: "none" as "db" | "env" | "none",
    webhookSecretMasked: "",
    webhookSecretLast4: "",
    webhookSecretConfiguredInDb: false,
    webhookSecretSource: "none" as "db" | "env" | "none",
    connectedUsersCount: 0,
    linkedUsersCount: 0,
    lastDeliveryAt: null as string | null,
    lastDeliveryStatus: null as string | null,
    lastWebhookStatus: null as string | null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/telegram")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить Telegram");
        return payload.state;
      })
      .then((saved) => {
        if (!mounted) return;
        setEnabled(Boolean(saved.enabled));
        setBotUsername(String(saved.botUsername || ""));
        setState((current) => ({ ...current, ...saved }));
      })
      .catch(() => {
        if (mounted) setState((current) => ({ ...current, lastWebhookStatus: "none" }));
      });
    return () => { mounted = false; };
  }, []);

  async function refresh() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/telegram");
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось проверить Telegram");
      setEnabled(Boolean(payload.state.enabled));
      setBotUsername(String(payload.state.botUsername || ""));
      setState((current) => ({ ...current, ...payload.state }));
      setMessage(`Подключено пользователей: ${payload.state.connectedUsersCount || 0}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось проверить Telegram");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/telegram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          botUsername,
          botToken,
          webhookSecret
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить Telegram");
      setBotToken("");
      setWebhookSecret("");
      setEnabled(Boolean(payload.state.enabled));
      setBotUsername(String(payload.state.botUsername || ""));
      setState((current) => ({ ...current, ...payload.state }));
      if (payload.webhookAttempt?.ok) {
        setMessage(`Telegram настройки сохранены. Webhook установлен: ${payload.webhookAttempt.url}`);
      } else if (payload.webhookAttempt?.error) {
        setMessage(`Telegram настройки сохранены, но webhook не установлен: ${payload.webhookAttempt.error}`);
      } else {
        setMessage("Telegram настройки сохранены.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить Telegram");
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/telegram", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось отключить Telegram");
      setBotToken("");
      setWebhookSecret("");
      setEnabled(false);
      setBotUsername("");
      setState((current) => ({ ...current, ...payload.state }));
      setMessage("Telegram отключён.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отключить Telegram");
    } finally {
      setLoading(false);
    }
  }

  async function setWebhook(action: "set" | "clear") {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось изменить webhook");
      setMessage(action === "set" ? `Webhook установлен: ${payload.url}` : "Webhook удалён.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить webhook");
    } finally {
      setLoading(false);
    }
  }

  async function sendDigest() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/telegram/send", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось отправить Telegram");
      setMessage(`Отправлено: ${payload.result.delivered}, ошибок: ${payload.result.failed}, пропусков: ${payload.result.skipped}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить Telegram");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>Telegram</h3>
          <p className="muted">Один бот для всех пользователей системы. Привязка через /start.</p>
        </div>
      </div>
      <Toggle label="Включить Telegram" checked={enabled} onChange={setEnabled} />
      <div className="form-grid">
        <label className="field">
          <span className="picker-label">Bot username</span>
          <input className="input" value={botUsername} placeholder="botname_bot" onChange={(event) => setBotUsername(event.target.value)} />
        </label>
        <label className="field">
          <span className="picker-label">Bot token</span>
          <input className="input" type="password" value={botToken} placeholder={state.botTokenMasked || "••••••"} onChange={(event) => setBotToken(event.target.value)} />
        </label>
        <label className="field">
          <span className="picker-label">Webhook secret</span>
          <input className="input" type="password" value={webhookSecret} placeholder={state.webhookSecretMasked || "••••••"} onChange={(event) => setWebhookSecret(event.target.value)} />
        </label>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn" onClick={save} disabled={loading}>{loading ? "Сохраняю..." : "Сохранить"}</button>
        <button className="btn ghost" onClick={refresh} disabled={loading}>Проверить</button>
        <button className="btn ghost" onClick={() => void setWebhook("set")} disabled={loading}>Webhook</button>
        <button className="btn ghost" onClick={() => void setWebhook("clear")} disabled={loading}>Снять webhook</button>
        <button className="btn ghost" onClick={sendDigest} disabled={loading}>Отправить тест</button>
        <button className="btn danger" onClick={clear} disabled={loading}>Отключить</button>
      </div>
      <div className="settings-row">
        <span><b>Статус</b><br /><small className="muted">{state.connectedUsersCount} подключено · последнее: {state.lastDeliveryStatus || "—"}</small></span>
        <span className="badge">{state.lastWebhookStatus || "не проверен"}</span>
      </div>
      <p className="muted">
        {message || `Источник bot token: ${state.botTokenSource}. Источник secret: ${state.webhookSecretSource}.`}
      </p>
    </div>
  );
}

function ResendKeyPanel() {
  const [apiKey, setApiKey] = useState("");
  const [state, setState] = useState<{ hasValue: boolean; source: "db" | "env" | "none"; masked: string; last4: string; configuredInDb: boolean }>({
    hasValue: false,
    source: "none",
    masked: "",
    last4: "",
    configuredInDb: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    void loadState();
    return () => {
      mounted = false;
    };

    async function loadState() {
      try {
        const response = await fetch("/api/admin/resend-key");
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить ключ");
        if (!mounted) return;
        setState({
          hasValue: Boolean(payload.hasValue),
          source: (payload.source || "none") as "db" | "env" | "none",
          masked: String(payload.masked || ""),
          last4: String(payload.last4 || ""),
          configuredInDb: Boolean(payload.configuredInDb)
        });
      } catch {
        if (mounted) {
          setState({ hasValue: false, source: "none", masked: "", last4: "", configuredInDb: false });
        }
      }
    }
  }, []);

  async function refreshState() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/resend-key");
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось проверить ключ");
      setState({
        hasValue: Boolean(payload.hasValue),
        source: (payload.source || "none") as "db" | "env" | "none",
        masked: String(payload.masked || ""),
        last4: String(payload.last4 || ""),
        configuredInDb: Boolean(payload.configuredInDb)
      });
      setMessage(payload.source === "db" ? "Ключ задан в базе." : payload.source === "env" ? "Используется ключ из окружения." : "Ключ не задан.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось проверить ключ");
    } finally {
      setLoading(false);
    }
  }

  async function saveKey() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/resend-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить ключ");
      setApiKey("");
      setState({
        hasValue: Boolean(payload.hasValue),
        source: (payload.source || "none") as "db" | "env" | "none",
        masked: String(payload.masked || ""),
        last4: String(payload.last4 || ""),
        configuredInDb: Boolean(payload.configuredInDb)
      });
      setMessage("Resend API key сохранён.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить ключ");
    } finally {
      setLoading(false);
    }
  }

  async function clearKey() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/resend-key", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось очистить ключ");
      setApiKey("");
      setState({
        hasValue: Boolean(payload.hasValue),
        source: (payload.source || "none") as "db" | "env" | "none",
        masked: String(payload.masked || ""),
        last4: String(payload.last4 || ""),
        configuredInDb: Boolean(payload.configuredInDb)
      });
      setMessage("Ключ очищен, теперь будет использован fallback из env, если он задан.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось очистить ключ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>Resend API key</h3>
          <p className="muted">Ключ для отправки формы контактов. Полный секрет не показывается.</p>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>API key</label>
          <input
            className="input"
            type="password"
            value={apiKey}
            placeholder={state.hasValue ? `Сейчас: ${state.masked || "••••"}` : "sk_..."}
            autoComplete="off"
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn" onClick={saveKey} disabled={loading}>{loading ? "Сохраняю..." : "Сохранить"}</button>
        <button className="btn ghost" onClick={clearKey} disabled={loading}>Очистить</button>
        <button className="btn ghost" onClick={refreshState} disabled={loading}>Проверить</button>
      </div>
      <p className="muted">
        {message || `Источник: ${state.source === "db" ? "база" : state.source === "env" ? "окружение" : "не задан"}${state.hasValue && state.last4 ? ` · ****${state.last4}` : ""}`}
      </p>
    </div>
  );
}

function ContactFromEmailPanel() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/contact-from-email")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить email отправителя");
        return String(payload.email || "");
      })
      .then((saved) => {
        if (mounted) setEmail(saved);
      })
      .catch(() => {
        if (mounted) setEmail("");
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function saveEmail() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/contact-from-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось сохранить email");
      setMessage("Contact from email сохранён.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel settings-card">
      <div className="section-head">
        <div>
          <h3>Contact from email</h3>
          <p className="muted">Адрес отправителя для писем через Resend.</p>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>From email</label>
          <input className="input" type="email" value={email} placeholder="mail@your-domain.com" onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <button className="btn" onClick={saveEmail} disabled={loading}>{loading ? "Сохраняю..." : "Сохранить"}</button>
      </div>
      <p className="muted">{message || "Если поле пустое, будет использован env CONTACT_FROM_EMAIL."}</p>
    </div>
  );
}
