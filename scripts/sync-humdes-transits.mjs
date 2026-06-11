import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const HUMDES_TRANSITS_URL = "https://www.humdes.com/ru/transits/";
const HUMDES_TRANSIT_PAGES = 18;

const MONTHS = {
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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  let importedItems = 0;
  for (let pageNumber = 1; pageNumber <= HUMDES_TRANSIT_PAGES; pageNumber += 1) {
    const html = await fetchHtml(`${HUMDES_TRANSITS_URL}?PAGEN_1=${pageNumber}`);
    const items = parseListings(html, pageNumber);
    for (const item of items) {
      const details = await fetchDetails(item.descriptionUrl);
      await upsertTransit(item, details);
      importedItems += 1;
    }
    console.log(`Imported page ${pageNumber}/${HUMDES_TRANSIT_PAGES}`);
  }
  console.log(`Done: ${importedItems} transit entries imported.`);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: HUMDES_TRANSITS_URL,
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Humdes listing page failed: ${response.status} ${url}`);
  }
  return response.text();
}

function parseListings(html, pageNumber) {
  const items = [];
  const itemRegex = /<div class="transit-list__item transit-list-item">([\s\S]*?)<a href="([^"]+)" class="transit-list-item__button button button_more">Описание транзита<\/a>/g;
  for (const match of html.matchAll(itemRegex)) {
    const block = match[1];
    const descriptionUrl = absolutize(match[2]);
    const title = cleanText(matchFirst(block, /<div class="transit-list-item__title">([\s\S]*?)<\/div>/i));
    if (!title || !descriptionUrl) continue;
    const { periodStart, periodEnd } = parseDateRange(title, descriptionUrl);
    const gates = Array.from(block.matchAll(/<div class="transit-list-item__gate">([\s\S]*?)<\/div>/g))
      .map((gateMatch) => parseGate(gateMatch[1]))
      .filter(Boolean);
    items.push({
      title,
      periodStart,
      periodEnd,
      pageNumber,
      listingUrl: `${HUMDES_TRANSITS_URL}?PAGEN_1=${pageNumber}`,
      descriptionUrl,
      gates
    });
  }
  return items;
}

async function fetchDetails(descriptionUrl) {
  const html = await fetchHtml(descriptionUrl);
  const title = cleanText(matchFirst(html, /<meta property="og:title" content="([^"]+)"/i) || matchFirst(html, /<title>([^<]+)<\/title>/i));
  const publishedAt = matchFirst(html, /<meta property="article:published_time" content="([^"]+)">/i);
  const transitBody = matchFirst(html, /<div class="transit__text">([\s\S]*?)<\/div>/i);
  const decodedTransitBody = decodeEntities(transitBody);
  const paragraphs = extractTransitParagraphs(decodedTransitBody, html);
  const traits = Array.from(html.matchAll(/<div class="transit__trait">\s*<span class="transit__trait-lead">([^<]+)<\/span>\s*<div class="transit__trait-text">([\s\S]*?)<\/div>/gi))
    .map((item) => ({ lead: cleanText(item[1]), text: cleanText(stripTags(item[2])) }))
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
    title,
    paragraphs: [...paragraphs, ...extraParagraphs],
    helped: helped.length ? helped : helpedFromParagraphs,
    blocked: blocked.length ? blocked : blockedFromParagraphs,
    publishedAt: publishedAt ? new Date(publishedAt) : null
  };
}

function parseGate(block) {
  const number = cleanText(matchFirst(block, /<span class="transit-list-item__gate-number">([\s\S]*?)<\/span>/i));
  const name = cleanText(matchFirst(block, /<span class="transit-list-item__gate-name"><a [^>]*>([\s\S]*?)<\/a><\/span>/i));
  const url = absolutize(matchFirst(block, /<span class="transit-list-item__gate-name"><a href="([^"]+)"/i) || (number ? `/ru/kb/gates/${number}/` : ""));
  if (!number && !name) return null;
  return { number, name, url };
}

function parseDateRange(title, descriptionUrl) {
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
  const startMonth = MONTHS[startMonthName?.toLowerCase()] || 1;
  const endMonth = MONTHS[endMonthName?.toLowerCase()] || startMonth;
  const startYear = year;
  const endYear = endMonth < startMonth ? year + 1 : year;
  return {
    periodStart: formatIso(startYear, startMonth, startDay),
    periodEnd: formatIso(endYear, endMonth, endDay)
  };
}

async function upsertTransit(item, details) {
  let detailsEn = null;
  try {
    detailsEn = await fetchDetails(toEnglishUrl(item.descriptionUrl));
  } catch {
    detailsEn = null;
  }
  const params = [
    randomUUID(),
    item.title,
    detailsEn?.title || "",
    item.periodStart,
    item.periodEnd,
    item.listingUrl,
    item.descriptionUrl,
    item.pageNumber,
    item.gates[0]?.number || "",
    item.gates[0]?.name || "",
    item.gates[0]?.url || "",
    item.gates[1]?.number || "",
    item.gates[1]?.name || "",
    item.gates[1]?.url || "",
    JSON.stringify(item.gates),
    JSON.stringify(details?.paragraphs || []),
    JSON.stringify(detailsEn?.paragraphs || []),
    JSON.stringify(details?.helped || []),
    JSON.stringify(detailsEn?.helped || []),
    JSON.stringify(details?.blocked || []),
    JSON.stringify(detailsEn?.blocked || []),
    details?.publishedAt || null,
    new Date(),
    new Date()
  ];
  await pool.query(
    `
      INSERT INTO "HumanDesignTransitRecord"
        ("id", "title", "titleEn", "periodStart", "periodEnd", "listingUrl", "descriptionUrl", "pageNumber", "gateSunNumber", "gateSunName", "gateSunUrl", "gateEarthNumber", "gateEarthName", "gateEarthUrl", "gates", "paragraphs", "paragraphsEn", "helped", "helpedEn", "blocked", "blockedEn", "publishedAt", "fetchedAt", "updatedAt")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb, $22, $23, $24)
      ON CONFLICT ("descriptionUrl")
      DO UPDATE SET
        "title" = EXCLUDED."title",
        "titleEn" = EXCLUDED."titleEn",
        "periodStart" = EXCLUDED."periodStart",
        "periodEnd" = EXCLUDED."periodEnd",
        "listingUrl" = EXCLUDED."listingUrl",
        "pageNumber" = EXCLUDED."pageNumber",
        "gateSunNumber" = EXCLUDED."gateSunNumber",
        "gateSunName" = EXCLUDED."gateSunName",
        "gateSunUrl" = EXCLUDED."gateSunUrl",
        "gateEarthNumber" = EXCLUDED."gateEarthNumber",
        "gateEarthName" = EXCLUDED."gateEarthName",
        "gateEarthUrl" = EXCLUDED."gateEarthUrl",
        "gates" = EXCLUDED."gates",
        "paragraphs" = EXCLUDED."paragraphs",
        "paragraphsEn" = EXCLUDED."paragraphsEn",
        "helped" = EXCLUDED."helped",
        "helpedEn" = EXCLUDED."helpedEn",
        "blocked" = EXCLUDED."blocked",
        "blockedEn" = EXCLUDED."blockedEn",
        "publishedAt" = EXCLUDED."publishedAt",
        "fetchedAt" = EXCLUDED."fetchedAt",
        "updatedAt" = NOW()
    `,
    params
  );
}

function matchFirst(value, pattern) {
  return value.match(pattern)?.[1] || "";
}

function cleanText(value) {
  return decodeEntities(String(value || ""))
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|li|p|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

function extractTransitParagraphs(decodedTransitBody, html) {
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

function isHelpTrait(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes("помог") || normalized.includes("help");
}

function isBlockTrait(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes("меш") || normalized.includes("hinder") || normalized.includes("block");
}

function splitTraitText(value) {
  return String(value || "")
    .split(/\n|[•·;]/g)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function extractPrefixedTransitTrait(value, prefix) {
  if (!String(value || "").startsWith(prefix)) return [];
  return splitTraitText(String(value || "").slice(prefix.length));
}

function absolutize(value) {
  if (!value) return "";
  try {
    return new URL(value, "https://www.humdes.com").toString();
  } catch {
    return value;
  }
}

function toEnglishUrl(value) {
  return String(value || "").replace("://www.humdes.com/ru/", "://www.humdes.com/en/");
}

function extractYear(value) {
  const match = String(value || "").match(/-(\d{4})(?:\/)?$/);
  return match ? Number(match[1]) : 0;
}

function formatIso(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
