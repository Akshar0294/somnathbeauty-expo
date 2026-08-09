export const gujaratiLocale = "gu-IN-u-nu-gujr";
export type SiteLocale = "en-IN" | typeof gujaratiLocale;

export function formatNumber(value: number, locale: SiteLocale = "en-IN") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDigits(value: string | number, locale: SiteLocale = "en-IN") {
  const text = String(value);
  if (locale === "en-IN") return text;
  const digits = "૦૧૨૩૪૫૬૭૮૯";
  return text.replace(/\d/g, (digit) => digits[Number(digit)]);
}

export function formatINR(amount: number, locale: SiteLocale = "en-IN") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function formatEventDate(startDate: string, endDate: string, locale: SiteLocale = "en-IN") {
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  const startLabel = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(start);
  const endLabel = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(end);
  return startDate === endDate ? startLabel : startLabel + " – " + endLabel;
}

export function formatEventTime(value: string, locale: SiteLocale = "en-IN") {
  return formatDigits(value.slice(0, 8), locale);
}

export function formatDateTime(value: string | Date, locale: SiteLocale = "en-IN") {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
