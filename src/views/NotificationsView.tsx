import { useEffect, useMemo, useState } from "react";
import type { AppActions, AppSelectors, AppState, TelegramConnectionStatus, NotificationDeliveryStatus, NotificationItem, NotificationTopic } from "../types";
import { SelectControl, Toggle } from "../components/Common";
import { buildNotificationFeed, notificationStatusLabel, notificationTone, notificationTopicLabel, resolveNotificationState } from "../lib/notifications";
import { addDays, formatDate, fromKey, toKey } from "../lib/date";
import { normalizeLanguage } from "../lib/i18n";

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
  const language = normalizeLanguage(state.settings.language);
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");
  const [telegramStatus, setTelegramStatus] = useState<TelegramConnectionStatus | null>(null);
  const [telegramMessage, setTelegramMessage] = useState("");
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramConnectUrl, setTelegramConnectUrl] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testingKey, setTestingKey] = useState("");
  const feed = useMemo(() => buildNotificationFeed(state, selectors), [state, selectors]);
  const quietNow = isQuietHoursActive(state.settings.notifications.quietHours.start, state.settings.notifications.quietHours.end, state.settings.notifications.quietHours.enabled);
  const visible = feed.filter((item) => {
    const status = resolveNotificationState(state, item).status;
    return filter === "all" ? true : status === filter;
  });
  const unreadCount = feed.filter((item) => resolveNotificationState(state, item).status === "new").length;
  const snoozedCount = feed.filter((item) => resolveNotificationState(state, item).status === "snoozed").length;
  const hiddenCount = feed.filter((item) => resolveNotificationState(state, item).status === "hidden").length;

  useEffect(() => {
    let mounted = true;
    fetch("/api/telegram/me")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось загрузить Telegram");
        return payload as TelegramConnectionStatus;
      })
      .then((payload) => {
        if (mounted) setTelegramStatus(payload);
      })
      .catch(() => {
        if (mounted) setTelegramStatus(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function connectTelegram() {
    setTelegramBusy(true);
    setTelegramMessage("");
    try {
      const response = await fetch("/api/telegram/connect-link");
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось создать ссылку");
      if (payload.connectUrl) {
        window.open(payload.connectUrl, "_blank", "noopener,noreferrer");
      }
      setTelegramConnectUrl(String(payload.connectUrl || ""));
      setTelegramMessage(language === "en"
        ? "Open the link or press the button below, then tap Start in Telegram."
        : "Откройте ссылку или нажмите кнопку ниже, затем в Telegram нажмите Start.");
      setTelegramStatus((current) => ({
        connected: Boolean(payload.connected),
        botUsername: payload.botUsername || current?.botUsername || "",
        chatId: current?.chatId || null,
        username: current?.username || null,
        linkedAt: current?.linkedAt || null,
        revokedAt: current?.revokedAt || null,
        connectUrl: payload.connectUrl || null
      }));
    } catch (error) {
      setTelegramMessage(error instanceof Error ? error.message : "Не удалось подключить Telegram");
    } finally {
      setTelegramBusy(false);
    }
  }

  async function disconnectTelegram() {
    setTelegramBusy(true);
    setTelegramMessage("");
    setTelegramConnectUrl("");
    try {
      const response = await fetch("/api/telegram/disconnect", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Не удалось отключить Telegram");
      setTelegramStatus((current) => current ? { ...current, connected: false, revokedAt: new Date().toISOString() } : null);
      setTelegramMessage(language === "en" ? "Telegram disconnected." : "Telegram отключён.");
    } catch (error) {
      setTelegramMessage(error instanceof Error ? error.message : "Не удалось отключить Telegram");
    } finally {
      setTelegramBusy(false);
    }
  }

  async function sendServerTest(item: NotificationItem, channel: "telegram" | "email") {
    const key = `${channel}:${item.id}`;
    setTestingKey(key);
    setTestMessage("");
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id, topic: item.topic, channel })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) throw new Error(payload.error || (language === "en" ? "Test delivery failed" : "Тестовая отправка не удалась"));
      const status = payload.result?.status || "sent";
      setTestMessage(language === "en" ? `Test ${channel}: ${status}` : `Тест ${channel}: ${status}`);
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : (language === "en" ? "Test delivery failed" : "Тестовая отправка не удалась"));
    } finally {
      setTestingKey("");
    }
  }

  return (
    <section className="grid-two notifications-view">
      <div className="stack">
        <div className="panel notifications-feed-panel">
          <div className="section-head">
            <div>
              <h3>{language === "en" ? "Alerts" : "Оповещения"}</h3>
              <p className="muted">{language === "en"
                ? "In-app alerts now, external channels and push slots for the future."
                : "Интерфейсные уведомления сейчас, внешние каналы и push-слоты на будущее."}</p>
            </div>
            <div className="badge-row">
              <span className="badge">{unreadCount} {language === "en" ? "new" : "новых"}</span>
              <span className="badge">{snoozedCount} {language === "en" ? "snoozed" : "отложено"}</span>
              <span className="badge">{hiddenCount} {language === "en" ? "hidden" : "скрыто"}</span>
            </div>
          </div>
          <div className="status-preview-strip">
            {statusFilters.map((status) => (
              <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
                {status === "all" ? (language === "en" ? "All" : "Все") : notificationStatusLabel(status, language)}
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
                language={language}
                onTest={sendServerTest}
                testingKey={testingKey}
              />
            )) : <div className="empty">{language === "en" ? "No notifications for the selected filter yet." : "Пока нет уведомлений для выбранного фильтра."}</div>}
          </div>
          {testMessage ? <p className="muted notification-test-message">{testMessage}</p> : null}
        </div>

        <div className="panel notifications-feed-panel">
          <div className="section-head">
            <div>
              <h3>{language === "en" ? "Browser notifications" : "Браузерные уведомления"}</h3>
              <p className="muted">{language === "en" ? "Check permission and trigger a browser test right here." : "Проверка permission и тестовый показ прямо в браузере."}</p>
            </div>
          </div>
          <BrowserNotificationTools item={visible[0] || feed[0] || null} language={language} />
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
            <div className="field">
              <span className="picker-label">Telegram</span>
              <div className="settings-row telegram-connection-row">
                <span>
                  <b>{telegramStatus?.connected ? (language === "en" ? "Connected" : "Подключён") : (language === "en" ? "Not connected" : "Не подключён")}</b><br />
                  <small className="muted">{telegramStatus?.botUsername ? `@${telegramStatus.botUsername}` : (language === "en" ? "One bot for all users" : "Один бот для всех пользователей")}</small>
                </span>
                <span className="badge">{telegramStatus?.username ? `@${telegramStatus.username}` : telegramStatus?.chatId ? telegramStatus.chatId : "—"}</span>
              </div>
              <div className="quick-actions">
                <button className={telegramStatus?.connected ? "btn ghost" : "btn primary"} onClick={() => void connectTelegram()} disabled={telegramBusy}>
                  {telegramBusy ? (language === "en" ? "Preparing link..." : "Готовлю ссылку...") : telegramStatus?.connected ? (language === "en" ? "Get link" : "Получить ссылку") : (language === "en" ? "Connect Telegram" : "Подключить Telegram")}
                </button>
                {telegramStatus?.connected ? <button className="btn ghost" onClick={() => void disconnectTelegram()} disabled={telegramBusy}>{language === "en" ? "Disconnect Telegram" : "Отключить Telegram"}</button> : null}
              </div>
              {telegramConnectUrl ? (
                <div className="telegram-connect-link">
                  <small className="muted">{language === "en" ? "Full connect link" : "Полная ссылка подключения"}</small>
                  <a href={telegramConnectUrl} target="_blank" rel="noreferrer">{telegramConnectUrl}</a>
                  <div className="toolbar">
                    <button
                      className="btn ghost"
                      onClick={() => navigator.clipboard.writeText(telegramConnectUrl).catch(() => undefined)}
                      type="button"
                    >
                      {language === "en" ? "Copy link" : "Копировать ссылку"}
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => window.open(telegramConnectUrl, "_blank", "noopener,noreferrer")}
                      type="button"
                    >
                      {language === "en" ? "Open again" : "Открыть ещё раз"}
                    </button>
                  </div>
                </div>
              ) : null}
              {telegramMessage ? <p className="muted">{telegramMessage}</p> : null}
            </div>
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
            <label className="field">
              <span className="picker-label">Дайджест</span>
              <input
                className="input"
                type="time"
                value={state.settings.notifications.digestTime}
                onChange={(event) => actions.updateSetting("notifications", { ...state.settings.notifications, digestTime: event.target.value })}
              />
            </label>
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
            <div className="notification-topics-header">
              <h4>{language === "en" ? "Digest tasks" : "Задачи дайджеста"}</h4>
              <p className="muted">{language === "en" ? "Tick the items that should be included in scheduled sends." : "Отметьте задачи, которые нужно включать в запланированную отправку."}</p>
            </div>
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
  selectedDate,
  language,
  onTest,
  testingKey
}: {
  item: NotificationItem;
  actions: AppActions;
  status: NotificationDeliveryStatus;
  snoozedUntil?: string;
  selectedDate: string;
  language: "ru" | "en";
  onTest: (item: NotificationItem, channel: "telegram" | "email") => Promise<void>;
  testingKey: string;
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
          <span>{notificationTopicLabel(item.topic, language)}</span>
          <span>{statusMetaLabel(status, language)}</span>
          {snoozedUntil ? <span>{language === "en" ? "until" : "до"} {formatDate(snoozedUntil)}</span> : null}
          <span>{item.channels.map((channel) => channelLabel(channel, language)).join(" · ")}</span>
        </div>
      </div>
      <div className="notification-actions">
        <button className="btn ghost" onClick={() => {
          actions.setView(item.targetView);
          if (item.targetDate) actions.setSelectedDate(item.targetDate);
          actions.setNotificationState(item.id, "read");
        }}>{item.actionLabel}</button>
        <button className="btn ghost" onClick={() => actions.setNotificationState(item.id, "read")}>{language === "en" ? "Read" : "Прочитано"}</button>
        <button className="btn ghost" onClick={() => actions.setNotificationState(item.id, "hidden")}>{language === "en" ? "Hide" : "Скрыть"}</button>
        <button className="btn ghost" onClick={() => actions.setNotificationState(item.id, "snoozed", offsetTomorrowKey(selectedDate))}>{language === "en" ? "Tomorrow" : "На завтра"}</button>
        {item.channels.includes("telegram") ? (
          <button className="btn ghost" onClick={() => void onTest(item, "telegram")} disabled={testingKey === `telegram:${item.id}`}>
            {testingKey === `telegram:${item.id}` ? (language === "en" ? "Sending..." : "Отправка...") : (language === "en" ? "Test Telegram" : "Тест Telegram")}
          </button>
        ) : null}
        {item.channels.includes("email") ? (
          <button className="btn ghost" onClick={() => void onTest(item, "email")} disabled={testingKey === `email:${item.id}`}>
            {testingKey === `email:${item.id}` ? (language === "en" ? "Sending..." : "Отправка...") : (language === "en" ? "Test Email" : "Тест Email")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BrowserNotificationTools({ item, language }: { item: NotificationItem | null; language: "ru" | "en" }) {
  const canUse = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<string>(canUse ? Notification.permission : "unsupported");
  const [browserMessage, setBrowserMessage] = useState("");

  async function requestPermission() {
    if (!canUse) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    setBrowserMessage(result === "granted"
      ? (language === "en" ? "Browser notifications are allowed." : "Браузерные уведомления разрешены.")
      : result === "denied"
        ? (language === "en" ? "Permission denied in the browser." : "Разрешение отклонено в браузере.")
        : "");
  }

  async function sendTest() {
    if (!canUse) {
      setBrowserMessage(language === "en" ? "Browser notifications are unavailable here." : "Браузерные уведомления здесь недоступны.");
      return;
    }
    if (permission !== "granted") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setBrowserMessage(language === "en"
          ? "Allow browser notifications first, then test again."
          : "Сначала разрешите браузерные уведомления, затем повторите тест.");
        return;
      }
    }
    const title = item?.title || (language === "en" ? "Notification" : "Оповещение");
    const body = item?.message || (language === "en" ? "Test browser notification." : "Тестовое браузерное уведомление.");
    new Notification(title, { body });
    setBrowserMessage(language === "en" ? "Test notification sent in the browser." : "Тестовое уведомление показано в браузере.");
  }

  return (
    <div className="notification-browser-card">
      <div className="settings-row">
        <span><b>{language === "en" ? "Permission" : "Разрешение"}</b><br /><small className="muted">{permission}</small></span>
        <span className="badge">{canUse ? (language === "en" ? "available" : "доступно") : (language === "en" ? "unavailable" : "недоступно")}</span>
      </div>
      <div className="quick-actions">
        <button className="btn primary" onClick={requestPermission}>{language === "en" ? "Allow" : "Разрешить"}</button>
        <button className="btn ghost" onClick={() => void sendTest()}>{language === "en" ? "Test" : "Тест"}</button>
      </div>
      <p className="muted">{language === "en" ? "If permission is denied, the app still keeps a soft in-app notification center." : "Если permission запрещён, в приложении останется мягкий интерфейсный центр уведомлений."}</p>
      {browserMessage ? <p className="muted notification-test-message">{browserMessage}</p> : null}
    </div>
  );
}

function statusMetaLabel(status: NotificationDeliveryStatus, language: "ru" | "en" = "ru") {
  switch (status) {
    case "new":
      return language === "en" ? "New" : "Новое";
    case "read":
      return language === "en" ? "Read" : "Прочитано";
    case "hidden":
      return language === "en" ? "Hidden" : "Скрыто";
    case "snoozed":
      return language === "en" ? "Snoozed" : "Отложено";
  }
}

function channelLabel(channel: NotificationItem["channels"][number], language: "ru" | "en" = "ru") {
  switch (channel) {
    case "inApp":
      return language === "en" ? "In-app" : "Интерфейс";
    case "browser":
      return language === "en" ? "Browser" : "Браузер";
    case "email":
      return "Email";
    case "telegram":
      return "Telegram";
    case "push":
      return language === "en" ? "Push" : "Push";
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
