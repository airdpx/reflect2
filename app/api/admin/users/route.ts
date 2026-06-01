import { NextResponse } from "next/server";
import { listAdminUsers, requireCurrentAdmin } from "../../../../src/server/auth";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const users = await listAdminUsers();
    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}
