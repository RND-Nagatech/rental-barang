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
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whole days between two dates (b - a). Minimum 1 for rental day counting. */
export function daysBetween(a: string | Date, b: string | Date): number {
  const da = new Date(typeof a === "string" ? a : a.toISOString());
  const db = new Date(typeof b === "string" ? b : b.toISOString());
  const ms = db.setHours(0, 0, 0, 0) - da.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

export function rentalDays(start: string | Date, end: string | Date): number {
  return Math.max(1, daysBetween(start, end));
}
