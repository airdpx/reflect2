import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../src/server/auth";
import { getTelegramConnectionForUser } from "../../../../src/server/telegram";
import { loadTelegramAdminConfig } from "../../../../src/server/site-settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const config = await loadTelegramAdminConfig();
  const connection = await getTelegramConnectionForUser(user.id);
  return NextResponse.json({
    ok: true,
    connected: Boolean(connection),
    botUsername: config.botUsername,
    chatId: connection?.chatId || null,
    username: connection?.username || null,
    linkedAt: connection?.linkedAt.toISOString() || null,
    revokedAt: connection?.revokedAt?.toISOString() || null
  });
}
