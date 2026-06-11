import type { HumanDesignTransit, HumanDesignTransitGate } from "../types";

export const HUMDES_TRANSITS_URL = "https://www.humdes.com/ru/transits/";
export const HUMDES_SITE_URL = "https://www.humdes.com";
export const HUMDES_TRANSIT_PAGES = 18;

type TransitListing = {
  title: string;
  periodStart: string;
  periodEnd: string;
  pageNumber: number;
  listingUrl: string;
  descriptionUrl: string;
  gates: HumanDesignTransitGate[];
};

export async function fetchHumdesTransitListings(pageNumber: number, signal?: AbortSignal) {
  const url = new URL(HUMDES_TRANSITS_URL);
  url.searchParams.set("PAGEN_1", String(pageNumber));
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: HUMDES_TRANSITS_URL,
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Humdes listing page ${pageNumber} returned ${response.status}`);
  }
  const html = await response.text();
  return parseTransitListings(html, pageNumber);
}

export async function fetchHumdesTransitDetails(descriptionUrl: string, signal?: AbortSignal) {
  const response = await fetch(descriptionUrl, {
    signal,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: HUMDES_TRANSITS_URL,
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Humdes transit detail returned ${response.status} for ${descriptionUrl}`);
  }
  const html = await response.text();
  return parseTransitDetail(html, descriptionUrl);
}

export function parseTransitListings(html: string, pageNumber: number): TransitListing[] {
  const items = Array.from(html.matchAll(/<div class="transit-list__item transit-list-item">([\s\S]*?)<\/div>\s*<\/div>/g));
  return items.flatMap((match) => {
    const block = match[1];
    const title = cleanText(matchFirst(block, /<div class="transit-list-item__title">([\s\S]*?)<\/div>/i));
    const descriptionUrl = absolutizeHumdesUrl(matchFirst(block, /<a href="([^"]+)" class="transit-list-item__button button button_more">/i));
    if (!title || !descriptionUrl) return [];
    const { periodStart, periodEnd } = parseTransitDateRange(title, descriptionUrl);
    const gates = Array.from(block.matchAll(/<div class="transit-list-item__gate">([\s\S]*?)<\/div>/g))
      .map((gateMatch): HumanDesignTransitGate | null => {
        const gateBlock = gateMatch[1];
        const number = cleanText(matchFirst(gateBlock, /<span class="transit-list-item__gate-number">([\s\S]*?)<\/span>/i));
        const name = cleanText(matchFirst(gateBlock, /<span class="transit-list-item__gate-name"><a [^>]*>([\s\S]*?)<\/a><\/span>/i));
        const url = absolutizeHumdesUrl(matchFirst(gateBlock, /<span class="transit-list-item__gate-name"><a href="([^"]+)"/i) || (number ? `/ru/kb/gates/${number}/` : ""));
        return number || name ? { number, name, url } : null;
      })
      .filter((gate): gate is HumanDesignTransitGate => Boolean(gate));

    return [{
      title,
      periodStart,
      periodEnd,
      pageNumber,
      listingUrl: `${HUMDES_TRANSITS_URL}?PAGEN_1=${pageNumber}`,
      descriptionUrl,
      gates
    }];
  });
}

export function parseTransitDetail(html: string, descriptionUrl: string) {
  const pageTitle = cleanText(matchFirst(html, /<meta property="og:title" content="([^"]+)"/i) || matchFirst(html, /<title>([^<]+)<\/title>/i));
  const publishedAt = matchFirst(html, /<meta property="article:published_time" content="([^"]+)">/i);
  const transitBody = matchFirst(html, /<div class="transit__text">([\s\S]*?)<\/div>/i);
  const decodedTransitBody = decodeEntities(transitBody);
  const paragraphs = extractTransitParagraphs(decodedTransitBody, html);
  const traits = Array.from(html.matchAll(/<div class="transit__trait">\s*<span class="transit__trait-lead">([^<]+)<\/span>\s*<div class="transit__trait-text">([\s\S]*?)<\/div>/gi))
    .map((item) => {
      const lead = cleanText(item[1]);
      const text = cleanText(stripTags(item[2]));
      return { lead, text };
    })
    .filter((item) => Boolean(item.lead || item.text));
  const helped = traits
    .filter((item) => isHelpTrait(item.lead))
    .flatMap((item) => splitTraitText(item.text))
    .filter(Boolean);
  const blocked = traits
    .filter((item) => isBlockTrait(item.lead))
    .flatMap((item) => splitTraitText(item.text))
    .filter(Boolean);
  const extraParagraphs = traits
    .filter((item) => !isHelpTrait(item.lead) && !isBlockTrait(item.lead))
    .map((item) => `${item.lead} ${item.text}`.trim())
    .filter(Boolean);
  const helpedFromParagraphs = paragraphs
    .flatMap((paragraph) => extractPrefixedTransitTrait(paragraph, "Помогают:"))
    .filter(Boolean);
  const blockedFromParagraphs = paragraphs
    .flatMap((paragraph) => extractPrefixedTransitTrait(paragraph, "Мешают:"))
    .filter(Boolean);
  return {
    title: pageTitle,
    descriptionUrl,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    paragraphs: [...paragraphs, ...extraParagraphs],
    helped: helped.length ? helped : helpedFromParagraphs,
    blocked: blocked.length ? blocked : blockedFromParagraphs
  };
}

