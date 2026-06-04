import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "primary" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/12 text-info border-info/25",
  primary: "bg-primary/12 text-primary border-primary/25",
  success: "bg-success/15 text-success border-success/25",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
};

const statusTone: Record<string, Tone> = {
  // Transaksi
  Draft: "neutral",
  Booking: "info",
  "Siap Keluar": "warning",
  "Sedang Disewa": "primary",
  "Serah Terima Kembali": "info",
  Selesai: "success",
  Dibatalkan: "danger",
  // Pembayaran
  "Belum Bayar": "danger",
  "Dibayar Sebagian": "warning",
  "Belum Lunas": "danger",
  Sebagian: "warning",
  Lunas: "success",
  // Barang
  Tersedia: "success",
  "Disewa Sebagian": "warning",
  "Full Disewa": "danger",
  "Sebagian Disewa": "warning",
  Habis: "danger",
  Maintenance: "neutral",
  // Kondisi
  Baik: "success",
  "Lecet Ringan": "info",
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
  Hilang: "danger",
  // generic
  Overdue: "danger",
  "Tepat Waktu": "success",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
