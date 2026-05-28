import { NextResponse } from "next/server";
import { createPasswordResetToken } from "../../../../src/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = await createPasswordResetToken(String(body.email || ""));
    if (!token) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({
      ok: true,
      resetToken: token.token,
      resetUrl: `/auth?reset=${token.token}`
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось создать ссылку восстановления" }, { status: 400 });
  }
}
