import { cookies } from "next/headers";
import { createDefaults } from "../lib/defaults";
import { getPrisma } from "./db";
import { createToken, hashPassword, hashToken, verifyPassword } from "./password";
import type { AppState, UserProfile } from "../types";

const SESSION_COOKIE = "reflect2_session";
const SESSION_DAYS = 30;

type SafeUser = UserProfile;

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    birthDate: session.user.birthDate
  };
}

export async function getCurrentAuthState(): Promise<AppState | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return loadUserState(user.id, user);
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
  const profile = state.profile || (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true } }));
  await prisma.userState.upsert({
    where: { userId },
    create: {
      userId,
      state: {
        ...state,
        profile
      }
    },
    update: {
      state: {
        ...state,
        profile
      }
    }
  });
}

export async function loadUserState(userId: string, profile?: UserProfile): Promise<AppState> {
  const prisma = getPrisma();
  const record = await prisma.userState.findUnique({ where: { userId } });
  if (!record) {
    const defaults = createDefaults();
    return {
      ...defaults,
      profile: profile || (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true } }))
    };
  }
  const defaults = createDefaults();
  const raw = record.state as Partial<AppState>;
  return {
    ...defaults,
    ...raw,
    profile: profile || raw.profile || (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true } })),
    settings: {
      ...defaults.settings,
      ...raw.settings,
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
      forecast: {
        ...defaults.settings.forecast,
        ...raw.settings?.forecast,
        visibleScales: {
          ...defaults.settings.forecast.visibleScales,
          ...raw.settings?.forecast?.visibleScales
        }
      },
      customPresets: raw.settings?.customPresets || defaults.settings.customPresets
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
  const defaults = createDefaults();
  defaults.settings.forecast.enabled = true;
  await prisma.userState.create({
    data: {
      userId,
      state: {
        ...defaults,
        profile: await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, birthDate: true } }) || {
          id: userId,
          email: "unknown",
          name: "Пользователь",
          birthDate
        }
      }
    }
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
