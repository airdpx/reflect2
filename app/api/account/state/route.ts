import { NextResponse } from "next/server";
import { getCurrentUser, loadUserState, saveUserState } from "../../../../src/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const state = await loadUserState(user.id, user);
  return NextResponse.json({ ok: true, state, user });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.state) throw new Error("state missing");
    await saveUserState(user.id, body.state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить состояние" }, { status: 400 });
  }
}
