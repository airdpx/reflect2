import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../../src/server/auth";
import { clearTelegramWebhook, setTelegramWebhook } from "../../../../../src/server/telegram";

export async function POST(request: Request) {
  try {
    await requireCurrentAdmin();
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "set");
    if (action === "clear") {
      await clearTelegramWebhook();
      return NextResponse.json({ ok: true, action: "clear" });
    }
    const origin = new URL(request.url).origin;
    const result = await setTelegramWebhook(origin);
    return NextResponse.json({ action: "set", ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось изменить webhook" }, { status: 400 });
  }
}
