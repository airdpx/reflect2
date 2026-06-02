import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../src/server/auth";
import { getTelegramConnectionForUser } from "../../../../src/server/telegram";
import { loadTelegramAdminConfig } from "../../../../src/server/site-settings";
import { resolveTelegramBotUsername } from "../../../../src/server/telegram";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const config = await loadTelegramAdminConfig();
  const botUsername = await resolveTelegramBotUsername(config.botUsername, config.botToken);
  const connection = await getTelegramConnectionForUser(user.id);
  return NextResponse.json({
    ok: true,
    connected: Boolean(connection),
    botUsername,
    chatId: connection?.chatId || null,
    username: connection?.username || null,
    linkedAt: connection?.linkedAt.toISOString() || null,
    revokedAt: connection?.revokedAt?.toISOString() || null
  });
}
