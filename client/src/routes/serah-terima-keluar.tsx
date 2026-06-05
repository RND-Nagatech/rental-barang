import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpFromLine, Eye } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Transaction, ItemCondition, PaymentMethod, GuaranteeStatus } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ImageUploader } from "@/components/common/ImageUploader";
import { DataTable, type Column } from "@/components/common/DataTable";
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
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [filterJaminan, setFilterJaminan] = React.useState("all");
  const list = transactions.filter((t) => t.status === "Siap Keluar");
  const selected = list.find((t) => t.id === selectedId) || null;
  const rows = list
    .filter((t) => filterJaminan === "all" || t.jenis_jaminan === filterJaminan)
    .map((t) => ({
      ...t,
      customer: getCustomer(t.customerId)?.nama ?? "-",
      barang: t.items.map((item) => `${item.nama} x${item.qty}`).join(", "),
      qtyTotal: t.items.reduce((sum, item) => sum + item.qty, 0),
    }));
  const columns: Column<(typeof rows)[number]>[] = [
    { key: "kode", header: "Kode" },
    { key: "customer", header: "Customer" },
    {
      key: "periode",
      header: "Periode",
      render: (row) => `${formatDate(row.tanggal_mulai)} - ${formatDate(row.tanggal_rencana_kembali)}`,
    },
    { key: "barang", header: "Barang", className: "max-w-xs truncate" },
    { key: "qtyTotal", header: "Qty" },
    { key: "jaminan", header: "Jaminan", render: (row) => row.jenis_jaminan },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedId(row.id);
          }}
        >
          <Eye /> Proses
        </Button>
      ),
    },
  ];

  if (selected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Serah Terima Keluar"
          description="Catat kondisi awal & deposit, lalu keluarkan barang."
          actions={
            <Button variant="outline" onClick={() => setSelectedId(null)}>
              <ArrowLeft /> Kembali
            </Button>
          }
        />
        <KeluarCard
          key={selected.id}
          t={selected}
          customer={getCustomer(selected.customerId)?.nama ?? "-"}
          satuan={(id) => getItem(id)?.satuan || "unit"}
          onSubmit={updateTransaction}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serah Terima Keluar"
        description="Catat kondisi awal & deposit, lalu keluarkan barang."
      />
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        searchKeys={["kode", "customer", "barang", "status"]}
        searchPlaceholder="Cari kode, customer, atau barang..."
        toolbar={
          <Select value={filterJaminan} onValueChange={setFilterJaminan}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua jaminan</SelectItem>
              <SelectItem value="Deposit Uang">Deposit Uang</SelectItem>
              <SelectItem value="Dokumen">Dokumen</SelectItem>
              <SelectItem value="Deposit + Dokumen">Deposit + Dokumen</SelectItem>
              <SelectItem value="Tanpa Jaminan">Tanpa Jaminan</SelectItem>
            </SelectContent>
          </Select>
        }
        onRowClick={(row) => setSelectedId(row.id)}
        emptyMessage="Tidak ada transaksi siap keluar."
      />
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
  const [nomorDokumen, setNomorDokumen] = React.useState(t.nomor_dokumen || "");
  const [fotoDokumen, setFotoDokumen] = React.useState(t.foto_dokumen || []);
  const butuhDeposit = ["Deposit Uang", "Deposit + Dokumen"].includes(t.jenis_jaminan);
  const butuhDokumen = ["Dokumen", "Deposit + Dokumen"].includes(t.jenis_jaminan);

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

    if (butuhDeposit && depositNominal <= 0) {
      toast.error("Nominal jaminan deposit wajib diisi saat serah terima keluar.");
      return;
    }

    if (butuhDokumen && (!nomorDokumen || !fotoDokumen.length)) {
      toast.error("Nomor dokumen dan foto dokumen wajib diisi untuk jaminan dokumen.");
      return;
    }

    const statusJaminan: GuaranteeStatus =
      (butuhDeposit ? depositNominal > 0 : true) && (butuhDokumen ? !!nomorDokumen : true)
        ? "Diterima"
        : "Belum Diterima";

    onSubmit({
      ...t,
      items: lines,
      deposit_required: t.deposit_required,
      deposit_received: butuhDeposit ? depositNominal : 0,
      deposit_received_date: butuhDeposit ? toISODate(new Date()) : null,
      deposit_status: butuhDeposit && depositNominal > 0 ? "Diterima" : "Belum Diterima",
      deposit_received_method: depositMethod,
      deposit_received_note: depositNote,
      nomor_dokumen: butuhDokumen ? nomorDokumen : "",
      foto_dokumen: butuhDokumen ? fotoDokumen : [],
      status_jaminan: statusJaminan,
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
          <p className="text-sm font-semibold">Jaminan</p>
          <p className="text-xs text-muted-foreground">
            Data jaminan diambil dari transaksi dan diterima saat serah terima keluar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Jenis Jaminan</Label>
              <Input value={t.jenis_jaminan} className="h-9" disabled />
            </div>
            {butuhDeposit && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nominal Jaminan</Label>
                  <Input value={formatRupiah(t.nominal_jaminan)} className="h-9" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nominal Diterima</Label>
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
              </>
            )}
            {butuhDokumen && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jenis Dokumen</Label>
                  <Input value={t.jenis_dokumen} className="h-9" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nomor Dokumen</Label>
                  <Input
                    className="h-9"
                    value={nomorDokumen}
                    placeholder="Nomor dokumen"
                    onChange={(e) => setNomorDokumen(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ImageUploader
                    label="Upload foto dokumen"
                    multiple
                    value={fotoDokumen}
                    onChange={(value) => setFotoDokumen(value as string[])}
                  />
                </div>
              </>
            )}
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
