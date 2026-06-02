import { NextResponse } from "next/server";
import { handleTelegramWebhookUpdate } from "../../../../src/server/telegram";
import { loadTelegramAdminConfig } from "../../../../src/server/site-settings";

export async function POST(request: Request) {
  const config = await loadTelegramAdminConfig();
  const secret = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!config.webhookSecret || secret !== config.webhookSecret) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  try {
    const update = await request.json();
    const result = await handleTelegramWebhookUpdate(update);
    return NextResponse.json({ ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось обработать webhook" }, { status: 400 });
  }
}
