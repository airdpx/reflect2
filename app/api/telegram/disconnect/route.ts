import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../src/server/auth";
import { revokeTelegramAccount } from "../../../../src/server/telegram";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  await revokeTelegramAccount(user.id);
  return NextResponse.json({ ok: true });
}
