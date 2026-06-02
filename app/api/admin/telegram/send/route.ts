import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../../src/server/auth";
import { dispatchTelegramDigestForAllUsers } from "../../../../../src/server/telegram";

export async function POST() {
  try {
    await requireCurrentAdmin();
    const result = await dispatchTelegramDigestForAllUsers();
    return NextResponse.json({ ok: result.ok, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось отправить Telegram" }, { status: 400 });
  }
}
