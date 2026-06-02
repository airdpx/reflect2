import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "../../../src/server/db";
import { loadSiteContactEmail } from "../../../src/server/site-settings";
import { createContactMessage, markContactMessageFailed, markContactMessageSent, sendContactMessage } from "../../../src/server/contact";

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

    if (honeypot) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    if (!message) {
      return NextResponse.json({ ok: false, error: "Добавь текст сообщения." }, { status: 400 });
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Укажи корректный email." }, { status: 400 });
    }

    const recipientEmail = await loadSiteContactEmail();
    if (!recipientEmail) {
      return NextResponse.json({ ok: false, error: "Администратор ещё не указал email для контактов." }, { status: 400 });
    }

    const requestHeaders = await headers();
    const ipAddress = getClientIp(requestHeaders.get("x-forwarded-for"), requestHeaders.get("cf-connecting-ip"));
    const userAgent = requestHeaders.get("user-agent") || "";

    const recentCount = await countRecentMessages(ipAddress, email);
    if (recentCount >= 3) {
      return NextResponse.json({ ok: false, error: "Слишком много сообщений подряд. Попробуй чуть позже." }, { status: 429 });
    }

    const record = await createContactMessage({
      name: name || "Не указано",
      email: email || "Не указан",
      topic: topic || "Обратная связь PractWay",
      message,
      recipientEmail,
      replyTo: email || undefined,
      ipAddress,
      userAgent
    });

    const result = await sendContactMessage({
      recipientEmail,
      senderName: name || "Не указано",
      senderEmail: email,
      topic: topic || "Обратная связь PractWay",
      message
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
