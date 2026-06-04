import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  PackageCheck,
  Clock,
  ReceiptText,
  CalendarClock,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/store/AppStore";
import { SummaryCard } from "@/components/common/SummaryCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDate, formatNumber, parseDateOnly, toISODate } from "@/lib/format";
import { txTotal, returnTiming } from "@/lib/rental";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rentory" },
      { name: "description", content: "Ringkasan operasional rental: stok, transaksi aktif, pengembalian, dan pendapatan." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { items, transactions, payments, getCustomer } = useStore();

  const totalStok = items.reduce((s, i) => s + i.stok_total, 0);
  const stokTersedia = items.reduce((s, i) => s + i.stok_di_gudang, 0);
  const stokDisewa = items.reduce((s, i) => s + i.stok_sedang_keluar, 0);
  const transaksiAktif = transactions.filter((t) =>
    ["Booking", "Siap Keluar", "Sedang Disewa"].includes(t.status),
  );

  const kembaliHariIni = transactions.filter(
    (t) => t.status === "Sedang Disewa" && returnTiming(t.tanggal_rencana_kembali).days <= 0,
  );
  const kembaliHariIniList = transactions.filter(
    (t) =>
      t.status === "Sedang Disewa" &&
      t.tanggal_rencana_kembali.slice(0, 10) === toISODate(new Date()),
  );

  const now = new Date();
  const pendapatanBulanIni = payments
    .filter((p) => {
      const d = parseDateOnly(p.tanggal);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.nominal, 0);

  const transaksiTerbaru = [...transactions].slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional rental hari ini."
        actions={
          <Button asChild>
            <Link to="/transaksi">
              <ReceiptText /> Transaksi Baru
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Total Barang" value={formatNumber(totalStok)} icon={Package} tone="primary" hint={`${items.length} jenis barang`} />
        <SummaryCard label="Barang Tersedia" value={formatNumber(stokTersedia)} icon={PackageCheck} tone="success" />
        <SummaryCard label="Sedang Disewa" value={formatNumber(stokDisewa)} icon={Clock} tone="warning" />
        <SummaryCard label="Transaksi Aktif" value={formatNumber(transaksiAktif.length)} icon={ReceiptText} tone="info" />
        <SummaryCard label="Pengembalian Hari Ini" value={formatNumber(kembaliHariIni.length)} icon={CalendarClock} tone="danger" hint="Termasuk yang terlambat" />
        <SummaryCard label="Pendapatan Bulan Ini" value={formatRupiah(pendapatanBulanIni)} icon={Wallet} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Transaksi Terbaru</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/transaksi">
                Lihat semua <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {transaksiTerbaru.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{getCustomer(t.customerId)?.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.kode} · {formatDate(t.tanggal_mulai)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-sm font-semibold sm:block">{formatRupiah(txTotal(t))}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Harus Kembali Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kembaliHariIniList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada pengembalian terjadwal hari ini.
              </p>
            ) : (
              kembaliHariIniList.map((t) => (
                <div key={t.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{getCustomer(t.customerId)?.nama}</p>
                    <StatusBadge status={returnTiming(t.tanggal_rencana_kembali).overdue ? "Overdue" : "Tepat Waktu"} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.items.map((i) => `${i.nama} ×${i.qty}`).join(", ")}
                  </p>
                </div>
              ))
            )}
            <Button asChild variant="outline" className="mt-1 w-full">
              <Link to="/sedang-disewa">Proses Pengembalian</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
