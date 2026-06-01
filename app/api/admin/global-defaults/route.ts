import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { loadGlobalUserDefaults, saveGlobalUserDefaults } from "../../../../src/server/site-settings";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const defaults = await loadGlobalUserDefaults();
    return NextResponse.json({ ok: true, defaults });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentAdmin();
    const body = await request.json();
    const defaults = await saveGlobalUserDefaults(body?.defaults || {});
    return NextResponse.json({ ok: true, defaults });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить глобальные настройки" }, { status: 400 });
  }
}
