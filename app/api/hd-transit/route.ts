import { NextResponse } from "next/server";
import type { HumanDesignTransit, HumanDesignTransitGate } from "../../../src/types";

const HUMDES_TRANSIT_PAGE = "https://www.humdes.com/ru/transit/";
const HUMDES_TRANSIT_API = "https://app.humdes.com/transit/";
const HUMDES_DEFAULT_LOCATION = 524901;

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  const now = new Date();
  try {
    const transit = await fetchHumdesTransit(now);
    return NextResponse.json(transit, {
      headers: {
        "Cache-Control": "public, max-age=900, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Не удалось загрузить транзит Human Design."
      },
      { status: 502 }
    );
  }
}

async function fetchHumdesTransit(now: Date): Promise<HumanDesignTransit> {
  const url = new URL(HUMDES_TRANSIT_API);
  url.searchParams.set("date", formatHumdesDate(toKey(now)));
  url.searchParams.set("time", defaultTime(now));
  url.searchParams.set("location", String(HUMDES_DEFAULT_LOCATION));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Origin: "https://www.humdes.com",
      Referer: HUMDES_TRANSIT_PAGE,
      "User-Agent": "Mozilla/5.0"
    },
    next: { revalidate: 900 }
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
  if (!gates.length && !paragraphs.length) throw new Error("Humdes вернул транзит без ворот и описания.");

  return {
    date: toKey(now),
    fetchedAt: now.toISOString(),
    title,
    periodStart,
    periodEnd,
    gates,
    paragraphs,
    sourceUrl: HUMDES_TRANSIT_PAGE
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

function defaultTime(date: Date) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function toKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
