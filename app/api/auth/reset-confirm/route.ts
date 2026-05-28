import { NextResponse } from "next/server";
import { resetPassword } from "../../../../src/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await resetPassword(String(body.token || ""), String(body.password || ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сменить пароль" }, { status: 400 });
  }
}
