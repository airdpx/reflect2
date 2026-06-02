import { createDefaults, mergeSettings } from "../lib/defaults";
import type { TelegramAdminSettings, UserSettings } from "../types";
import { getPrisma } from "./db";

const GLOBAL_USER_DEFAULTS_KEY = "global_user_defaults";
const SITE_CONTACT_EMAIL_KEY = "site_contact_email";
const CONTACT_FROM_EMAIL_KEY = "contact_from_email";
const RESEND_API_KEY_KEY = "resend_api_key";
const TELEGRAM_ADMIN_SETTINGS_KEY = "telegram_admin_settings";

type TelegramAdminConfig = {
  enabled: boolean;
  botToken: string;
  botUsername: string;
  webhookSecret: string;
};

export function normalizeTelegramBotUsername(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^@+/, "")
    .replace(/\?.*$/, "")
    .replace(/\/.*$/, "")
    .trim();
}

export async function loadGlobalUserDefaults(): Promise<Partial<UserSettings>> {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: GLOBAL_USER_DEFAULTS_KEY } });
  if (!record?.value || typeof record.value !== "object") return {};
  return record.value as Partial<UserSettings>;
}

export async function saveGlobalUserDefaults(settings: Partial<UserSettings>) {
  const prisma = getPrisma();
  const defaults = createDefaults().settings;
  const merged = mergeSettings(defaults, settings);
  await prisma.appConfig.upsert({
    where: { key: GLOBAL_USER_DEFAULTS_KEY },
    create: {
      key: GLOBAL_USER_DEFAULTS_KEY,
      value: merged
    },
    update: {
      value: merged
    }
  });
  return merged;
}

export async function loadSiteContactEmail(): Promise<string> {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: SITE_CONTACT_EMAIL_KEY } });
  return typeof record?.value === "string" ? record.value : "";
}

export async function saveSiteContactEmail(email: string) {
  const prisma = getPrisma();
  const value = String(email || "").trim();
  await prisma.appConfig.upsert({
    where: { key: SITE_CONTACT_EMAIL_KEY },
    create: {
      key: SITE_CONTACT_EMAIL_KEY,
      value
    },
    update: {
      value
    }
  });
  return value;
}

export async function loadContactFromEmail(): Promise<string> {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: CONTACT_FROM_EMAIL_KEY } });
  const saved = typeof record?.value === "string" ? record.value.trim() : "";
  return saved || String(process.env.CONTACT_FROM_EMAIL || "").trim();
}

export async function saveContactFromEmail(email: string) {
  const prisma = getPrisma();
  const value = String(email || "").trim();
  if (!value) {
    await prisma.appConfig.delete({ where: { key: CONTACT_FROM_EMAIL_KEY } }).catch(() => null);
    return loadContactFromEmail();
  }
  await prisma.appConfig.upsert({
    where: { key: CONTACT_FROM_EMAIL_KEY },
    create: {
      key: CONTACT_FROM_EMAIL_KEY,
      value
    },
    update: {
      value
    }
  });
  return value;
}

export async function loadResendApiKey(): Promise<string> {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: RESEND_API_KEY_KEY } });
  const saved = typeof record?.value === "string" ? record.value.trim() : "";
  return saved || String(process.env.RESEND_API_KEY || "").trim();
}

export async function loadResendApiKeyState() {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: RESEND_API_KEY_KEY } });
  const saved = typeof record?.value === "string" ? record.value.trim() : "";
  const envValue = String(process.env.RESEND_API_KEY || "").trim();
  const value = saved || envValue;
  const source = saved ? "db" : envValue ? "env" : "none";
  return {
    hasValue: Boolean(value),
    source,
    masked: maskSecret(value),
    last4: value.slice(-4),
    configuredInDb: Boolean(saved)
  };
}

export async function saveResendApiKey(apiKey: string) {
  const prisma = getPrisma();
  const value = String(apiKey || "").trim();
  if (!value) {
    await prisma.appConfig.delete({ where: { key: RESEND_API_KEY_KEY } }).catch(() => null);
    return await loadResendApiKeyState();
  }
  await prisma.appConfig.upsert({
    where: { key: RESEND_API_KEY_KEY },
    create: {
      key: RESEND_API_KEY_KEY,
      value
    },
    update: {
      value
    }
  });
  return await loadResendApiKeyState();
}

