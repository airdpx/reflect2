import { createDefaults, mergeSettings } from "../lib/defaults";
import type { UserSettings } from "../types";
import { getPrisma } from "./db";

const GLOBAL_USER_DEFAULTS_KEY = "global_user_defaults";
const SITE_CONTACT_EMAIL_KEY = "site_contact_email";
const RESEND_API_KEY_KEY = "resend_api_key";

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

function maskSecret(value: string) {
  if (!value) return "";
  const tail = value.slice(-4);
  return value.length <= 4 ? "••••" : `${"•".repeat(Math.max(4, Math.min(12, value.length - 4)))}${tail}`;
}
