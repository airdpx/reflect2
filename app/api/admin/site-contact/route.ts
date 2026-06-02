import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { loadSiteContactEmail, saveSiteContactEmail } from "../../../../src/server/site-settings";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const email = await loadSiteContactEmail();
    return NextResponse.json({ ok: true, email });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentAdmin();
    const body = await request.json();
    const email = await saveSiteContactEmail(String(body?.email || ""));
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить email" }, { status: 400 });
  }
}
