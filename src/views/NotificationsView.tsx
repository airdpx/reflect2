import { useMemo, useState } from "react";
import type { AppActions, AppSelectors, AppState, NotificationDeliveryStatus, NotificationItem, NotificationTopic } from "../types";
import { SelectControl, Toggle } from "../components/Common";
import { buildNotificationFeed, notificationStatusLabel, notificationTone, notificationTopicLabel, resolveNotificationState } from "../lib/notifications";
import { addDays, formatDate, fromKey, toKey } from "../lib/date";

const statusFilters: Array<"all" | NotificationDeliveryStatus> = ["all", "new", "read", "hidden", "snoozed"];

const topicLabels: Array<[NotificationTopic, string]> = [
  ["habits", "Привычки"],
  ["diary", "Дневник"],
  ["forecast", "Биоритмы"],
  ["transit", "Транзит"],
  ["analytics", "Аналитика"],
  ["reminders", "Оповещения"]
];

const channelLabels: Array<[keyof AppState["settings"]["notifications"]["channels"], string, string]> = [
  ["inApp", "В интерфейсе", "Встроенная лента и подсказки внутри приложения"],
  ["browser", "Браузер", "Web Notifications в текущем браузере"],
  ["email", "Email", "Ежедневные и еженедельные письма"],
  ["telegram", "Telegram", "Сообщения через бота"],
  ["push", "Push", "Для будущего мобильного приложения"]
];

