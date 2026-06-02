import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { clearTelegramAdminSettings, saveTelegramAdminSettings } from "../../../../src/server/site-settings";
import { getTelegramAdminDashboardState, setTelegramWebhook } from "../../../../src/server/telegram";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const state = await getTelegramAdminDashboardState();
    return NextResponse.json({ ok: true, state });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentAdmin();
    const body = await request.json();
    const state = await saveTelegramAdminSettings({
      enabled: typeof body?.enabled === "boolean" ? body.enabled : undefined,
      botToken: typeof body?.botToken === "string" ? body.botToken : undefined,
      botUsername: typeof body?.botUsername === "string" ? body.botUsername : undefined,
      webhookSecret: typeof body?.webhookSecret === "string" ? body.webhookSecret : undefined
    });
    let webhookAttempt: { ok: boolean; url?: string; error?: string } | null = null;
    if (state.enabled) {
      try {
        const origin = new URL(request.url).origin;
        const result = await setTelegramWebhook(origin);
        webhookAttempt = { ok: true, url: result.url };
      } catch (error) {
        webhookAttempt = { ok: false, error: error instanceof Error ? error.message : "Не удалось установить webhook" };
      }
    }
    const dashboard = await getTelegramAdminDashboardState();
    return NextResponse.json({ ok: true, state: dashboard, webhookAttempt });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить Telegram" }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await requireCurrentAdmin();
    const state = await clearTelegramAdminSettings();
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось очистить Telegram" }, { status: 400 });
  }
}
