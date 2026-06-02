import { randomBytes, createHash } from "node:crypto";
import { getPrisma } from "./db";
import { loadUserState } from "./auth";
import { loadTelegramAdminConfig, loadTelegramAdminSettings, normalizeTelegramBotUsername, saveTelegramAdminSettings } from "./site-settings";
import { buildNotificationFeed } from "../lib/notifications";
import { calculateHabitStats, getAttentionHabits, getPeriodDates, getPeriodLabel, isHabitDue, logKey } from "../lib/analytics";
import { formatDate } from "../lib/date";
import type { AppSelectors, AppState, NotificationItem } from "../types";

const CONNECT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TELEGRAM_API_BASE = "https://api.telegram.org";

export type TelegramDeliveryResult = {
  ok: boolean;
  delivered: number;
  failed: number;
  skipped: number;
  details: Array<{ userId: string; chatId: string; status: "sent" | "failed" | "skipped"; error?: string; providerMessageId?: string }>;
};

export async function loadTelegramStatusForUser(userId: string) {
  const prisma = getPrisma();
  const connection = await prisma.telegramConnection.findFirst({
    where: { userId, revokedAt: null },
    orderBy: { linkedAt: "desc" }
  });
  const config = await loadTelegramAdminConfig();
  const botUsername = await resolveTelegramBotUsername(config.botUsername, config.botToken);
  return {
    connected: Boolean(connection),
    botUsername,
    chatId: connection?.chatId || null,
    username: connection?.username || null,
    linkedAt: connection?.linkedAt?.toISOString() || null,
    revokedAt: connection?.revokedAt?.toISOString() || null,
    connectUrl: null
  };
}

export async function createTelegramConnectLink(userId: string) {
  const config = await loadTelegramAdminConfig();
  if (!config.enabled) {
    throw new Error("Telegram отключён администратором");
  }
  const botUsername = await resolveTelegramBotUsername(config.botUsername, config.botToken);
  if (!botUsername) {
    throw new Error("Не задан bot username");
  }
  const prisma = getPrisma();
  const token = randomBytes(16).toString("base64url");
  const tokenHash = hashValue(token);
  const expiresAt = new Date(Date.now() + CONNECT_TOKEN_TTL_MS);
  await prisma.telegramConnectToken.create({
    data: { userId, tokenHash, expiresAt }
  });
  return {
    token,
    expiresAt: expiresAt.toISOString(),
    botUsername,
    connectUrl: `https://t.me/${botUsername}?start=${token}`
  };
}

export async function consumeTelegramConnectToken(token: string) {
  const prisma = getPrisma();
  const record = await prisma.telegramConnectToken.findUnique({ where: { tokenHash: hashValue(token) } });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null;
  await prisma.telegramConnectToken.update({
    where: { tokenHash: record.tokenHash },
    data: { usedAt: new Date() }
  });
  return record.userId;
}

export async function linkTelegramAccount(input: { userId: string; chatId: string; username?: string | null }) {
  const prisma = getPrisma();
  const now = new Date();
  await prisma.telegramConnection.deleteMany({
    where: { chatId: input.chatId, userId: { not: input.userId } }
  });
  await prisma.telegramConnection.updateMany({
    where: { userId: input.userId },
    data: { revokedAt: now }
  });
  return prisma.telegramConnection.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      chatId: input.chatId,
      username: input.username || null,
      linkedAt: now,
      lastSeenAt: now
    },
    update: {
      chatId: input.chatId,
      username: input.username || null,
      revokedAt: null,
      lastSeenAt: now,
      linkedAt: now
    }
  });
}

export async function revokeTelegramAccount(userId: string) {
  const prisma = getPrisma();
  return prisma.telegramConnection.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function getTelegramConnectionForUser(userId: string) {
  const prisma = getPrisma();
  return prisma.telegramConnection.findFirst({
    where: { userId, revokedAt: null },
    orderBy: { linkedAt: "desc" }
  });
}

export async function setTelegramWebhook(baseUrl: string) {
  const config = await loadTelegramAdminConfig();
  if (!config.botToken) {
    throw new Error("Не задан bot token");
  }
  if (!config.webhookSecret) {
    throw new Error("Не задан webhook secret");
  }
  const url = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: config.webhookSecret, drop_pending_updates: true })
  });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; description?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || "Не удалось установить webhook");
  }
  return { ok: true, url };
}

export async function clearTelegramWebhook() {
  const config = await loadTelegramAdminConfig();
  if (!config.botToken) {
    throw new Error("Не задан bot token");
  }
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/deleteWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drop_pending_updates: true })
  });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; description?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || "Не удалось удалить webhook");
  }
  return { ok: true };
}

