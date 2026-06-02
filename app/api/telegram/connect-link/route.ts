import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../src/server/auth";
import { createTelegramConnectLink, getTelegramConnectionForUser } from "../../../../src/server/telegram";
import { loadTelegramAdminConfig } from "../../../../src/server/site-settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const connection = await getTelegramConnectionForUser(user.id);
    const link = await createTelegramConnectLink(user.id);
    const config = await loadTelegramAdminConfig();
    return NextResponse.json({
      ok: true,
      connected: Boolean(connection),
      botUsername: config.botUsername,
      connection: connection ? {
        chatId: connection.chatId,
        username: connection.username,
        linkedAt: connection.linkedAt.toISOString(),
        revokedAt: connection.revokedAt?.toISOString() || null
      } : null,
      ...link
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось создать ссылку" }, { status: 400 });
  }
}
