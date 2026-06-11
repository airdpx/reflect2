import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../src/server/auth";
import { getPrisma } from "../../../../src/server/db";
import { syncHumdesTransits } from "../../hd-transit/route";

export async function GET() {
  try {
    await requireCurrentAdmin();
    const prisma = getPrisma();
    const transits = await prisma.humanDesignTransitRecord.findMany({
      orderBy: [
        { periodStart: "asc" },
        { periodEnd: "asc" },
        { pageNumber: "asc" }
      ]
    });
    return NextResponse.json({ ok: true, transits });
  } catch {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
}

export async function POST() {
  try {
    await requireCurrentAdmin();
    const prisma = getPrisma();
    const result = await syncHumdesTransits(prisma);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось синхронизировать транзиты" }, { status: 400 });
  }
}
