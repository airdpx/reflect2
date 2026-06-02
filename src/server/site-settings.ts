import { createDefaults, mergeSettings } from "../lib/defaults";
import type { UserSettings } from "../types";
import { getPrisma } from "./db";

const GLOBAL_USER_DEFAULTS_KEY = "global_user_defaults";
const SITE_CONTACT_EMAIL_KEY = "site_contact_email";

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
