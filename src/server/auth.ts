import { cookies } from "next/headers";
import { createDefaults, normalizeCustomPresets } from "../lib/defaults";
import { getPrisma } from "./db";
import { createToken, hashPassword, hashToken, verifyPassword } from "./password";
import type { AppState, UserProfile } from "../types";
import { loadGlobalUserDefaults } from "./site-settings";
import { normalizeLanguage } from "../lib/i18n";

const SESSION_COOKIE = "reflect2_session";
const SESSION_DAYS = 30;
const ADMIN_EMAIL = "admin";
const ADMIN_PASSWORD = "Asdfgh2188$";

type SafeUser = UserProfile;

export async function getCurrentUser(): Promise<SafeUser | null> {
  await ensureBootstrapAccounts();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!session || session.expiresAt.getTime() < Date.now() || session.user.isBlocked) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    birthDate: session.user.birthDate,
    isAdmin: session.user.isAdmin,
    isBlocked: session.user.isBlocked
  };
}

export async function getCurrentAuthState(): Promise<AppState | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return loadUserState(user.id, user);
}

export async function requireCurrentAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    throw new Error("forbidden");
  }
  return user;
}

export async function registerUser(input: { email: string; password: string; name: string; birthDate: string }) {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || "Пользователь";
  if (!email || !input.password || !input.birthDate) {
    throw new Error("Заполните email, пароль и дату рождения");
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Пользователь с таким email уже существует");
  const user = await prisma.user.create({
    data: {
      email,
      name,
      birthDate: input.birthDate,
      passwordHash: hashPassword(input.password)
    }
  });
  await ensureUserState(user.id, user.birthDate);
  const session = await createSessionForUser(user.id);
  return { ...session, userId: user.id };
}

export async function loginUser(input: { email: string; password: string }) {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Неверный email или пароль");
  }
  if (user.isBlocked) {
    throw new Error("Аккаунт заблокирован");
  }
  await ensureUserState(user.id, user.birthDate);
  const session = await createSessionForUser(user.id);
  return { ...session, userId: user.id };
}

export async function logoutUser(token?: string) {
  if (!token) return;
  const prisma = getPrisma();
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function saveUserState(userId: string, state: AppState) {
  const prisma = getPrisma();
  const sanitizedState = structuredClone(state);
  if (sanitizedState.settings) {
    sanitizedState.settings.language = normalizeLanguage(sanitizedState.settings.language);
  }
  const profile = sanitizedState.profile || (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true, isAdmin: true, isBlocked: true } }));
  await prisma.userState.upsert({
    where: { userId },
    create: {
      userId,
      state: {
        ...sanitizedState,
        profile
      }
    },
    update: {
      state: {
        ...sanitizedState,
        profile
      }
    }
  });
}

export async function loadUserState(userId: string, profile?: UserProfile): Promise<AppState> {
  const prisma = getPrisma();
  const record = await prisma.userState.findUnique({ where: { userId } });
  const globalDefaults = await loadGlobalUserDefaults();
  if (!record) {
    const defaults = createDefaults(globalDefaults);
    return {
      ...defaults,
      schemaVersion: defaults.schemaVersion,
      profile: profile || (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true, isAdmin: true, isBlocked: true } }))
    };
  }
  const defaults = createDefaults(globalDefaults);
  const raw = record.state as Partial<AppState>;
  const previousVersion = Number(raw.schemaVersion || 1);
  const migratedForecast = {
    ...defaults.settings.forecast,
    ...raw.settings?.forecast,
    visibleScales: {
      ...defaults.settings.forecast.visibleScales,
      ...raw.settings?.forecast?.visibleScales
    }
  };
  const migratedNumerology = {
    ...defaults.settings.numerology,
    ...raw.settings?.numerology,
    visibleMetrics: {
      ...defaults.settings.numerology.visibleMetrics,
      ...raw.settings?.numerology?.visibleMetrics
    },
    weights: {
      ...defaults.settings.numerology.weights,
      ...raw.settings?.numerology?.weights
    }
  };
  if (previousVersion < 16) {
    migratedForecast.enabled = true;
  }
  return {
    ...defaults,
    ...raw,
    schemaVersion: defaults.schemaVersion,
    profile: profile || raw.profile || (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true, isAdmin: true, isBlocked: true } })),
    settings: {
      ...defaults.settings,
      ...raw.settings,
      language: normalizeLanguage(raw.settings?.language || defaults.settings.language),
      defaultPeriod: {
        ...defaults.settings.defaultPeriod,
        ...raw.settings?.defaultPeriod
      },
      visibleBlocks: {
        ...defaults.settings.visibleBlocks,
        ...raw.settings?.visibleBlocks
      },
      visibleGrid: {
        ...defaults.settings.visibleGrid,
        ...raw.settings?.visibleGrid
      },
      customTheme: {
        ...defaults.settings.customTheme,
        ...raw.settings?.customTheme
      },
      statusIcons: {
        ...defaults.settings.statusIcons,
        ...raw.settings?.statusIcons
      },
      gridColors: {
        ...defaults.settings.gridColors,
        ...raw.settings?.gridColors
      },
      gridHabitColorMode: raw.settings?.gridHabitColorMode || defaults.settings.gridHabitColorMode,
      forecast: migratedForecast,
      numerology: migratedNumerology,
      customPresets: normalizeCustomPresets(raw.settings?.customPresets as Record<string, Partial<typeof defaults.settings>> | undefined, defaults.settings),
      analyticsHistoryDays: raw.settings?.analyticsHistoryDays || defaults.settings.analyticsHistoryDays
    },
    habits: raw.habits || defaults.habits,
    logs: raw.logs || defaults.logs,
    notes: raw.notes || defaults.notes
  };
}

