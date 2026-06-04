import type { Transaction, TransactionLine } from "@/data/types";
import { rentalDays, daysBetween, parseDateOnly, toISODate } from "./format";

export function txDays(t: Pick<Transaction, "tanggal_mulai" | "tanggal_rencana_kembali">): number {
  return rentalDays(t.tanggal_mulai, t.tanggal_rencana_kembali);
}

export function lineSubtotal(line: TransactionLine, days: number): number {
  return line.qty * line.harga_sewa * days;
}

export function txSubtotal(t: Transaction): number {
  const days = txDays(t);
  return t.items.reduce((sum, l) => sum + lineSubtotal(l, days), 0);
}

export function txTotal(t: Transaction): number {
  return Math.max(0, txSubtotal(t) - (t.diskon || 0));
}

export function txSisaTagihan(t: Transaction): number {
  const totalDenda =
    (t.dendaKeterlambatan || 0) + (t.dendaKerusakan || 0) + (t.dendaKehilangan || 0);
  return Math.max(0, txTotal(t) + totalDenda - (t.terbayar || 0));
}

/** Negative = sisa hari, positive = jumlah hari terlambat. Returns object. */
export function returnTiming(plannedReturn: string, reference?: Date) {
  const ref = reference ?? new Date();
  const diff = daysBetween(ref, parseDateOnly(plannedReturn)); // planned - today
  if (diff >= 0) return { overdue: false, days: diff, label: `${diff} hari lagi` };
  return { overdue: true, days: -diff, label: `Terlambat ${-diff} hari` };
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) === toISODate(new Date());
}

export function totalQty(line: TransactionLine): number {
  return line.qty;
}
