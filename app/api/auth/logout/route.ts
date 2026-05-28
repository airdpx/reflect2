import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutUser } from "../../../../src/server/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("reflect2_session")?.value;
  await logoutUser(token);
  cookieStore.delete("reflect2_session");
  return NextResponse.json({ ok: true });
}