export async function ensureUserState(userId: string, birthDate: string) {
  const prisma = getPrisma();
  const existing = await prisma.userState.findUnique({ where: { userId } });
  if (existing) return;
  const defaults = createDefaults(await loadGlobalUserDefaults());
  await prisma.userState.create({
    data: {
      userId,
      state: {
        ...defaults,
        profile: await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true, isAdmin: true, isBlocked: true } }) || {
          id: userId,
          email: "unknown",
          name: "Пользователь",
          birthDate
        }
      }
    }
  });
}

export async function ensureBootstrapAccounts() {
  const prisma = getPrisma();
  const globalDefaults = await loadGlobalUserDefaults();
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (!existing.isAdmin || existing.isBlocked) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isAdmin: true, isBlocked: false }
      });
    }
    if (!await prisma.userState.findUnique({ where: { userId: existing.id } })) {
      await ensureUserState(existing.id, existing.birthDate);
    }
    return existing.id;
  }
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: "admin",
      birthDate: "1984-06-23",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      isAdmin: true,
      isBlocked: false
    }
  });
  await prisma.userState.create({
    data: {
      userId: admin.id,
      state: {
        ...createDefaults(globalDefaults),
        profile: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          birthDate: admin.birthDate,
          isAdmin: admin.isAdmin,
          isBlocked: admin.isBlocked
        }
      }
    }
  }).catch(async () => {
    await ensureUserState(admin.id, admin.birthDate);
  });
  return admin.id;
}

export async function listAdminUsers() {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    orderBy: [{ isAdmin: "desc" }, { createdAt: "asc" }],
    include: { state: true }
  });
  return users.map((user) => {
    const state = (user.state?.state || {}) as Partial<AppState>;
    const habits = state.habits || [];
    const logs = state.logs || {};
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      birthDate: user.birthDate,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      habitsCount: habits.length,
      calendarMarksCount: Object.keys(logs).length,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  });
}

export async function updateAdminUser(input: {
  userId: string;
  email?: string;
  name?: string;
  birthDate?: string;
  isBlocked?: boolean;
  isAdmin?: boolean;
  password?: string;
}) {
  const prisma = getPrisma();
  const updateData: Record<string, unknown> = {};
  if (typeof input.email === "string") updateData.email = input.email.trim().toLowerCase();
  if (typeof input.name === "string") updateData.name = input.name.trim() || "Пользователь";
  if (typeof input.birthDate === "string") updateData.birthDate = input.birthDate;
  if (typeof input.isBlocked === "boolean") updateData.isBlocked = input.isBlocked;
  if (typeof input.isAdmin === "boolean") updateData.isAdmin = input.isAdmin;
  if (input.password) updateData.passwordHash = hashPassword(input.password);
  const user = await prisma.user.update({
    where: { id: input.userId },
    data: updateData
  });
  if (typeof input.isBlocked === "boolean" && input.isBlocked) {
    await prisma.session.deleteMany({ where: { userId: input.userId } });
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    birthDate: user.birthDate,
    isAdmin: user.isAdmin,
    isBlocked: user.isBlocked
  };
}

export async function deleteAdminUser(userId: string) {
  const prisma = getPrisma();
  await prisma.user.delete({ where: { id: userId } });
}

export async function changeCurrentPassword(userId: string, password: string) {
  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(password) }
  });
}

export async function createSessionForUser(userId: string) {
  const prisma = getPrisma();
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, tokenHash, expiresAt }
  });
  return { token, expiresAt, userId };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function createPasswordResetToken(email: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt }
  });
  return { token, email: user.email };
}

export async function resetPassword(token: string, password: string) {
  const prisma = getPrisma();
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw new Error("Ссылка восстановления недействительна");
  }
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: hashPassword(password) }
  });
  await prisma.passwordResetToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() }
  });
  return record.user.email;
}
