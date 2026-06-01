import { useEffect, useMemo, useState } from "react";
import type { AppActions, AppState, Density, ForecastDisplayMode, ForecastScaleId, ForecastSettings, HabitStatus, UserSettings, View } from "../types";
import { SelectControl, Toggle } from "../components/Common";
import { statusMeta } from "../lib/defaults";

const blockLabels: Record<string, string> = {
  today: "Сегодня",
  attention: "Требует внимания",
  diary: "Дневник",
  mood: "Настроение",
  energy: "Энергия",
  stress: "Стресс",
  noteText: "Короткая заметка",
  helped: "Что помогло",
  blocked: "Что мешало",
  forecast: "Биоритмы",
  transit: "Транзит",
  analytics: "Аналитика",
  completion: "Процент выполнения",
  lastDone: "Последнее выполнение"
};

const gridLabels: Record<string, string> = {
  color: "Цвет привычки",
  icon: "Иконка привычки",
  category: "Категория",
  type: "Тип",
  target: "Цель",
  statusText: "Иконка статуса",
  compactMeta: "Компактные метки",
  completion: "Процент",
  daysSince: "Дней без выполнения",
  noteMarker: "Маркер заметки",
  moodMarker: "Маркер настроения"
};

const sectionGroups = [
  {
    title: "Сегодня",
    hint: "Главный экран, прогноз, транзит и аналитика дня.",
    keys: ["today", "forecast", "transit", "attention", "analytics"]
  },
  {
    title: "Дневник",
    hint: "Состояние, заметка и история по периоду.",
    keys: ["diary", "mood", "energy", "stress", "noteText", "helped", "blocked"]
  },
  {
    title: "Привычки",
    hint: "Список, архив, серии и шаблоны."
  },
  {
    title: "Календарь",
    hint: "Какие данные видны в таблице и мини-режимах.",
    gridKeys: ["color", "icon", "category", "type", "target", "statusText", "compactMeta", "completion", "daysSince", "noteMarker", "moodMarker"]
  }
] as const;

const forecastPlacementOptions: Array<[keyof Pick<ForecastSettings, "showInToday" | "showInDiary" | "showInInspector" | "showInGrid">, string]> = [
  ["showInToday", "Сегодня"],
  ["showInDiary", "Дневник"],
  ["showInInspector", "Правая панель"],
  ["showInGrid", "Маркер в сетке"]
];

const forecastScaleOptions: Array<[ForecastScaleId, string]> = [
  ["physical", "Физическая"],
  ["emotional", "Эмоциональная"],
  ["intellectual", "Интеллектуальная"]
];

