export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? parseDateOnly(value) : value;
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? parseDateOnly(value) : value;
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function toISODate(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): Date {
  const text = String(value || "").trim();
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0];

  if (dateOnly) {
    const [year, month, day] = dateOnly.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return new Date(Number.NaN);

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** Whole days between two dates (b - a). Minimum 1 for rental day counting. */
export function daysBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === "string" ? parseDateOnly(a) : a;
  const db = typeof b === "string" ? parseDateOnly(b) : b;
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 0;

  const ms = db.setHours(0, 0, 0, 0) - da.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

export function rentalDays(start: string | Date, end: string | Date): number {
  return Math.max(1, daysBetween(start, end));
}
