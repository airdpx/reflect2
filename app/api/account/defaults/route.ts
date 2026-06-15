import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../src/server/auth";
import { loadEffectiveGlobalUserDefaults } from "../../../../src/server/site-settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const settings = await loadEffectiveGlobalUserDefaults();
  return NextResponse.json({ ok: true, settings });
}
