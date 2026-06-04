import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Transaction, ItemCondition, PaymentMethod } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ImageUploader } from "@/components/common/ImageUploader";
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

export const Route = createFileRoute("/serah-terima-keluar")({
  head: () => ({ meta: [{ title: "Serah Terima Keluar — Rentory" }] }),
  component: Page,
});

const CONDITIONS: ItemCondition[] = ["Baik", "Lecet Ringan", "Rusak Ringan"];

function Page() {
  const { transactions, getCustomer, getItem, updateTransaction } = useStore();
  const list = transactions.filter((t) => t.status === "Siap Keluar");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serah Terima Keluar"
        description="Catat kondisi awal & deposit, lalu keluarkan barang."
      />
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Tidak ada transaksi siap keluar.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((t) => (
            <KeluarCard
              key={t.id}
              t={t}
              customer={getCustomer(t.customerId)?.nama ?? "-"}
              satuan={(id) => getItem(id)?.satuan || "unit"}
              onSubmit={updateTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KeluarCard({
  t,
  customer,
  satuan,
  onSubmit,
}: {
  t: Transaction;
  customer: string;
  satuan: (id: string) => string;
  onSubmit: (t: Transaction) => void;
}) {
  const [lines, setLines] = React.useState(
    t.items.map((l) => ({
      ...l,
      qty_keluar: l.qty_disiapkan || l.qty,
      kondisi_awal: "Baik" as ItemCondition,
    })),
  );
  const [depositNominal, setDepositNominal] = React.useState(
    t.deposit_received > 0 ? t.deposit_received : t.deposit_required,
  );
  const [depositMethod, setDepositMethod] = React.useState<PaymentMethod>(
    t.deposit_received_method || "Transfer",
  );
  const [depositNote, setDepositNote] = React.useState(t.deposit_received_note || "");

  function submit() {
    const invalidLine = lines.find(
      (line) =>
        !line.kondisi_awal ||
        !line.foto_kondisi_awal?.length ||
        Number(line.qty_keluar || 0) <= 0,
    );

    if (invalidLine) {
      toast.error("Qty keluar, kondisi awal, dan foto awal wajib diisi untuk semua barang.");
      return;
    }

    onSubmit({
      ...t,
      items: lines,
      deposit_required: t.deposit_required,
      deposit_received: depositNominal,
      deposit_received_date: toISODate(new Date()),
      deposit_status: depositNominal > 0 ? "Diterima" : "Belum Diterima",
      deposit_received_method: depositMethod,
      deposit_received_note: depositNote,
      tanggal_keluar: toISODate(new Date()),
      status: "Sedang Disewa",
    });
    toast.success(`${t.kode} → Sedang Disewa. Barang keluar.`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display text-base">{t.kode}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {customer} · rencana kembali {formatDate(t.tanggal_rencana_kembali)}
          </p>
        </div>
        <StatusBadge status={t.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {lines.map((l, idx) => (
            <div key={l.itemId} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.nama}</p>
                <span className="text-xs text-muted-foreground">
                  Qty pesan: {l.qty} {satuan(l.itemId)}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qty Keluar</Label>
                  <Input
                    type="number"
                    className="h-9"
                    value={l.qty_keluar}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, i) =>
                          i === idx ? { ...x, qty_keluar: +e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kondisi Awal</Label>
                  <Select
                    value={l.kondisi_awal}
                    onValueChange={(v) =>
                      setLines(
                        lines.map((x, i) =>
                          i === idx ? { ...x, kondisi_awal: v as ItemCondition } : x,
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Catatan Kondisi</Label>
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
              </div>
              <div className="mt-3">
                <ImageUploader
                  label="Upload foto kondisi awal"
                  multiple
                  value={l.foto_kondisi_awal || []}
                  onChange={(value) =>
                    setLines(
                      lines.map((x, i) =>
                        i === idx ? { ...x, foto_kondisi_awal: value as string[] } : x,
                      ),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Deposit</p>
          <p className="text-xs text-muted-foreground">
            Deposit adalah jaminan barang dan dicatat saat serah terima keluar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Deposit Wajib</Label>
              <Input value={formatRupiah(t.deposit_required)} className="h-9" disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nominal Deposit Diterima</Label>
              <CurrencyInput value={depositNominal} onChange={setDepositNominal} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Metode Pembayaran</Label>
              <Select
                value={depositMethod}
                onValueChange={(value) => setDepositMethod(value as PaymentMethod)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Tunai", "Transfer", "QRIS", "Kartu"].map((metode) => (
                    <SelectItem key={metode} value={metode}>
                      {metode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Catatan Deposit</Label>
              <Input
                className="h-9"
                value={depositNote}
                placeholder="opsional"
                onChange={(e) => setDepositNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Signature label="Tanda Tangan Admin" />
          <Signature label="Tanda Tangan Customer" />
        </div>

        <Button className="w-full" onClick={submit}>
          <ArrowUpFromLine /> Barang Keluar
        </Button>
      </CardContent>
    </Card>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid h-24 place-items-center rounded-lg border-2 border-dashed text-xs italic text-muted-foreground">
        Area tanda tangan (dummy)
      </div>
    </div>
  );
}