export async function getTelegramWebhookInfo() {
  const config = await loadTelegramAdminConfig();
  if (!config.botToken) {
    return {
      ok: false,
      status: "no-token" as const,
      url: null,
      pendingUpdateCount: 0,
      lastErrorMessage: null,
      lastErrorDate: null,
      ipAddress: null
    };
  }
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/getWebhookInfo`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const payload = await response.json().catch(() => ({})) as {
    ok?: boolean;
    description?: string;
    result?: {
      url?: string;
      pending_update_count?: number;
      last_error_message?: string;
      last_error_date?: number;
      ip_address?: string;
    };
  };
  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      status: "error" as const,
      error: payload.description || "Не удалось проверить webhook",
      url: null,
      pendingUpdateCount: 0,
      lastErrorMessage: null,
      lastErrorDate: null,
      ipAddress: null
    };
  }
  const result = payload.result || {};
  return {
    ok: true,
    status: result.url ? "active" as const : "not-set" as const,
    url: result.url || null,
    pendingUpdateCount: Number(result.pending_update_count || 0),
    lastErrorMessage: result.last_error_message || null,
    lastErrorDate: typeof result.last_error_date === "number" ? new Date(result.last_error_date * 1000).toISOString() : null,
    ipAddress: result.ip_address || null
  };
}

export async function handleTelegramWebhookUpdate(update: unknown) {
  const message = getNested<string>(update, ["message", "text"]);
  const chatId = getNested<number | string>(update, ["message", "chat", "id"]);
  if (!message || chatId === undefined || chatId === null) return { ok: true, action: "ignored" as const };
  const chatIdString = String(chatId);
  const username = String(getNested<string | undefined>(update, ["message", "from", "username"]) || "").trim() || null;
  const botToken = (await loadTelegramAdminConfig()).botToken;
  if (!botToken) return { ok: false, error: "bot token missing" };

  if (message.startsWith("/start")) {
    const token = message.split(" ").slice(1).join(" ").trim();
    if (!token) {
      await sendTelegramMessage(chatIdString, "Сначала откройте ссылку из кнопки подключения в приложении.");
      return { ok: true, action: "missing-token" as const };
    }
    const userId = await consumeTelegramConnectToken(token);
    if (!userId) {
      await sendTelegramMessage(chatIdString, "Ссылка подключения недействительна или устарела. Откройте новую из приложения.");
      return { ok: true, action: "invalid-token" as const };
    }
    await linkTelegramAccount({ userId, chatId: chatIdString, username });
    await sendTelegramMessage(chatIdString, "Telegram подключён. Теперь уведомления будут приходить сюда.");
    return { ok: true, action: "linked" as const, userId };
  }

  if (message.startsWith("/stop") || message.startsWith("/unlink")) {
    const prisma = getPrisma();
    const current = await prisma.telegramConnection.findFirst({ where: { chatId: chatIdString, revokedAt: null } });
    if (current) {
      await revokeTelegramAccount(current.userId);
      await sendTelegramMessage(chatIdString, "Telegram отключён. Подключиться снова можно из приложения.");
      return { ok: true, action: "revoked" as const, userId: current.userId };
    }
    return { ok: true, action: "no-link" as const };
  }

  return { ok: true, action: "ignored" as const };
}

export async function sendTelegramMessage(chatId: string, text: string, options?: { parseMode?: "HTML" | "MarkdownV2" }) {
  const config = await loadTelegramAdminConfig();
  if (!config.botToken) {
    return { ok: false, error: "bot token missing" } as const;
  }
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode || "HTML",
      disable_web_page_preview: true
    })
  });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; description?: string; result?: { message_id?: number } };
  if (!response.ok || !payload.ok) {
    return { ok: false, error: payload.description || "Не удалось отправить сообщение в Telegram" } as const;
  }
  return { ok: true, messageId: String(payload.result?.message_id || "") } as const;
}

export async function dispatchTelegramDigestForAllUsers() {
  const prisma = getPrisma();
  const config = await loadTelegramAdminConfig();
  const details: TelegramDeliveryResult["details"] = [];
  if (!config.enabled || !config.botToken) {
    return { ok: false, delivered: 0, failed: 0, skipped: 0, details } satisfies TelegramDeliveryResult;
  }
  const connections = await prisma.telegramConnection.findMany({ where: { revokedAt: null }, orderBy: { linkedAt: "asc" }, include: { user: true } });
  for (const connection of connections) {
    const state = await loadUserState(connection.userId, {
      id: connection.user.id,
      email: connection.user.email,
      name: connection.user.name,
      birthDate: connection.user.birthDate,
      isAdmin: connection.user.isAdmin,
      isBlocked: connection.user.isBlocked
    });
    if (isQuietHoursActive(state.settings.notifications.quietHours.start, state.settings.notifications.quietHours.end, state.settings.notifications.quietHours.enabled)) {
      await prisma.notificationDeliveryLog.create({
        data: {
          userId: connection.userId,
          channel: "telegram",
          notificationId: `telegram:${state.selectedDate}:quiet`,
          status: "skipped",
          provider: "telegram",
          payload: { reason: "quiet_hours", date: state.selectedDate }
        }
      });
      details.push({ userId: connection.userId, chatId: connection.chatId, status: "skipped" });
      continue;
    }
    const feed = buildNotificationFeed(state, makeSelectors(state));
    const telegramItems = feed.filter((item) => item.channels.includes("telegram"));
    if (!telegramItems.length) {
      await prisma.notificationDeliveryLog.create({
        data: {
          userId: connection.userId,
          channel: "telegram",
          notificationId: `telegram:${state.selectedDate}:empty`,
          status: "skipped",
          provider: "telegram",
          payload: { reason: "no_items", date: state.selectedDate }
        }
      });
      details.push({ userId: connection.userId, chatId: connection.chatId, status: "skipped" });
      continue;
    }
    const text = buildTelegramDigestText(state, telegramItems);
    const sent = await sendTelegramMessage(connection.chatId, text, { parseMode: "HTML" });
    await prisma.notificationDeliveryLog.create({
      data: {
        userId: connection.userId,
        channel: "telegram",
        notificationId: `telegram:${state.selectedDate}`,
        status: sent.ok ? "sent" : "failed",
        provider: "telegram",
        providerMessageId: sent.ok ? sent.messageId : null,
        errorMessage: sent.ok ? null : sent.error,
        payload: { date: state.selectedDate, items: telegramItems.map((item) => ({ id: item.id, title: item.title, topic: item.topic })) },
        sentAt: sent.ok ? new Date() : null
      }
    });
    details.push({
      userId: connection.userId,
      chatId: connection.chatId,
      status: sent.ok ? "sent" : "failed",
      error: sent.ok ? undefined : sent.error,
      providerMessageId: sent.ok ? sent.messageId : undefined
    });
  }
  const delivered = details.filter((item) => item.status === "sent").length;
  const failed = details.filter((item) => item.status === "failed").length;
  const skipped = details.filter((item) => item.status === "skipped").length;
  return { ok: true, delivered, failed, skipped, details } satisfies TelegramDeliveryResult;
}

export async function getTelegramAdminDashboardState() {
  const settings = await loadTelegramAdminSettings();
  const prisma = getPrisma();
  const [connectedUsersCount, linkedUsersCount, lastDelivery, webhookInfo] = await Promise.all([
    prisma.telegramConnection.count({ where: { revokedAt: null } }),
    prisma.telegramConnection.count(),
    prisma.notificationDeliveryLog.findFirst({ where: { channel: "telegram" }, orderBy: { createdAt: "desc" } }),
    getTelegramWebhookInfo()
  ]);
  return {
    ...settings,
    connectedUsersCount,
    linkedUsersCount,
    lastDeliveryAt: lastDelivery?.createdAt?.toISOString() || null,
    lastDeliveryStatus: lastDelivery?.status || null,
    lastWebhookStatus: webhookInfo.status === "active" ? "active" : webhookInfo.status === "not-set" ? "not-set" : webhookInfo.status === "no-token" ? "no-token" : "error"
  };
}

export async function resolveTelegramBotUsername(preferred?: string, tokenOverride?: string) {
  const normalizedPreferred = normalizeTelegramBotUsername(preferred || "");
  if (normalizedPreferred) return normalizedPreferred;
  const config = await loadTelegramAdminConfig();
  const botToken = String(tokenOverride || config.botToken || "").trim();
  if (!botToken) return "";
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getMe`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const payload = await response.json().catch(() => ({})) as {
    ok?: boolean;
    description?: string;
    result?: { username?: string };
  };
  const username = normalizeTelegramBotUsername(String(payload.result?.username || "").trim());
  if (response.ok && payload.ok && username) {
    await saveTelegramAdminSettings({ botUsername: username });
    return username;
  }
  return "";
}

function buildTelegramDigestText(state: AppState, items: NotificationItem[]) {
  const lines = [
    `<b>${escapeHtml(`Практические уведомления за ${formatDate(state.selectedDate)}`)}</b>`,
    `<i>${escapeHtml(getPeriodLabel(state.settings.defaultPeriod))}</i>`,
    ""
  ];
  for (const item of items.slice(0, 5)) {
    lines.push(`• <b>${escapeHtml(item.title)}</b> — ${escapeHtml(item.message)}`);
  }
  if (state.settings.notifications.topics.forecast && state.settings.forecast.enabled && state.settings.forecast.showInToday) {
    lines.push("", `Прогноз: ${escapeHtml(state.settings.forecast.displayMode)} · ${escapeHtml(state.settings.forecast.provider)}`);
  }
  return lines.join("\n");
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

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
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

function getNested<T>(value: unknown, path: Array<string | number>): T | undefined {
  let current: unknown = value;
  for (const part of path) {
    if (current === null || current === undefined) return undefined;
    current = typeof part === "number"
      ? (Array.isArray(current) ? current[part] : undefined)
      : typeof current === "object" && current !== null
        ? (current as Record<string, unknown>)[part]
        : undefined;
  }
  return current as T | undefined;
}
