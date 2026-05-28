import { NextResponse } from "next/server";
import { loadUserState, registerUser, setSessionCookie } from "../../../../src/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser(body);
    await setSessionCookie(result.token, result.expiresAt);
    const state = await loadUserState(result.userId);
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось зарегистрировать" }, { status: 400 });
  }
}
