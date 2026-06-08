import { NextResponse } from "next/server";
import { dispatchScheduledNotifications } from "../../../../src/server/notification-delivery";

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}

async function runCron(request: Request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const urlSecret = new URL(request.url).searchParams.get("secret") || "";
    if (auth !== `Bearer ${secret}` && urlSecret !== secret) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }
  try {
    const result = await dispatchScheduledNotifications();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось отправить запланированные уведомления" }, { status: 500 });
  }
}
