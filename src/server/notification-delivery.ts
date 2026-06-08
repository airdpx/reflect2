import { loadUserState } from "./auth";
import { getPrisma } from "./db";
import { loadContactFromEmail, loadResendApiKey } from "./site-settings";
import { getTelegramConnectionForUser, sendTelegramMessage } from "./telegram";
import { calculateHabitStats, getAttentionHabits, getPeriodDates, getPeriodLabel, isHabitDue, logKey } from "../lib/analytics";
import { formatDate, toKey, todayKey } from "../lib/date";
import { buildNotificationFeed } from "../lib/notifications";
import type { AppSelectors, AppState, NotificationChannel, NotificationItem, NotificationTopic, UserProfile } from "../types";

export type DeliveryMode = "scheduled" | "test";

type DeliverNotificationInput = {
  userId: string;
  state: AppState;
  item: NotificationItem;
  channel: NotificationChannel;
  mode: DeliveryMode;
  slotKey?: string;
};

export async function dispatchScheduledNotifications(now = new Date()) {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { isBlocked: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, birthDate: true, isAdmin: true, isBlocked: true }
  });
  const details: Array<{ userId: string; channel: NotificationChannel; status: string; notificationId?: string; error?: string }> = [];
  for (const user of users) {
    const state = await loadStateForDelivery(user);
    const notifications = state.settings.notifications;
    if (!notifications.enabled || notifications.frequency === "instant") continue;
    if (!isScheduledSlotDue(state, now)) continue;
    if (isQuietHoursActive(notifications.quietHours.start, notifications.quietHours.end, notifications.quietHours.enabled, now)) {
      details.push({ userId: user.id, channel: "inApp", status: "skipped:quiet-hours" });
      continue;
    }

    const slotKey = buildSlotKey(state, now);
    const feed = buildNotificationFeed(state, makeSelectors(state));
    const items = feed.filter((item) => item.channels.length > 0);
    for (const item of items) {
      for (const channel of item.channels) {
        if (!isExternalCronChannel(channel)) continue;
        const alreadySent = await prisma.notificationDeliveryLog.findFirst({
          where: {
            userId: user.id,
            channel,
            notificationId: scheduledNotificationId(item, channel, slotKey),
            status: { in: ["sent", "skipped"] }
          },
          select: { id: true }
        });
        if (alreadySent) continue;
        const result = await deliverNotification({ userId: user.id, state, item, channel, mode: "scheduled", slotKey });
        details.push({ userId: user.id, channel, status: result.status, notificationId: item.id, error: result.error });
      }
    }
  }
  return {
    ok: true,
    attempted: details.length,
    sent: details.filter((item) => item.status === "sent").length,
    failed: details.filter((item) => item.status === "failed").length,
    skipped: details.filter((item) => item.status.startsWith("skipped")).length,
    details
  };
}

export async function dispatchTestNotification(input: {
  userId: string;
  state: AppState;
  notificationId: string;
  channel: NotificationChannel;
  topic?: NotificationTopic;
}) {
  const feed = buildNotificationFeed(input.state, makeSelectors(input.state));
  const item = feed.find((entry) => entry.id === input.notificationId)
    || (input.topic ? feed.find((entry) => entry.topic === input.topic) : null);
  if (!item) {
    throw new Error("Уведомление не найдено для текущей даты");
  }
  return deliverNotification({
    userId: input.userId,
    state: input.state,
    item,
    channel: input.channel,
    mode: "test",
    slotKey: `test:${Date.now()}`
  });
}

export async function deliverNotification(input: DeliverNotificationInput) {
  const notificationId = input.mode === "scheduled" && input.slotKey
    ? scheduledNotificationId(input.item, input.channel, input.slotKey)
    : `test:${input.channel}:${input.item.id}:${Date.now()}`;
  if (input.channel === "telegram") {
    return deliverTelegramNotification(input, notificationId);
  }
  if (input.channel === "email") {
    return deliverEmailNotification(input, notificationId);
  }
  return logDelivery({
    userId: input.userId,
    channel: input.channel,
    notificationId,
    status: "skipped",
    provider: input.channel,
    payload: { reason: "channel_not_supported_by_server", mode: input.mode, item: serializeItem(input.item) }
  });
}

async function deliverTelegramNotification(input: DeliverNotificationInput, notificationId: string) {
  const connection = await getTelegramConnectionForUser(input.userId);
  if (!connection) {
    return logDelivery({
      userId: input.userId,
      channel: "telegram",
      notificationId,
      status: "skipped",
      provider: "telegram",
      payload: { reason: "telegram_not_connected", mode: input.mode, item: serializeItem(input.item) }
    });
  }
  const sent = await sendTelegramMessage(connection.chatId, buildTelegramNotificationText(input.state, input.item), { parseMode: "HTML" });
  return logDelivery({
    userId: input.userId,
    channel: "telegram",
    notificationId,
    status: sent.ok ? "sent" : "failed",
    provider: "telegram",
    providerMessageId: sent.ok ? sent.messageId : null,
    errorMessage: sent.ok ? null : sent.error,
    payload: { mode: input.mode, item: serializeItem(input.item) },
    sentAt: sent.ok ? new Date() : null
  });
}

