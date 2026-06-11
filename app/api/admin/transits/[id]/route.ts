import { NextResponse } from "next/server";
import { requireCurrentAdmin } from "../../../../../src/server/auth";
import { getPrisma } from "../../../../../src/server/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const prisma = getPrisma();
    const data: Record<string, unknown> = {
      ...(body.title !== undefined ? { title: stringValue(body.title) } : {}),
      ...(body.titleEn !== undefined ? { titleEn: stringValue(body.titleEn) } : {}),
      ...(body.periodStart !== undefined ? { periodStart: stringValue(body.periodStart) } : {}),
      ...(body.periodEnd !== undefined ? { periodEnd: stringValue(body.periodEnd) } : {}),
      ...(body.listingUrl !== undefined ? { listingUrl: stringValue(body.listingUrl) } : {}),
      ...(body.descriptionUrl !== undefined ? { descriptionUrl: stringValue(body.descriptionUrl) } : {}),
      ...(body.pageNumber !== undefined ? { pageNumber: numberValue(body.pageNumber) } : {}),
      ...(body.gateSunNumber !== undefined ? { gateSunNumber: stringValue(body.gateSunNumber) } : {}),
      ...(body.gateSunName !== undefined ? { gateSunName: stringValue(body.gateSunName) } : {}),
      ...(body.gateSunUrl !== undefined ? { gateSunUrl: stringValue(body.gateSunUrl) } : {}),
      ...(body.gateEarthNumber !== undefined ? { gateEarthNumber: stringValue(body.gateEarthNumber) } : {}),
      ...(body.gateEarthName !== undefined ? { gateEarthName: stringValue(body.gateEarthName) } : {}),
      ...(body.gateEarthUrl !== undefined ? { gateEarthUrl: stringValue(body.gateEarthUrl) } : {}),
      ...(body.gates !== undefined ? { gates: normalizeJson(body.gates) } : {}),
      ...(body.paragraphs !== undefined ? { paragraphs: normalizeList(body.paragraphs) } : {}),
      ...(body.paragraphsEn !== undefined ? { paragraphsEn: normalizeList(body.paragraphsEn) } : {}),
      ...(body.helped !== undefined ? { helped: normalizeList(body.helped) } : {}),
      ...(body.helpedEn !== undefined ? { helpedEn: normalizeList(body.helpedEn) } : {}),
      ...(body.blocked !== undefined ? { blocked: normalizeList(body.blocked) } : {}),
      ...(body.blockedEn !== undefined ? { blockedEn: normalizeList(body.blockedEn) } : {}),
      ...(body.publishedAt !== undefined ? { publishedAt: normalizeDate(body.publishedAt) } : {}),
      fetchedAt: new Date()
    };
    const transit = await prisma.humanDesignTransitRecord.update({
      where: { id },
      data
    });
    return NextResponse.json({ ok: true, transit });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Не удалось сохранить транзит" }, { status: 400 });
  }
}

function stringValue(value: unknown) {
  return String(value || "").trim();
}

function numberValue(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value ?? [];
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDate(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}