export async function clearResendApiKey() {
  const prisma = getPrisma();
  await prisma.appConfig.delete({ where: { key: RESEND_API_KEY_KEY } }).catch(() => null);
  return loadResendApiKeyState();
}

export async function loadTelegramAdminConfig(): Promise<TelegramAdminConfig> {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: TELEGRAM_ADMIN_SETTINGS_KEY } });
  const raw = record?.value && typeof record.value === "object" ? record.value as Partial<TelegramAdminConfig> : {};
  return {
    enabled: Boolean(raw.enabled),
    botToken: String(raw.botToken || "").trim() || String(process.env.TELEGRAM_BOT_TOKEN || "").trim(),
    botUsername: normalizeTelegramBotUsername(String(raw.botUsername || "").trim() || String(process.env.TELEGRAM_BOT_USERNAME || "").trim()),
    webhookSecret: String(raw.webhookSecret || "").trim() || String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim()
  };
}

export async function loadTelegramAdminSettings(): Promise<TelegramAdminSettings> {
  const prisma = getPrisma();
  const record = await prisma.appConfig.findUnique({ where: { key: TELEGRAM_ADMIN_SETTINGS_KEY } });
  const raw = record?.value && typeof record.value === "object" ? record.value as Partial<TelegramAdminConfig> : {};
  const envToken = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const envSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  const token = String(raw.botToken || "").trim() || envToken;
  const secret = String(raw.webhookSecret || "").trim() || envSecret;
  return {
    enabled: Boolean(raw.enabled),
    botUsername: normalizeTelegramBotUsername(String(raw.botUsername || "").trim()),
    botTokenMasked: maskSecret(token),
    botTokenLast4: token.slice(-4),
    botTokenConfiguredInDb: Boolean(String(raw.botToken || "").trim()),
    botTokenSource: String(raw.botToken || "").trim() ? "db" : envToken ? "env" : "none",
    webhookSecretMasked: maskSecret(secret),
    webhookSecretLast4: secret.slice(-4),
    webhookSecretConfiguredInDb: Boolean(String(raw.webhookSecret || "").trim()),
    webhookSecretSource: String(raw.webhookSecret || "").trim() ? "db" : envSecret ? "env" : "none",
    connectedUsersCount: 0,
    linkedUsersCount: 0,
    lastDeliveryAt: null,
    lastDeliveryStatus: null,
    lastWebhookStatus: null
  };
}

export async function saveTelegramAdminSettings(settings: Partial<TelegramAdminConfig>) {
  const prisma = getPrisma();
  const current = await loadTelegramAdminConfig();
  const next: TelegramAdminConfig = {
    enabled: typeof settings.enabled === "boolean" ? settings.enabled : current.enabled,
    botToken: typeof settings.botToken === "string" && settings.botToken.trim() ? settings.botToken.trim() : current.botToken,
    botUsername: typeof settings.botUsername === "string" && normalizeTelegramBotUsername(settings.botUsername) ? normalizeTelegramBotUsername(settings.botUsername) : current.botUsername,
    webhookSecret: typeof settings.webhookSecret === "string" && settings.webhookSecret.trim() ? settings.webhookSecret.trim() : current.webhookSecret
  };
  await prisma.appConfig.upsert({
    where: { key: TELEGRAM_ADMIN_SETTINGS_KEY },
    create: { key: TELEGRAM_ADMIN_SETTINGS_KEY, value: next },
    update: { value: next }
  });
  return loadTelegramAdminSettings();
}

export async function clearTelegramAdminSettings() {
  const prisma = getPrisma();
  await prisma.appConfig.delete({ where: { key: TELEGRAM_ADMIN_SETTINGS_KEY } }).catch(() => null);
  return loadTelegramAdminSettings();
}

export async function loadTelegramConnectionCount() {
  const prisma = getPrisma();
  return prisma.telegramConnection.count({ where: { revokedAt: null } });
}

export async function loadTelegramLastDelivery() {
  const prisma = getPrisma();
  return prisma.notificationDeliveryLog.findFirst({
    where: { channel: "telegram" },
    orderBy: { createdAt: "desc" }
  });
}

function maskSecret(value: string) {
  if (!value) return "";
  const tail = value.slice(-4);
  return value.length <= 4 ? "••••" : `${"•".repeat(Math.max(4, Math.min(12, value.length - 4)))}${tail}`;
}
