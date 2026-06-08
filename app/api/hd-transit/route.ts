import { NextResponse } from "next/server";
import { todayKey } from "../../../src/lib/date";
import { fetchHumdesTransitDetails, fetchHumdesTransitListings, HUMDES_TRANSIT_PAGES } from "../../../src/lib/humdes";
import { localizeHumanDesignTransit } from "../../../src/lib/human-design-i18n";
import { normalizeLanguage } from "../../../src/lib/i18n";
import { getPrisma } from "../../../src/server/db";
import type { HumanDesignTransit, HumanDesignTransitGate } from "../../../src/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const prisma = getPrisma();
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date") || "";
  const today = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayKey();
  const language = normalizeLanguage(url.searchParams.get("language") || undefined);
  try {
    const transit = await findTransitFromDatabase(prisma, today);
    if (!transit) {
      return NextResponse.json(
        {
          message: "Нет данных транзита в базе."
        },
        { status: 404 }
      );
    }
    return NextResponse.json(localizeHumanDesignTransit(mapTransit(transit, today), language), {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=1800"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Не удалось загрузить текущий транзит Human Design."
      },
      { status: 502 }
    );
  }
}

export async function POST() {
  const prisma = getPrisma();
  try {
    const result = await syncHumdesTransits(prisma);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Не удалось синхронизировать транзиты."
      },
      { status: 502 }
    );
  }
}

async function findCurrentTransit(prisma: ReturnType<typeof getPrisma>, today: string) {
  return prisma.humanDesignTransitRecord.findFirst({
    where: {
      periodStart: { lte: today },
      periodEnd: { gte: today }
    },
    orderBy: { periodStart: "desc" }
  });
}

async function findTransitFromDatabase(prisma: ReturnType<typeof getPrisma>, today: string) {
  const current = await findCurrentTransit(prisma, today);
  if (current) return current;
  const records = await prisma.humanDesignTransitRecord.findMany({
    orderBy: [
      { periodStart: "asc" },
      { periodEnd: "asc" }
    ]
  });
  if (!records.length) return null;
  const todayDate = fromIsoKey(today);
  return records.reduce((best, record) => {
    const score = transitDistanceScore(record.periodStart, record.periodEnd, todayDate);
    if (!best || score < best.score) return { record, score };
    if (score === best.score) {
      const bestStart = fromIsoKey(best.record.periodStart);
      const currentStart = fromIsoKey(record.periodStart);
      if (currentStart > bestStart) return { record, score };
    }
    return best;
  }, null as null | { record: Awaited<ReturnType<typeof prisma.humanDesignTransitRecord.findMany>>[number]; score: number })?.record || null;
}

function mapTransit(record: Awaited<ReturnType<typeof findTransitFromDatabase>>, date: string): HumanDesignTransit {
  if (!record) {
    throw new Error("Нет текущего транзита.");
  }
  const gates = Array.isArray(record.gates) ? (record.gates as HumanDesignTransitGate[]) : [];
  const paragraphs = Array.isArray(record.paragraphs) ? (record.paragraphs as string[]) : [];
  return {
    date,
    fetchedAt: record.fetchedAt?.toISOString() || new Date().toISOString(),
    title: record.title,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    listingUrl: record.listingUrl,
    descriptionUrl: record.descriptionUrl,
    gates,
    paragraphs,
    sourceUrl: record.listingUrl
  };
}

function transitDistanceScore(periodStart: string, periodEnd: string, today: Date) {
  const start = fromIsoKey(periodStart);
  const end = fromIsoKey(periodEnd);
  if (today < start) return start.getTime() - today.getTime();
  if (today > end) return today.getTime() - end.getTime();
  return 0;
}

function fromIsoKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

async function syncHumdesTransits(prisma: ReturnType<typeof getPrisma>) {
  let imported = 0;
  for (let pageNumber = 1; pageNumber <= HUMDES_TRANSIT_PAGES; pageNumber += 1) {
    const listings = await fetchHumdesTransitListings(pageNumber);
    for (const listing of listings) {
      let paragraphs: string[] = [];
      let publishedAt: Date | null = null;
      try {
        const details = await fetchHumdesTransitDetails(listing.descriptionUrl);
        paragraphs = details.paragraphs;
        publishedAt = details.publishedAt;
      } catch {
        paragraphs = [];
        publishedAt = null;
      }
      await prisma.humanDesignTransitRecord.upsert({
        where: { descriptionUrl: listing.descriptionUrl },
        create: {
          title: listing.title,
          periodStart: listing.periodStart,
          periodEnd: listing.periodEnd,
          listingUrl: listing.listingUrl,
          descriptionUrl: listing.descriptionUrl,
          pageNumber: listing.pageNumber,
          gateSunNumber: listing.gates[0]?.number || "",
          gateSunName: listing.gates[0]?.name || "",
          gateSunUrl: listing.gates[0]?.url || "",
          gateEarthNumber: listing.gates[1]?.number || "",
          gateEarthName: listing.gates[1]?.name || "",
          gateEarthUrl: listing.gates[1]?.url || "",
          gates: listing.gates,
          paragraphs,
          publishedAt,
          fetchedAt: new Date()
        },
        update: {
          title: listing.title,
          periodStart: listing.periodStart,
          periodEnd: listing.periodEnd,
          listingUrl: listing.listingUrl,
          pageNumber: listing.pageNumber,
          gateSunNumber: listing.gates[0]?.number || "",
          gateSunName: listing.gates[0]?.name || "",
          gateSunUrl: listing.gates[0]?.url || "",
          gateEarthNumber: listing.gates[1]?.number || "",
          gateEarthName: listing.gates[1]?.name || "",
          gateEarthUrl: listing.gates[1]?.url || "",
          gates: listing.gates,
          paragraphs,
          publishedAt: publishedAt || undefined,
          fetchedAt: new Date()
        }
      });
      imported += 1;
    }
  }
  return { ok: true, importedPages: HUMDES_TRANSIT_PAGES, importedItems: imported };
}

function normalizeGates(value: unknown): HumanDesignTransitGate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((gate): HumanDesignTransitGate | null => {
      const item = gate as Record<string, unknown>;
      const rawName = cleanText(String(item.name || item.title || item.text || ""));
      const rawNumber = cleanText(String(item.number || item.num || ""));
      const numberFromName = rawName.match(/\d+/)?.[0] || "";
      const number = rawNumber || numberFromName;
      const name = rawName.replace(/^\d+\s*/, "").trim();
      const link = cleanText(String(item.link || item.url || ""));
      const url = link ? absolutizeHumdesUrl(link) : number ? `https://www.humdes.com/ru/kb/gates/${number}/` : "";
      if (!number && !name) return null;
      return { number, name, url };
    })
    .filter((gate): gate is HumanDesignTransitGate => Boolean(gate));
}

function extractParagraphs(value: unknown): string[] {
  const html = String(value || "");
  const paragraphMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((match) => cleanText(stripTags(match[1])));
  const paragraphs = paragraphMatches.length ? paragraphMatches : cleanText(stripTags(html)).split(/\n{2,}/);
  return paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean);
}

function stripTags(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|li|p|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

function cleanText(value: string) {
  return decodeEntities(value)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absolutizeHumdesUrl(value: string) {
  try {
    return new URL(value, "https://www.humdes.com").toString();
  } catch {
    return value;
  }
}
