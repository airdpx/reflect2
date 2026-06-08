import { NextResponse } from "next/server";
import { getCurrentAuthState, getCurrentUser } from "../../../../src/server/auth";
import { dispatchTestNotification } from "../../../../src/server/notification-delivery";
import type { NotificationChannel, NotificationTopic } from "../../../../src/types";

const serverTestChannels = new Set<NotificationChannel>(["telegram", "email"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const channel = String(body?.channel || "") as NotificationChannel;
    const notificationId = String(body?.notificationId || "");
    const topic = body?.topic ? String(body.topic) as NotificationTopic : undefined;
    if (!serverTestChannels.has(channel)) throw new Error("Этот канал нельзя тестировать сервером");
    if (!notificationId && !topic) throw new Error("Не указано уведомление");
    const state = await getCurrentAuthState();
    if (!state) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const result = await dispatchTestNotification({ userId: user.id, state, notificationId, channel, topic });
    return NextResponse.json({ ok: result.ok, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось отправить тест" }, { status: 400 });
  }
}
