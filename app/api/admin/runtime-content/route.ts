import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { loadRuntimeKnowledgeContent, saveRuntimeKnowledgeContent } from "../../../../src/server/site-settings";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const content = await loadRuntimeKnowledgeContent();
    return NextResponse.json({ ok: true, content });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentAdmin();
    const body = await request.json();
    const content = await saveRuntimeKnowledgeContent(body?.content || {});
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить базу знаний" }, { status: 400 });
  }
}
