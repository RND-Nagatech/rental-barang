import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Transaction, ItemCondition } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ImageUploader } from "@/components/common/ImageUploader";
import { absoluteFileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatRupiah, toISODate } from "@/lib/format";
import { returnTiming, txTotal } from "@/lib/rental";

export const Route = createFileRoute("/serah-terima-kembali")({
  validateSearch: (s: Record<string, unknown>) => ({ tx: (s.tx as string) || "" }),
  head: () => ({ meta: [{ title: "Serah Terima Kembali — Rentory" }] }),
  component: Page,
});

const CONDITIONS: ItemCondition[] = [
  "Baik",
  "Lecet Ringan",
  "Rusak Ringan",
  "Rusak Berat",
  "Hilang",
];

function Page() {
  const { tx } = Route.useSearch();
  const { transactions, getCustomer, getItem, updateTransaction } = useStore();
  const list = transactions.filter((t) => t.status === "Sedang Disewa");
  const selected = list.find((t) => t.id === tx) ?? list[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serah Terima Kembali"
        description="Periksa kondisi barang kembali dan hitung denda otomatis."
      />
      {!selected ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Tidak ada transaksi yang perlu dikembalikan.
        </div>
      ) : (
        <KembaliForm
          key={selected.id}
          t={selected}
          customer={getCustomer(selected.customerId)?.nama ?? "-"}
          getDenda={(id) => getItem(id)?.denda_per_hari ?? 0}
          satuan={(id) => getItem(id)?.satuan || "unit"}
          onDone={updateTransaction}
        />
      )}
    </div>
  );
}

function KembaliForm({
  t,
  customer,
  getDenda,
  satuan,
  onDone,
}: {
  t: Transaction;
  customer: string;
  getDenda: (id: string) => number;
  satuan: (id: string) => string;
  onDone: (t: Transaction) => void;
}) {
  const navigate = useNavigate();
  const timing = returnTiming(t.tanggal_rencana_kembali);
  const lateDays = timing.overdue ? timing.days : 0;

  const [lines, setLines] = React.useState(
    t.items.map((l) => ({
      ...l,
      qty_kembali: l.qty_keluar || l.qty,
      kondisi_kembali: "Baik" as ItemCondition,
    })),
  );
  const [biayaKerusakan, setBiayaKerusakan] = React.useState(0);
  const [biayaKehilangan, setBiayaKehilangan] = React.useState(0);

  const dendaTerlambat = t.items.reduce((s, l) => s + getDenda(l.itemId) * l.qty, 0) * lateDays;
  const totalDenda = dendaTerlambat + biayaKerusakan + biayaKehilangan;
  const total = txTotal(t);
  const sisaSebelumDeposit = Math.max(0, total + totalDenda - t.terbayar);
  const depositDipotong = Math.min(t.depositDiterima, totalDenda);
  const depositDikembalikan = Math.max(0, t.depositDiterima - depositDipotong);
  const sisaTagihan = Math.max(0, sisaSebelumDeposit - depositDipotong);

  function finish() {
    onDone({
      ...t,
      items: lines,
      tanggal_kembali: toISODate(new Date()),
      status: "Selesai",
      dendaKeterlambatan: dendaTerlambat,
      dendaKerusakan: biayaKerusakan,
      dendaKehilangan: biayaKehilangan,
      paymentStatus: sisaTagihan > 0 ? "Dibayar Sebagian" : "Lunas",
    });
    toast.success(`${t.kode} → Selesai.`);
    navigate({ to: "/transaksi" });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display text-base">
            {t.kode} · {customer}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Harus kembali {formatDate(t.tanggal_rencana_kembali)}
          </p>
        </div>
        <StatusBadge status={timing.overdue ? "Overdue" : "Tepat Waktu"} />
      </CardHeader>
      <CardContent className="space-y-4">
        {lines.map((l, idx) => (
          <div key={l.itemId} className="rounded-lg border bg-card p-3">
            <p className="text-sm font-semibold">{l.nama}</p>
            <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                Kondisi awal: <span className="font-medium text-foreground">{l.kondisi_awal}</span>
              </p>
              <p>
                Catatan awal: <span className="text-foreground">{l.catatan || "-"}</span>
              </p>
              {l.foto_kondisi_awal?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {l.foto_kondisi_awal.map((foto, index) => (
                    <a
                      key={foto}
                      href={absoluteFileUrl(foto)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border bg-card px-2 py-1 hover:text-primary"
                    >
                      Foto awal {index + 1}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Qty Keluar</Label>
                <Input type="number" className="h-9" value={l.qty_keluar || l.qty} disabled />
                <p className="text-xs text-muted-foreground">{satuan(l.itemId)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Qty Kembali</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={l.qty_kembali}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, i) => (i === idx ? { ...x, qty_kembali: +e.target.value } : x)),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">{satuan(l.itemId)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kondisi Awal</Label>
                <Input className="h-9" value={l.kondisi_awal} disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kondisi Kembali</Label>
                <Select
                  value={l.kondisi_kembali}
                  onValueChange={(v) =>
                    setLines(
                      lines.map((x, i) =>
                        i === idx ? { ...x, kondisi_kembali: v as ItemCondition } : x,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Catatan Kerusakan</Label>
                <Input
                  className="h-9"
                  value={l.catatan}
                  placeholder="opsional"
                  onChange={(e) =>
                    setLines(
                      lines.map((x, i) => (i === idx ? { ...x, catatan: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <ImageUploader
                label="Upload foto kembali"
                multiple
                value={l.foto_kondisi_kembali || []}
                onChange={(value) =>
                  setLines(
                    lines.map((x, i) =>
                      i === idx ? { ...x, foto_kondisi_kembali: value as string[] } : x,
                    ),
                  )
                }
              />
            </div>
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Biaya Kerusakan</Label>
            <CurrencyInput value={biayaKerusakan} onChange={setBiayaKerusakan} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Biaya Kehilangan</Label>
            <CurrencyInput value={biayaKehilangan} onChange={setBiayaKehilangan} />
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
          <Row
            label={`Denda Keterlambatan (${lateDays} hari)`}
            value={formatRupiah(dendaTerlambat)}
          />
          <Row label="Denda Kerusakan" value={formatRupiah(biayaKerusakan)} />
          <Row label="Denda Barang Hilang" value={formatRupiah(biayaKehilangan)} />
          <Row label="Total Denda" value={formatRupiah(totalDenda)} bold />
          <div className="my-1 border-t" />
          <Row label="Deposit Dipotong" value={`- ${formatRupiah(depositDipotong)}`} muted />
          <Row label="Deposit Dikembalikan" value={formatRupiah(depositDikembalikan)} muted />
          <div className="my-1 border-t" />
          <Row label="Sisa Tagihan" value={formatRupiah(sisaTagihan)} bold />
        </div>

        <Button className="w-full" onClick={finish}>
          <CheckCircle2 /> Selesaikan Transaksi
        </Button>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${bold ? "font-bold" : ""} ${muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