export function parseTransitDateRange(title: string, descriptionUrl: string) {
  const year = extractYear(descriptionUrl) || new Date().getFullYear();
  const normalized = title.replace(/^Транзит с\s+/i, "");
  const match = normalized.match(/^(\d{1,2})(?:\s+([а-яё]+))?\s+по\s+(\d{1,2})(?:\s+([а-яё]+))?$/i);
  if (!match) {
    return {
      periodStart: `${year}-01-01`,
      periodEnd: `${year}-01-01`
    };
  }
  const startDay = Number(match[1]);
  const startMonthName = match[2] || match[4] || "";
  const endDay = Number(match[3]);
  const endMonthName = match[4] || match[2] || "";
  const startMonth = monthNumber(startMonthName);
  const endMonth = monthNumber(endMonthName);
  const startYear = year;
  const endYear = startMonth && endMonth && endMonth < startMonth ? year + 1 : year;
  return {
    periodStart: formatIsoDate(startYear, startMonth || 1, startDay),
    periodEnd: formatIsoDate(endYear, endMonth || startMonth || 1, endDay)
  };
}

export async function fetchCurrentTransitFallback(now: Date) {
  const url = new URL("https://app.humdes.com/transit/");
  url.searchParams.set("date", formatHumdesDate(toKey(now)));
  url.searchParams.set("time", defaultTime(now));
  url.searchParams.set("location", "524901");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Origin: HUMDES_SITE_URL,
      Referer: HUMDES_TRANSITS_URL,
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Humdes current transit request failed with ${response.status}`);
  }
  const payload = await response.json();
  const currentTransit = payload?.currentTransit;
  if (!currentTransit) throw new Error("Humdes did not return currentTransit");

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
  const { helped, blocked } = extractTransitTraits(currentTransit.text, currentTransit);
  return {
    date: toKey(now),
    fetchedAt: now.toISOString(),
    title,
    periodStart,
    periodEnd,
    listingUrl: HUMDES_TRANSITS_URL,
    descriptionUrl: HUMDES_TRANSITS_URL,
    gates,
    paragraphs,
    helped,
    blocked,
    sourceUrl: HUMDES_TRANSITS_URL
  } satisfies HumanDesignTransit;
}

export function toEnglishHumdesUrl(value: string) {
  return value.replace("://www.humdes.com/ru/", "://www.humdes.com/en/");
}

export function normalizeTransitRecord(input: {
  date: string;
  fetchedAt: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  listingUrl: string;
  descriptionUrl: string;
  gates: HumanDesignTransitGate[];
  paragraphs: string[];
  sourceUrl: string;
}): HumanDesignTransit {
  return input;
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

function extractTransitTraits(value: unknown, fallback?: Record<string, unknown>) {
  const helped = normalizeTraitList(
    fallback?.helped ??
      fallback?.helps ??
      fallback?.helpers ??
      fallback?.good ??
      extractTraitSection(value, "помог")
  );
  const blocked = normalizeTraitList(
    fallback?.blocked ??
      fallback?.hinders ??
      fallback?.bad ??
      extractTraitSection(value, "меш")
  );
  return { helped, blocked };
}

function extractTraitSection(value: unknown, keyword: string) {
  const html = String(value || "");
  const sections = Array.from(html.matchAll(/<div class="transit__trait">\s*<span class="transit__trait-lead">([^<]+)<\/span>\s*<div class="transit__trait-text">([\s\S]*?)<\/div>/gi))
    .map((item) => ({ lead: cleanText(item[1]), text: cleanText(stripTags(item[2])) }));
  const match = sections.find((item) => item.lead.toLowerCase().includes(keyword));
  return match ? `${match.lead}\n${match.text}` : "";
}

function normalizeTraitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return cleanText(item);
        if (item && typeof item === "object") {
          const raw = item as Record<string, unknown>;
          return cleanText(String(raw.text || raw.title || raw.name || raw.value || ""));
        }
        return cleanText(String(item));
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\n|[•·;]/g)
      .map((item) => cleanText(item))
      .filter(Boolean);
  }
  return [];
}

function extractTransitParagraphs(decodedTransitBody: string, html: string) {
  const directParagraphs = Array.from(decodedTransitBody.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((item) => cleanText(stripTags(item[1])))
    .filter(Boolean);
  if (directParagraphs.length) return directParagraphs;

  const ogDescription = decodeEntities(matchFirst(html, /<meta property="og:description" content="([^"]+)"/i));
  const ogParagraphs = Array.from(ogDescription.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((item) => cleanText(stripTags(item[1])))
    .filter(Boolean);
  if (ogParagraphs.length) return ogParagraphs;

  return cleanText(stripTags(decodedTransitBody))
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function isHelpTrait(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("помог") || normalized.includes("help");
}

function isBlockTrait(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("меш") || normalized.includes("hinder") || normalized.includes("block");
}

function splitTraitText(value: string) {
  return value
    .split(/\n|[•·;]/g)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function extractPrefixedTransitTrait(value: string, prefix: string) {
  if (!value.startsWith(prefix)) return [];
  return splitTraitText(value.slice(prefix.length));
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

function matchFirst(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1] || "";
}

function absolutizeHumdesUrl(value: string) {
  try {
    return new URL(value, HUMDES_SITE_URL).toString();
  } catch {
    return value;
  }
}

function extractYear(value: string) {
  const match = value.match(/-(\d{4})(?:\/)?$/);
  return match ? Number(match[1]) : 0;
}

function monthNumber(value: string) {
  const normalized = value.toLowerCase();
  const months: Record<string, number> = {
    "января": 1,
    "февраля": 2,
    "марта": 3,
    "апреля": 4,
    "мая": 5,
    "июня": 6,
    "июля": 7,
    "августа": 8,
    "сентября": 9,
    "октября": 10,
    "ноября": 11,
    "декабря": 12
  };
  return months[normalized] || 0;
}

function formatIsoDate(year: number, month: number, day: number) {
  const safeMonth = String(month).padStart(2, "0");
  const safeDay = String(day).padStart(2, "0");
  return `${year}-${safeMonth}-${safeDay}`;
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