export function NotificationsView({ state, selectors, actions }: { state: AppState; selectors: AppSelectors; actions: AppActions }) {
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");
  const feed = useMemo(() => buildNotificationFeed(state, selectors), [state, selectors]);
  const quietNow = isQuietHoursActive(state.settings.notifications.quietHours.start, state.settings.notifications.quietHours.end, state.settings.notifications.quietHours.enabled);
  const visible = feed.filter((item) => {
    const status = resolveNotificationState(state, item).status;
    return filter === "all" ? true : status === filter;
  });
  const unreadCount = feed.filter((item) => resolveNotificationState(state, item).status === "new").length;
  const snoozedCount = feed.filter((item) => resolveNotificationState(state, item).status === "snoozed").length;
  const hiddenCount = feed.filter((item) => resolveNotificationState(state, item).status === "hidden").length;

  return (
    <section className="grid-two notifications-view">
      <div className="stack">
        <div className="panel notifications-feed-panel">
          <div className="section-head">
            <div>
              <h3>Оповещения</h3>
              <p className="muted">Интерфейсные уведомления сейчас, внешние каналы и push-слоты на будущее.</p>
            </div>
            <div className="badge-row">
              <span className="badge">{unreadCount} новых</span>
              <span className="badge">{snoozedCount} отложено</span>
              <span className="badge">{hiddenCount} скрыто</span>
            </div>
          </div>
          <div className="status-preview-strip">
            {statusFilters.map((status) => (
              <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
                {status === "all" ? "Все" : notificationStatusLabel(status)}
              </button>
            ))}
          </div>
          <div className="notification-list">
            {visible.length ? visible.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                actions={actions}
                status={resolveNotificationState(state, item).status}
                snoozedUntil={resolveNotificationState(state, item).snoozedUntil}
                selectedDate={state.selectedDate}
              />
            )) : <div className="empty">Пока нет уведомлений для выбранного фильтра.</div>}
          </div>
        </div>

        <div className="panel notifications-feed-panel">
          <div className="section-head">
            <div>
              <h3>Браузерные уведомления</h3>
              <p className="muted">Проверка permission и тестовый показ прямо в браузере.</p>
            </div>
          </div>
          <BrowserNotificationTools item={visible[0] || feed[0] || null} />
        </div>
      </div>

      <div className="stack">
        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Каналы</h3>
              <p className="muted">Что доставлять и через какие каналы.</p>
            </div>
          </div>
          <Toggle label="Включить систему" checked={state.settings.notifications.enabled} onChange={(checked) => actions.updateSetting("notifications", { ...state.settings.notifications, enabled: checked })} />
          {channelLabels.map(([key, label, hint]) => (
            <Toggle
              key={key}
              label={label}
              hint={hint}
              checked={state.settings.notifications.channels[key]}
              onChange={(checked) => actions.updateSetting("notifications", {
                ...state.settings.notifications,
                channels: { ...state.settings.notifications.channels, [key]: checked }
              })}
            />
          ))}
          <div className="notification-targets">
            <label className="field">
              <span className="picker-label">Email для дайджестов</span>
              <input
                className="input"
                type="email"
                value={state.settings.notifications.emailTarget}
                placeholder={state.profile?.email || "name@example.com"}
                onChange={(event) => actions.updateSetting("notifications", { ...state.settings.notifications, emailTarget: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="picker-label">Telegram chat / username</span>
              <input
                className="input"
                value={state.settings.notifications.telegramTarget}
                placeholder="@username или chat id"
                onChange={(event) => actions.updateSetting("notifications", { ...state.settings.notifications, telegramTarget: event.target.value })}
              />
            </label>
          </div>
          <Toggle
            label="Push для будущего приложения"
            checked={state.settings.notifications.pushReady}
            onChange={(checked) => actions.updateSetting("notifications", { ...state.settings.notifications, pushReady: checked })}
          />
        </div>

        <div className="panel settings-card">
          <div className="section-head">
            <div>
              <h3>Правила</h3>
              <p className="muted">Тихие часы, частота и приоритеты доставки.</p>
            </div>
          </div>
          <div className="settings-row">
            <span><b>Тихие часы сейчас</b><br /><small className="muted">{quietNow ? "активны" : "не активны"}</small></span>
            <span className="badge">{quietNow ? "мягкая пауза" : "доставка открыта"}</span>
          </div>
          <Toggle
            label="Тихие часы"
            checked={state.settings.notifications.quietHours.enabled}
            onChange={(checked) => actions.updateSetting("notifications", {
              ...state.settings.notifications,
              quietHours: { ...state.settings.notifications.quietHours, enabled: checked }
            })}
          />
          <div className="form-grid">
            <SelectControl
              label="Частота"
              value={state.settings.notifications.frequency}
              options={[
                { value: "instant", label: "Сразу" },
                { value: "daily", label: "Ежедневно" },
                { value: "weekly", label: "Еженедельно" }
              ]}
              onChange={(value) => actions.updateSetting("notifications", { ...state.settings.notifications, frequency: value as AppState["settings"]["notifications"]["frequency"] })}
            />
            <SelectControl
              label="Дайджест"
              value={state.settings.notifications.digestTime}
              options={["08:00", "12:00", "18:00", "20:00"]}
              onChange={(value) => actions.updateSetting("notifications", { ...state.settings.notifications, digestTime: value })}
            />
          </div>
          <div className="form-grid">
            <SelectControl
              label="День недели"
              value={String(state.settings.notifications.weeklyDay)}
              options={[
                { value: "1", label: "Пн" },
                { value: "2", label: "Вт" },
                { value: "3", label: "Ср" },
                { value: "4", label: "Чт" },
                { value: "5", label: "Пт" },
                { value: "6", label: "Сб" },
                { value: "7", label: "Вс" }
              ]}
              onChange={(value) => actions.updateSetting("notifications", { ...state.settings.notifications, weeklyDay: Number(value) })}
            />
            <Toggle
              label="Только важное"
              checked={state.settings.notifications.priorityOnly}
              onChange={(checked) => actions.updateSetting("notifications", { ...state.settings.notifications, priorityOnly: checked })}
            />
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="picker-label">Начало тишины</span>
              <input
                className="input"
                type="time"
                value={state.settings.notifications.quietHours.start}
                disabled={!state.settings.notifications.quietHours.enabled}
                onChange={(event) => actions.updateSetting("notifications", {
                  ...state.settings.notifications,
                  quietHours: { ...state.settings.notifications.quietHours, start: event.target.value }
                })}
              />
            </label>
            <label className="field">
              <span className="picker-label">Конец тишины</span>
              <input
                className="input"
                type="time"
                value={state.settings.notifications.quietHours.end}
                disabled={!state.settings.notifications.quietHours.enabled}
                onChange={(event) => actions.updateSetting("notifications", {
                  ...state.settings.notifications,
                  quietHours: { ...state.settings.notifications.quietHours, end: event.target.value }
                })}
              />
            </label>
          </div>
          <div className="module-toggle-grid notification-topics-grid">
            {topicLabels.map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={state.settings.notifications.topics[key]}
                  onChange={(event) => actions.updateSetting("notifications", {
                    ...state.settings.notifications,
                    topics: { ...state.settings.notifications.topics, [key]: event.target.checked }
                  })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationCard({
  item,
  actions,
  status,
  snoozedUntil,
  selectedDate
}: {
  item: NotificationItem;
  actions: AppActions;
  status: NotificationDeliveryStatus;
  snoozedUntil?: string;
  selectedDate: string;
}) {
  const tone = notificationTone(item.priority);
  return (
    <div className={`notification-card tone-${tone} status-${status}`}>
      <div className="notification-card-main">
        <div className="notification-card-head">
          <span className="notification-icon">{item.icon}</span>
          <div>
            <b>{item.title}</b>
            <p>{item.message}</p>
          </div>
        </div>
        <div className="notification-detail">{item.detail}</div>
        <div className="notification-meta">
          <span>{notificationTopicLabel(item.topic)}</span>
          <span>{statusMetaLabel(status)}</span>
          {snoozedUntil ? <span>до {formatDate(snoozedUntil)}</span> : null}
          <span>{item.channels.map((channel) => channelLabel(channel)).join(" · ")}</span>
        </div>
      </div>
      <div className="notification-actions">
        <button className="btn ghost" onClick={() => {
          actions.setView(item.targetView);
          if (item.targetDate) actions.setSelectedDate(item.targetDate);
          actions.setNotificationState(item.id, "read");
        }}>{item.actionLabel}</button>
        <button className="btn ghost" onClick={() => actions.setNotificationState(item.id, "read")}>Прочитано</button>
        <button className="btn ghost" onClick={() => actions.setNotificationState(item.id, "hidden")}>Скрыть</button>
        <button className="btn ghost" onClick={() => actions.setNotificationState(item.id, "snoozed", offsetTomorrowKey(selectedDate))}>На завтра</button>
      </div>
    </div>
  );
}

function BrowserNotificationTools({ item }: { item: NotificationItem | null }) {
  const canUse = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<string>(canUse ? Notification.permission : "unsupported");

  async function requestPermission() {
    if (!canUse) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function sendTest() {
    if (!canUse || permission !== "granted") return;
    const title = item?.title || "Оповещение";
    const body = item?.message || "Тестовое браузерное уведомление.";
    new Notification(title, { body });
  }

  return (
    <div className="notification-browser-card">
      <div className="settings-row">
        <span><b>Permission</b><br /><small className="muted">{permission}</small></span>
        <span className="badge">{canUse ? "доступно" : "недоступно"}</span>
      </div>
      <div className="quick-actions">
        <button className="btn primary" onClick={requestPermission}>Разрешить</button>
        <button className="btn ghost" onClick={sendTest}>Тест</button>
      </div>
      <p className="muted">Если permission запрещён, в приложении останется мягкий интерфейсный центр уведомлений.</p>
    </div>
  );
}

function statusMetaLabel(status: NotificationDeliveryStatus) {
  switch (status) {
    case "new":
      return "Новое";
    case "read":
      return "Прочитано";
    case "hidden":
      return "Скрыто";
    case "snoozed":
      return "Отложено";
  }
}

function channelLabel(channel: NotificationItem["channels"][number]) {
  switch (channel) {
    case "inApp":
      return "Интерфейс";
    case "browser":
      return "Браузер";
    case "email":
      return "Email";
    case "telegram":
      return "Telegram";
    case "push":
      return "Push";
  }
}

function offsetTomorrowKey(date: string) {
  return toKey(addDays(fromKey(date), 1));
}

function isQuietHoursActive(start: string, end: string, enabled: boolean) {
  if (!enabled) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  if (startTotal === endTotal) return false;
  if (startTotal < endTotal) return minutes >= startTotal && minutes < endTotal;
  return minutes >= startTotal || minutes < endTotal;
}
