import { NextResponse } from "next/server";
import { todayKey } from "../../../src/lib/date";
import { fetchHumdesTransitDetails, fetchHumdesTransitListings, HUMDES_TRANSIT_PAGES, HUMDES_TRANSITS_URL } from "../../../src/lib/humdes";
import { getPrisma } from "../../../src/server/db";
import type { HumanDesignTransit, HumanDesignTransitGate } from "../../../src/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  const prisma = getPrisma();
  const today = todayKey();
  try {
    const transit = await findCurrentTransit(prisma, today);
    if (!transit) {
      return NextResponse.json(await fallbackCurrentTransit(), {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=1800"
        }
      });
    }
    const enriched = await maybeEnrichTransit(prisma, transit);
    return NextResponse.json(mapTransit(enriched, today), {
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

async function maybeEnrichTransit(prisma: ReturnType<typeof getPrisma>, transit: Awaited<ReturnType<typeof findCurrentTransit>>) {
  if (!transit) return transit;
  const paragraphs = Array.isArray(transit.paragraphs) ? transit.paragraphs : [];
  if (paragraphs.length) return transit;
  try {
    const details = await fetchHumdesTransitDetails(transit.descriptionUrl);
    return prisma.humanDesignTransitRecord.update({
      where: { descriptionUrl: transit.descriptionUrl },
      data: {
        paragraphs: details.paragraphs,
        publishedAt: details.publishedAt || transit.publishedAt,
        fetchedAt: new Date()
      }
    });
  } catch {
    return transit;
  }
}

async function syncHumdesTransits(prisma: ReturnType<typeof getPrisma>) {
  let imported = 0;
  for (let pageNumber = 1; pageNumber <= HUMDES_TRANSIT_PAGES; pageNumber += 1) {
    const listings = await fetchHumdesTransitListings(pageNumber);
    for (const listing of listings) {
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
          paragraphs: [],
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
          fetchedAt: new Date()
        }
      });
      imported += 1;
    }
  }
  return { ok: true, importedPages: HUMDES_TRANSIT_PAGES, importedItems: imported };
}

async function fallbackCurrentTransit(): Promise<HumanDesignTransit> {
  const now = new Date();
  const url = new URL("https://app.humdes.com/transit/");
  url.searchParams.set("date", formatHumdesDate(todayKeyFromDate(now)));
  url.searchParams.set("time", defaultTime(now));
  url.searchParams.set("location", "524901");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Origin: "https://www.humdes.com",
      Referer: HUMDES_TRANSITS_URL,
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Humdes вернул ${response.status} для текущего транзита.`);
  }

  const payload = await response.json();
  const currentTransit = payload?.currentTransit;
  if (!currentTransit) throw new Error("Humdes не вернул данные currentTransit.");

  const periodStart = cleanText(currentTransit.title?.dateStart || "");
  const periodEnd = cleanText(currentTransit.title?.dateFinish || "");
  const title = [
    cleanText(currentTransit.title?.textStart || "Транзит с"),
    periodStart,
    cleanText(currentTransit.title?.textFinish || "по"),
    periodEnd
  ].filter(Boolean).join(" ");

  const gates = normalizeGates(currentTransit.gates);
  const paragraphs = extractParagraphs(currentTransit.text).slice(0, 2);
  return {
    date: todayKey(),
    fetchedAt: now.toISOString(),
    title,
    periodStart,
    periodEnd,
    listingUrl: HUMDES_TRANSITS_URL,
    descriptionUrl: HUMDES_TRANSITS_URL,
    gates,
    paragraphs,
    sourceUrl: HUMDES_TRANSITS_URL
  };
}

function mapTransit(record: Awaited<ReturnType<typeof findCurrentTransit>>, date: string): HumanDesignTransit {
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

function formatHumdesDate(date: string) {
  const [year, month, day] = date.split("-");
  return day && month && year ? `${day}.${month}.${year}` : date;
}

function todayKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultTime(date: Date) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}
