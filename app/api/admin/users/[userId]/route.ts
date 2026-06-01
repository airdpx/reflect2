import { NextResponse } from "next/server";
import { deleteAdminUser, requireCurrentAdmin, updateAdminUser } from "../../../../../src/server/auth";

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireCurrentAdmin();
    const { userId } = await context.params;
    const body = await request.json();
    const updated = await updateAdminUser({
      userId,
      email: body.email,
      name: body.name,
      birthDate: body.birthDate,
      isBlocked: typeof body.isBlocked === "boolean" ? body.isBlocked : undefined,
      isAdmin: typeof body.isAdmin === "boolean" ? body.isAdmin : undefined,
      password: body.password
    });
    return NextResponse.json({ ok: true, user: updated, admin: admin.id });
  } catch (error) {
    const message = error instanceof Error && error.message === "forbidden" ? "forbidden" : "Не удалось обновить пользователя";
    return NextResponse.json({ ok: false, error: message }, { status: message === "forbidden" ? 403 : 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireCurrentAdmin();
    const { userId } = await context.params;
    if (userId === admin.id) {
      return NextResponse.json({ ok: false, error: "Нельзя удалить собственный аккаунт администратора" }, { status: 400 });
    }
    await deleteAdminUser(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && error.message === "forbidden" ? "forbidden" : "Не удалось удалить пользователя";
    return NextResponse.json({ ok: false, error: message }, { status: message === "forbidden" ? 403 : 400 });
  }
}
