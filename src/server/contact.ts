import { getPrisma } from "./db";
import { loadContactFromEmail, loadResendApiKey } from "./site-settings";

type ContactInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
  recipientEmail: string;
  replyTo?: string;
  ipAddress?: string;
  userAgent?: string;
};

type ContactSendResult =
  | { ok: true; messageId: string; provider: "resend" }
  | { ok: false; error: string };

export async function createContactMessage(input: ContactInput) {
  const prisma = getPrisma();
  return prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      recipientEmail: input.recipientEmail,
      replyTo: input.replyTo || null,
      status: "queued",
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null
    }
  });
}

export async function markContactMessageSent(messageId: string, providerId?: string | null) {
  const prisma = getPrisma();
  return prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      status: "sent",
      provider: "resend",
      providerId: providerId || null,
      sentAt: new Date(),
      errorMessage: null
    }
  });
}

export async function markContactMessageFailed(messageId: string, errorMessage: string) {
  const prisma = getPrisma();
  return prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      status: "failed",
      errorMessage: errorMessage.slice(0, 500)
    }
  });
}

export async function sendContactMessage(input: {
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  topic: string;
  message: string;
  language?: "ru" | "en";
}) {
  const apiKey = await loadResendApiKey();
  const from = await loadContactFromEmail();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set" } satisfies ContactSendResult;
  if (!from) return { ok: false, error: "CONTACT_FROM_EMAIL is not set" } satisfies ContactSendResult;

  const payload = {
    from,
    to: [input.recipientEmail],
    reply_to: input.senderEmail || undefined,
    subject: input.topic.trim() || (input.language === "en" ? "PractWay feedback" : "Обратная связь PractWay"),
    text: buildPlainTextMessage(input.senderName, input.senderEmail, input.message, input.language),
    html: buildHtmlMessage(input.senderName, input.senderEmail, input.topic, input.message, input.language)
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({})) as { id?: string; error?: unknown };
  if (!response.ok) {
    return { ok: false, error: String(body?.error || "Не удалось отправить письмо через Resend") } satisfies ContactSendResult;
  }
  return { ok: true, messageId: String(body?.id || ""), provider: "resend" } satisfies ContactSendResult;
}

function buildPlainTextMessage(name: string, email: string, message: string, language: "ru" | "en" = "ru") {
  const nameLabel = language === "en" ? "Name" : "Имя";
  const notSpecified = language === "en" ? "Not specified" : "Не указано";
  const noEmail = language === "en" ? "Not specified" : "Не указан";
  return [
    `${nameLabel}: ${name || notSpecified}`,
    `Email: ${email || noEmail}`,
    "",
    message.trim()
  ].join("\n");
}

function buildHtmlMessage(name: string, email: string, topic: string, message: string, language: "ru" | "en" = "ru") {
  const safe = escapeHtml;
  const nameLabel = language === "en" ? "Name" : "Имя";
  const notSpecified = language === "en" ? "Not specified" : "Не указано";
  const noEmail = language === "en" ? "Not specified" : "Не указан";
  const defaultTopic = language === "en" ? "PractWay feedback" : "Обратная связь PractWay";
  return `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;line-height:1.6">
      <h2 style="margin:0 0 12px;font-size:20px">${safe(topic || defaultTopic)}</h2>
      <p style="margin:0 0 8px"><b>${nameLabel}:</b> ${safe(name || notSpecified)}</p>
      <p style="margin:0 0 16px"><b>Email:</b> ${safe(email || noEmail)}</p>
      <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px">${safe(message.trim())}</div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
