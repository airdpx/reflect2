import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "../../../src/server/db";
import { loadSiteContactEmail } from "../../../src/server/site-settings";
import { createContactMessage, markContactMessageFailed, markContactMessageSent, sendContactMessage } from "../../../src/server/contact";
import { normalizeLanguage } from "../../../src/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const name = normalizeText(body?.name);
    const email = normalizeText(body?.email);
    const topic = normalizeText(body?.topic, 120);
    const message = normalizeText(body?.message, 5000);
    const honeypot = normalizeText(body?.website);
    const language = normalizeLanguage(normalizeText(body?.language, 2));
    const defaultTopic = language === "en" ? "PractWay feedback" : "Обратная связь PractWay";
    const unknownName = language === "en" ? "Not specified" : "Не указано";
    const unknownEmail = language === "en" ? "Not specified" : "Не указан";

    if (honeypot) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    if (!message) {
      return NextResponse.json({ ok: false, error: language === "en" ? "Add a message first." : "Добавь текст сообщения." }, { status: 400 });
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ ok: false, error: language === "en" ? "Enter a valid email." : "Укажи корректный email." }, { status: 400 });
    }

    const recipientEmail = await loadSiteContactEmail();
    if (!recipientEmail) {
      return NextResponse.json({ ok: false, error: language === "en" ? "The contact email is not configured yet." : "Администратор ещё не указал email для контактов." }, { status: 400 });
    }

    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders.get("x-forwarded-for"), requestHeaders.get("cf-connecting-ip"));
    const userAgent = requestHeaders.get("user-agent") || "";

    const recentCount = await countRecentMessages(ipAddress, email);
    if (recentCount >= 3) {
      return NextResponse.json({ ok: false, error: language === "en" ? "Too many messages in a row. Try again a little later." : "Слишком много сообщений подряд. Попробуй чуть позже." }, { status: 429 });
    }

    const record = await createContactMessage({
      name: name || unknownName,
      email: email || unknownEmail,
      topic: topic || defaultTopic,
      message,
      recipientEmail,
      replyTo: email || undefined,
      ipAddress,
      userAgent
    });

    const result = await sendContactMessage({
      recipientEmail,
      senderName: name || unknownName,
      senderEmail: email,
      topic: topic || defaultTopic,
      message,
      language
    });

    if (!result.ok) {
      await markContactMessageFailed(record.id, result.error);
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }

    await markContactMessageSent(record.id, result.messageId);
    return NextResponse.json({ ok: true, status: "sent" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось отправить сообщение" }, { status: 400 });
  }
}

async function countRecentMessages(ipAddress: string, email: string) {
  const prisma = getPrisma();
  const recentWhere = [
    ipAddress ? { ipAddress } : null,
    email ? { email } : null
  ].filter(Boolean) as Array<{ ipAddress?: string; email?: string }>;
  if (!recentWhere.length) return 0;
  return prisma.contactMessage.count({
    where: {
      OR: recentWhere,
      createdAt: { gte: new Date(Date.now() - 60_000) }
    }
  });
}

function normalizeText(value: unknown, limit = 5000) {
  return String(value || "").trim().slice(0, limit);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getClientIp(forwardedFor: string | null, connectingIp: string | null) {
  const fromForwarded = forwardedFor?.split(",")[0]?.trim();
  return fromForwarded || connectingIp || "";
}