async function deliverEmailNotification(input: DeliverNotificationInput, notificationId: string) {
  const apiKey = await loadResendApiKey();
  const from = await loadContactFromEmail();
  const recipient = input.state.settings.notifications.emailTarget || input.state.profile?.email || "";
  if (!apiKey || !from || !recipient) {
    return logDelivery({
      userId: input.userId,
      channel: "email",
      notificationId,
      status: "skipped",
      provider: "resend",
      payload: { reason: !apiKey ? "missing_resend_key" : !from ? "missing_from" : "missing_recipient", mode: input.mode, item: serializeItem(input.item) }
    });
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: input.item.title,
      text: buildPlainNotificationText(input.state, input.item),
      html: buildHtmlNotificationText(input.state, input.item)
    })
  });
  const body = await response.json().catch(() => ({})) as { id?: string; error?: unknown };
  return logDelivery({
    userId: input.userId,
    channel: "email",
    notificationId,
    status: response.ok ? "sent" : "failed",
    provider: "resend",
    providerMessageId: response.ok ? String(body.id || "") : null,
    errorMessage: response.ok ? null : String(body.error || "Email delivery failed"),
    payload: { mode: input.mode, item: serializeItem(input.item) },
    sentAt: response.ok ? new Date() : null
  });
}

async function logDelivery(input: {
  userId: string;
  channel: NotificationChannel;
  notificationId: string;
  status: string;
  provider?: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  payload?: unknown;
  sentAt?: Date | null;
}) {
  const prisma = getPrisma();
  const record = await prisma.notificationDeliveryLog.create({
    data: {
      userId: input.userId,
      channel: input.channel,
      notificationId: input.notificationId,
      status: input.status,
      provider: input.provider || null,
      providerMessageId: input.providerMessageId || null,
      errorMessage: input.errorMessage || null,
      payload: input.payload || {},
      sentAt: input.sentAt || null
    }
  });
  return { ok: input.status === "sent", status: input.status, id: record.id, error: input.errorMessage || undefined };
}

async function loadStateForDelivery(user: UserProfile) {
  const state = await loadUserState(user.id, user);
  return {
    ...state,
    selectedDate: todayKey()
  };
}

function isScheduledSlotDue(state: AppState, now: Date) {
  const notifications = state.settings.notifications;
  if (notifications.frequency === "weekly") {
    const day = now.getDay() || 7;
    if (day !== notifications.weeklyDay) return false;
  }
  return isWithinDeliveryWindow(notifications.digestTime, now, 20);
}

function isWithinDeliveryWindow(time: string, now: Date, windowMinutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  const scheduled = hour * 60 + minute;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= scheduled && current < scheduled + windowMinutes;
}

function buildSlotKey(state: AppState, now: Date) {
  const date = toKey(now);
  const frequency = state.settings.notifications.frequency;
  const time = state.settings.notifications.digestTime || "00:00";
  return `${frequency}:${date}:${time}`;
}

function scheduledNotificationId(item: NotificationItem, channel: NotificationChannel, slotKey: string) {
  return `scheduled:${channel}:${item.id}:${slotKey}`;
}

function isExternalCronChannel(channel: NotificationChannel) {
  return channel === "telegram" || channel === "email";
}

function buildTelegramNotificationText(state: AppState, item: NotificationItem) {
  return [
    `<b>${escapeHtml(item.icon)} ${escapeHtml(item.title)}</b>`,
    escapeHtml(item.message),
    item.detail ? `<i>${escapeHtml(item.detail)}</i>` : "",
    "",
    escapeHtml(formatDate(item.targetDate || state.selectedDate))
  ].filter(Boolean).join("\n");
}

function buildPlainNotificationText(state: AppState, item: NotificationItem) {
  return [
    `${item.icon} ${item.title}`,
    item.message,
    item.detail,
    "",
    formatDate(item.targetDate || state.selectedDate)
  ].filter(Boolean).join("\n");
}

function buildHtmlNotificationText(state: AppState, item: NotificationItem) {
  return `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;line-height:1.6">
      <h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(item.icon)} ${escapeHtml(item.title)}</h2>
      <p style="margin:0 0 8px">${escapeHtml(item.message)}</p>
      ${item.detail ? `<div style="margin:0 0 16px;color:#64748b">${escapeHtml(item.detail)}</div>` : ""}
      <div style="font-size:13px;color:#64748b">${escapeHtml(formatDate(item.targetDate || state.selectedDate))}</div>
    </div>
  `;
}

function serializeItem(item: NotificationItem) {
  return {
    id: item.id,
    topic: item.topic,
    title: item.title,
    message: item.message,
    targetView: item.targetView,
    targetDate: item.targetDate,
    priority: item.priority
  };
}

function makeSelectors(state: AppState): AppSelectors {
  const activeHabits = state.habits.filter((habit) => !habit.archived);
  const periodDates = getPeriodDates(state.settings.defaultPeriod, state.settings.showWeekends);
  return {
    activeHabits,
    periodDates,
    hasAnyLogs: Object.keys(state.logs).length > 0,
    getLog: (habitId, date) => state.logs[logKey(habitId, date)] || null,
    isDue: isHabitDue,
    calculateStats: (habit, dates = periodDates) => calculateHabitStats(habit, dates, state.logs),
    getAttentionHabits: () => getAttentionHabits(activeHabits, periodDates, state.logs),
    periodLabel: () => getPeriodLabel(state.settings.defaultPeriod),
    categories: Array.from(new Set(activeHabits.map((habit) => habit.category).filter(Boolean))).sort()
  };
}

function isQuietHoursActive(start: string, end: string, enabled: boolean, now: Date) {
  if (!enabled) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  if (startTotal === endTotal) return false;
  if (startTotal < endTotal) return minutes >= startTotal && minutes < endTotal;
  return minutes >= startTotal || minutes < endTotal;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
