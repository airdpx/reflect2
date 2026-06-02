import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { clearResendApiKey, loadResendApiKeyState, saveResendApiKey } from "../../../../src/server/site-settings";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const state = await loadResendApiKeyState();
    return NextResponse.json({ ok: true, ...state });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentAdmin();
    const body = await request.json();
    const state = await saveResendApiKey(String(body?.apiKey || ""));
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить Resend API key" }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await requireCurrentAdmin();
    const state = await clearResendApiKey();
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось очистить Resend API key" }, { status: 400 });
  }
}
