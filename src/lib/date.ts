export function todayKey() {
  return toKey(new Date());
}

export function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatDate(key: string, mode: "short" | "long" = "long", language: "ru" | "en" = "ru") {
  const date = fromKey(key);
  return date.toLocaleDateString(
    language === "en" ? "en-US" : "ru-RU",
    mode === "short"
      ? { day: "2-digit", month: "2-digit" }
      : { day: "numeric", month: "long", weekday: "long" }
  );
}

export function weekdayShort(key: string, language: "ru" | "en" = "ru") {
  return fromKey(key).toLocaleDateString(language === "en" ? "en-US" : "ru-RU", { weekday: "short" }).replace(".", "");
}

export function rangeDates(startKey: string, endKey: string) {
  const start = fromKey(startKey);
  const end = fromKey(endKey);
  const dates: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    dates.push(toKey(d));
    if (dates.length > 370) break;
  }
  return dates;
}
