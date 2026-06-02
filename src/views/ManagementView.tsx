import { useEffect, useMemo, useState } from "react";
import type { AppState, Density, InterfaceTheme, UserSettings, View } from "../types";
import { SelectControl, Toggle } from "../components/Common";
import { createDefaults, themeOptions } from "../lib/defaults";

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

export function ManagementView({ state }: { state: AppState }) {
  return (
    <section className="grid-two">
      <div className="stack">
        <AdminUsersPanel currentUserId={state.profile?.id || ""} />
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
      <div className="toolbar preset-toolbar">
        <input className="input" type="password" value={adminPassword} placeholder="Новый пароль администратора" onChange={(event) => setAdminPassword(event.target.value)} />
        <button className="btn" onClick={changeAdminPassword}>Сменить пароль админа</button>
        <button className="btn ghost" onClick={() => void downloadExport("json")}>JSON</button>
        <button className="btn ghost" onClick={() => void downloadExport("sql")}>SQL</button>
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
                    <b>{user.email}</b>
                    <small className="muted">{user.birthDate}</small>
                  </span>
                  <span className="admin-table-cell admin-table-stack">
                    <b>{user.name}</b>
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
                  <button className="btn" onClick={() => saveUser(user.id)}>Сохранить</button>
                ) : (
                  <button className="btn ghost" onClick={() => setEditingId(user.id)}>Редактировать</button>
                )}
                <button className="btn ghost" onClick={() => saveUserPayload(user.id, { isBlocked: !user.isBlocked })}>{user.isBlocked ? "Разблокировать" : "Заблокировать"}</button>
                {user.id !== currentUserId ? (
                  <button className="btn ghost" onClick={() => saveUserPayload(user.id, { isAdmin: !user.isAdmin })}>
                    {user.isAdmin ? "Убрать admin" : "Сделать admin"}
                  </button>
                ) : null}
                {user.id !== currentUserId ? <button className="btn danger" onClick={() => removeUser(user.id)}>Удалить</button> : null}
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
        <SelectControl label="Тема" value={defaults.interfaceTheme} options={themeOptions.map((item) => item.id)} onChange={(value) => setDefaults((state) => ({ ...state, interfaceTheme: value as InterfaceTheme }))} />
        <SelectControl label="Стартовый экран" value={defaults.defaultView} options={["today", "grid", "habits", "diary", "notifications", "analytics", "settings", "management"]} onChange={(value) => setDefaults((state) => ({ ...state, defaultView: value as View }))} />
        <SelectControl label="Плотность" value={defaults.density} options={["compact", "standard", "comfortable"]} onChange={(value) => setDefaults((state) => ({ ...state, density: value as Density }))} />
        <SelectControl label="Календарь" value={defaults.gridTheme} options={["classic", "soft", "minimal", "journal", "ledger", "outline", "slate", "calm"]} onChange={(value) => setDefaults((state) => ({ ...state, gridTheme: value as UserSettings["gridTheme"] }))} />
        <SelectControl label="Режим таблицы" value={defaults.gridDisplayMode} options={["matrix", "calendar", "compact", "week", "habit", "timeline", "heat"]} onChange={(value) => setDefaults((state) => ({ ...state, gridDisplayMode: value as UserSettings["gridDisplayMode"] }))} />
        <SelectControl label="Цвет привычек" value={defaults.gridHabitColorMode} options={["habit", "muted", "mono", "alternating"]} onChange={(value) => setDefaults((state) => ({ ...state, gridHabitColorMode: value as UserSettings["gridHabitColorMode"] }))} />
        <SelectControl label="История календаря" value={String(defaults.calendarHistoryDays)} options={["0", "7", "14", "30", "60", "90", "180", "365"]} onChange={(value) => setDefaults((state) => ({ ...state, calendarHistoryDays: Number(value) }))} />
      </div>
      <div className="module-toggle-grid">
        <Toggle label="Правая панель" checked={defaults.rightPanel} onChange={(checked) => setDefaults((state) => ({ ...state, rightPanel: checked }))} />
        <Toggle label="Показывать выходные" checked={defaults.showWeekends} onChange={(checked) => setDefaults((state) => ({ ...state, showWeekends: checked }))} />
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
      setState((current) => ({ ...current, ...payload.state }));
      setMessage("Telegram настройки сохранены.");
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