export function SettingsView({ state, actions }: { state: AppState; actions: AppActions }) {
  const [presetName, setPresetName] = useState("");
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");

  return (
    <section className="grid-two">
      <div className="stack">
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Вид</h3>
              <p className="muted">Пресеты меняют отображение, данные остаются на месте.</p>
            </div>
          </div>
          <div className="form-grid">
            <SelectControl label="Display preset" value={state.settings.preset} options={["Simple", "Balanced", "Journal", "Analytical", "Focus"]} onChange={(value) => actions.applyPreset(value as UserSettings["preset"])} />
            <SelectControl label="Плотность" value={state.settings.density} options={["compact", "standard", "comfortable"]} onChange={(value) => actions.updateSetting("density", value as Density)} />
            <SelectControl label="Стартовый экран" value={state.settings.defaultView} options={["today", "grid", "habits", "diary", "notifications", "analytics", "settings"]} onChange={(value) => actions.updateSetting("defaultView", value as View)} />
          </div>
          <Toggle label="Focus mode" checked={state.settings.focusMode} onChange={(checked) => actions.updateSetting("focusMode", checked)} />
          <Toggle label="Правая панель на ПК" checked={state.settings.rightPanel} onChange={(checked) => actions.updateSetting("rightPanel", checked)} />
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Профиль</h3>
              <p className="muted">Дата рождения задаётся при регистрации и используется для прогноза.</p>
            </div>
          </div>
          <div className="settings-row">
            <span><b>Аккаунт</b></span>
            <span className="badge">{state.profile?.email || "Гость"}</span>
          </div>
          <div className="settings-row">
            <span><b>Дата рождения</b></span>
            <span className="badge">{state.profile?.birthDate || "не задана"}</span>
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Статусы</h3>
              <p className="muted">“Выполнено” всегда включено, остальные можно скрыть.</p>
            </div>
          </div>
          {(Object.keys(statusMeta) as HabitStatus[]).map((status) => (
            <Toggle
              key={status}
              label={`${state.settings.statusIcons[status] || statusMeta[status].short} ${statusMeta[status].label}`}
              hint={status === "done" ? "обязательный статус" : undefined}
              checked={state.settings.activeStatuses.includes(status)}
              disabled={status === "done"}
              onChange={(checked) => actions.toggleStatus(status, checked)}
            />
          ))}
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Календарь</h3>
              <p className="muted">Сколько истории показывать в календаре.</p>
            </div>
          </div>
          <div className="form-grid">
            <SelectControl
              label="История календаря"
              value={String(state.settings.calendarHistoryDays)}
              options={["7", "14", "30", "60", "90", "180", "365"]}
              onChange={(value) => actions.updateSetting("calendarHistoryDays", Number(value))}
            />
          </div>
        </div>
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Биоритмы</h3>
              <p className="muted">Ориентир для самонаблюдения, без давления и без медицинских обещаний.</p>
            </div>
          </div>
          <Toggle label="Включить биоритмы" checked={state.settings.forecast.enabled} onChange={(checked) => actions.updateSetting("forecast", { ...state.settings.forecast, enabled: checked })} />
          <div className="form-grid">
            <SelectControl label="Вид" value={state.settings.forecast.displayMode} options={["compact", "cards", "minimal"]} onChange={(value) => actions.updateSetting("forecast", { ...state.settings.forecast, displayMode: value as ForecastDisplayMode })} />
          </div>
          <p className="muted">Дата рождения берётся из профиля аккаунта, поэтому здесь её менять не нужно.</p>
          <div className="module-toggle-grid">
            {forecastPlacementOptions.map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.forecast[key]} onChange={(event) => actions.updateSetting("forecast", { ...state.settings.forecast, [key]: event.target.checked })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="module-toggle-grid">
            {forecastScaleOptions.map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={state.settings.forecast.visibleScales[key]} onChange={(event) => actions.updateSetting("forecast", { ...state.settings.forecast, visibleScales: { ...state.settings.forecast.visibleScales, [key]: event.target.checked } })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="panel settings-card">
          <h3>Мои пресеты</h3>
          <div className="toolbar preset-toolbar">
            <input className="input" value={presetName} placeholder="Название пресета" onChange={(event) => setPresetName(event.target.value)} />
            <button className="btn" onClick={() => { actions.saveCustomPreset(presetName); setPresetName(""); }}>Сохранить</button>
          </div>
          <div className="chips">
            {Object.keys(state.settings.customPresets).length ? Object.keys(state.settings.customPresets).map((name) => (
              <button key={name} className="chip" onClick={() => actions.applyCustomPreset(name)}>{name}</button>
            )) : <span className="muted">Пока нет сохранённых пресетов.</span>}
          </div>
        </div>
      </div>
      <div className="stack">
        <div className="panel settings-card">
          <h3>Блоки</h3>
          <div className="settings-section-list">
            {sectionGroups.map((group) => (
              <details key={group.title} className="settings-section-group" open={group.title === "Сегодня" || group.title === "Дневник"}>
                <summary>
                  <span>{group.title}</span>
                  <small>{group.hint}</small>
                </summary>
                <div className="settings-section-body">
                  {"keys" in group && group.keys ? group.keys.map((key) => (
                    <Toggle key={key} label={blockLabels[key]} checked={state.settings.visibleBlocks[key]} onChange={(checked) => actions.updateVisible("visibleBlocks", key, checked)} />
                  )) : null}
                  {"gridKeys" in group && group.gridKeys ? group.gridKeys.map((key) => (
                    <Toggle key={key} label={gridLabels[key]} checked={state.settings.visibleGrid[key]} onChange={(checked) => actions.updateVisible("visibleGrid", key, checked)} />
                  )) : null}
                  {group.title === "Привычки" ? (
                    <div className="settings-section-note">
                      <p className="muted">Список привычек управляется на экране <b>Привычки</b>. Здесь остаются только общие режимы отображения и навигации.</p>
                    </div>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
          <div className="settings-mini-grid">
            <div className="settings-mini-card">
              <b>Навигация</b>
              <span>Стартовый экран и режим фокуса настраиваются здесь же.</span>
            </div>
            <div className="settings-mini-card">
              <b>Календарь</b>
              <span>Настройки оформления и видимости теперь живут в разделе календаря.</span>
            </div>
            <div className="settings-mini-card">
              <b>Дневник</b>
              <span>История, поля и компактность собраны в один блок.</span>
            </div>
          </div>
          <div className="danger-zone">
            <button className="btn ghost" onClick={actions.resetSettings}>Сбросить только настройки</button>
          </div>
        </div>
        <div className="panel settings-card">
          <h3>Экспорт / импорт</h3>
          <div className="toolbar preset-toolbar">
            <button className="btn" onClick={() => setExportText(actions.exportData())}>Подготовить экспорт</button>
            <button className="btn" onClick={async () => { if (!(await actions.importData(importText))) alert("Не удалось импортировать JSON"); }}>Импортировать JSON</button>
          </div>
          <textarea className="textarea export-box" value={exportText || importText} placeholder="JSON для экспорта или импорта" onChange={(event) => { setImportText(event.target.value); setExportText(""); }} />
        </div>
        {state.profile?.isAdmin ? <AdminUsersPanel currentUserId={state.profile.id} /> : null}
      </div>
    </section>
  );
}

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

function AdminUsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminUserRecord> & { password?: string }>>({});

  const currentUser = useMemo(() => users.find((user) => user.id === currentUserId) || null, [users, currentUserId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/admin/users", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить пользователей");
        setUsers(payload.users || []);
      })
      .catch((caught) => {
        if ((caught as Error).name !== "AbortError") setError((caught as Error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
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

  async function toggleBlock(user: AdminUserRecord) {
    await saveUserPayload(user.id, { isBlocked: !user.isBlocked });
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

  return (
    <div className="panel settings-card admin-panel">
      <div className="section-head">
        <div>
          <h3>Управление пользователями</h3>
          <p className="muted">Список аккаунтов, привычек и отметок в календаре.</p>
        </div>
      </div>
      <div className="toolbar preset-toolbar">
        <input className="input" type="password" value={adminPassword} placeholder="Новый пароль администратора" onChange={(event) => setAdminPassword(event.target.value)} />
        <button className="btn" onClick={changeAdminPassword}>Сменить пароль админа</button>
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
                  <span className="admin-table-cell admin-table-stack">
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
                <button className="btn ghost" onClick={() => toggleBlock(user)}>{user.isBlocked ? "Разблокировать" : "Заблокировать"}</button>
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
