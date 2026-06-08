import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Plus, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type {
  PaymentMethod,
  PaymentType,
  Transaction,
  TransactionLine,
} from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ModalForm } from "@/components/common/ModalForm";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { DatePickerField } from "@/components/common/DatePickerField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, formatDate, toISODate, rentalDays } from "@/lib/format";
import { txDays } from "@/lib/rental";

export const Route = createFileRoute("/transaksi")({
  head: () => ({ meta: [{ title: "Transaksi Rental — Rentory" }] }),
  component: TransaksiPage,
});

const STATUS_FLOW = [
  "Booking",
  "Siap Keluar",
  "Sedang Disewa",
  "Selesai",
  "Batal",
] satisfies Transaction["status"][];
const STATUS_FILTERS = ["Booking", "Siap Keluar", "Sedang Disewa", "Selesai", "Batal"] satisfies Transaction["status"][];
const PAYMENT_TYPES: PaymentType[] = ["DP", "Tambah DP", "Pelunasan", "Denda", "Charge", "Refund Jaminan"];
const PAYMENT_METHODS: PaymentMethod[] = ["Tunai", "Transfer", "QRIS", "Kartu"];
const canCancel = (transaction: Transaction) =>
  transaction.status === "Booking" || transaction.status === "Siap Keluar";

function TransaksiPage() {
  const {
    transactions,
    customers,
    items,
    getCustomer,
    addTransaction,
    setTransactionStatus,
  } = useStore();
  const [statusFilter, setStatusFilter] = React.useState("active");
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Transaction | null>(null);

  const today = toISODate(new Date());
  const [customerId, setCustomerId] = React.useState("");
  const [mulai, setMulai] = React.useState(today);
  const [kembali, setKembali] = React.useState(today);
  const [lines, setLines] = React.useState<TransactionLine[]>([]);
  const [diskon, setDiskon] = React.useState(0);
  const [catatan, setCatatan] = React.useState("");
  const [tipePembayaran, setTipePembayaran] = React.useState<PaymentType>("DP");
  const [metodePembayaran, setMetodePembayaran] = React.useState<PaymentMethod>("Tunai");
  const [nominalBayar, setNominalBayar] = React.useState(0);
  const [buktiPembayaran, setBuktiPembayaran] = React.useState("");
  const [catatanPembayaran, setCatatanPembayaran] = React.useState("");

  const filtered = transactions.filter((t) => {
    if (statusFilter === "active") return !["Selesai", "Batal"].includes(t.status);
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });
  const days = rentalDays(mulai, kembali);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.harga_sewa * days, 0);
  const total = Math.max(0, subtotal - diskon);
  const totalBayarSaatBooking = Math.max(0, nominalBayar);
  const sisaSetelahPembayaran = Math.max(0, total - totalBayarSaatBooking);
  const lebihBayar = Math.max(0, totalBayarSaatBooking - total);
  const statusPembayaranSaatBooking =
    totalBayarSaatBooking <= 0
      ? "Belum Bayar"
      : totalBayarSaatBooking < total
        ? "Dibayar Sebagian"
        : "Lunas";

  function resetForm() {
    setCustomerId("");
    setMulai(today);
    setKembali(today);
    setLines([]);
    setDiskon(0);
    setCatatan("");
    setTipePembayaran("DP");
    setMetodePembayaran("Tunai");
    setNominalBayar(0);
    setBuktiPembayaran("");
    setCatatanPembayaran("");
  }

  function addLine(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item || lines.some((l) => l.itemId === itemId)) return;
    setLines([
      ...lines,
      {
        itemId,
        nama: item.nama_barang,
        qty: 1,
        harga_sewa: item.harga_sewa_per_hari,
        qty_disiapkan: 0,
        qty_keluar: 0,
        qty_kembali: 0,
        kondisi_awal: "Baik",
        kondisi_kembali: "Baik",
        foto_kondisi_awal: [],
        foto_kondisi_kembali: [],
        checklist: false,
        catatan: "",
      },
    ]);
  }

  function save() {
    if (!customerId) return toast.error("Pilih customer terlebih dahulu.");
    if (lines.length === 0) return toast.error("Pilih minimal satu barang.");
    addTransaction({
      kode: `TRX-${1026 + transactions.length}`,
      customerId,
      tanggal_mulai: mulai,
      tanggal_rencana_kembali: kembali,
      tanggal_keluar: null,
      tanggal_kembali: null,
      items: lines,
      diskon,
      jenis_jaminan: "Tanpa Jaminan",
      nominal_jaminan: 0,
      jenis_dokumen: "KTP",
      nomor_dokumen: "",
      foto_dokumen: [],
      status_jaminan: "Belum Diterima",
      deposit_required: 0,
      deposit_received: 0,
      deposit_received_date: null,
      deposit_status: "Belum Diterima",
      deposit_received_method: undefined,
      deposit_received_note: "",
      total,
      catatan,
      status: "Booking",
      paymentStatus: statusPembayaranSaatBooking,
      terbayar: totalBayarSaatBooking,
      dendaKeterlambatan: 0,
      dendaKerusakan: 0,
      dendaKehilangan: 0,
      jenis_pembayaran: tipePembayaran,
      metode_pembayaran: metodePembayaran,
      nominal_bayar: totalBayarSaatBooking,
      bukti_pembayaran: buktiPembayaran,
      catatan_pembayaran: catatanPembayaran,
    });
    toast.success(
      totalBayarSaatBooking > 0
        ? `Transaksi dibuat dan pembayaran ${tipePembayaran} dicatat.`
        : "Transaksi dibuat dengan status Booking.",
    );
    setOpen(false);
    resetForm();
  }

  async function cancelTransaction(transaction: Transaction) {
    if (!canCancel(transaction)) {
      toast.error("Transaksi hanya bisa dibatalkan sebelum barang keluar.");
      return;
    }

    if (!window.confirm(`Batalkan transaksi ${transaction.kode}?`)) return;

    try {
      await setTransactionStatus(transaction.id, "Batal");
      toast.success("Transaksi dibatalkan.");
      setDetail(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan transaksi.");
    }
  }

  const columns: Column<Transaction>[] = [
    { key: "kode", header: "Kode", render: (t) => <span className="font-semibold">{t.kode}</span> },
    { key: "customer", header: "Customer", render: (t) => getCustomer(t.customerId)?.nama },
    {
      key: "tgl",
      header: "Periode",
      render: (t) => (
        <span className="text-muted-foreground">
          {formatDate(t.tanggal_mulai)} → {formatDate(t.tanggal_rencana_kembali)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (t) => <span className="font-semibold">{formatRupiah(t.total)}</span>,
    },
    { key: "bayar", header: "Bayar", render: (t) => <StatusBadge status={t.paymentStatus} /> },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setDetail(t)}>
            <Eye />
          </Button>
          {canCancel(t) && (
            <Button variant="ghost" size="icon" onClick={() => cancelTransaction(t)}>
              <Ban className="text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi Rental"
        description="Kelola booking, serah terima keluar, pengembalian, dan pembatalan transaksi."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus /> Tambah Transaksi
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-2 text-xs">
        {STATUS_FLOW.map((s, i) => (
          <React.Fragment key={s}>
            <StatusBadge status={s} />
            {i < STATUS_FLOW.length - 2 && <span className="text-muted-foreground">→</span>}
            {i === STATUS_FLOW.length - 2 && <span className="text-muted-foreground">atau</span>}
          </React.Fragment>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(t) => t.id}
        searchKeys={["kode", "catatan"]}
        searchPlaceholder="Cari kode transaksi..."
        toolbar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Form transaksi baru */}
      <ModalForm
        open={open}
        onOpenChange={setOpen}
        title="Transaksi Rental Baru"
        size="xl"
        onSubmit={save}
        submitLabel="Simpan Booking"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tanggal Mulai</Label>
            <DatePickerField value={mulai} onChange={setMulai} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rencana Kembali</Label>
            <DatePickerField value={kembali} onChange={setKembali} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Barang ({days} hari sewa)</Label>
            <Select value="" onValueChange={addLine}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="+ Tambah barang" />
              </SelectTrigger>
              <SelectContent>
                {items
                  .filter((i) => !lines.some((l) => l.itemId === i.id))
                  .map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nama_barang} ({i.satuan})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {lines.length === 0 ? (
            <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              Belum ada barang dipilih.
            </p>
          ) : (
            <div className="space-y-2">
              {lines.map((l, idx) => (
                <div
                  key={l.itemId}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border bg-card p-2"
                >
                  <span className="col-span-5 truncate text-sm font-medium">{l.nama}</span>
                  <Input
                    type="number"
                    min={1}
                    className="col-span-2 h-8"
                    value={l.qty}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, i) =>
                          i === idx ? { ...x, qty: Math.max(1, +e.target.value) } : x,
                        ),
                      )
                    }
                  />
                  <span className="col-span-4 text-right text-sm text-muted-foreground">
                    {l.qty} {items.find((i) => i.id === l.itemId)?.satuan || "unit"} ·{" "}
                    {formatRupiah(l.qty * l.harga_sewa * days)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1 size-8"
                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Diskon</Label>
            <CurrencyInput value={diskon} onChange={setDiskon} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Catatan</Label>
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan transaksi..."
          />
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <h4 className="font-display text-sm font-semibold">Pembayaran Saat Booking</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Opsional. Bisa dikosongkan jika pembayaran dicatat nanti dari menu Pembayaran.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Jenis Pembayaran</Label>
              <Select
                value={tipePembayaran}
                onValueChange={(value) => setTipePembayaran(value as PaymentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((tipe) => (
                    <SelectItem key={tipe} value={tipe}>
                      {tipe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Metode Pembayaran</Label>
              <Select
                value={metodePembayaran}
                onValueChange={(value) => setMetodePembayaran(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((metode) => (
                    <SelectItem key={metode} value={metode}>
                      {metode === "Tunai" ? "Cash" : metode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nominal Bayar Sekarang</Label>
              <CurrencyInput value={nominalBayar} onChange={setNominalBayar} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Catatan Pembayaran</Label>
              <Input
                value={catatanPembayaran}
                onChange={(event) => setCatatanPembayaran(event.target.value)}
                placeholder="Contoh: DP saat booking"
              />
            </div>
          </div>
          <ImageUploader
            label="Upload bukti pembayaran"
            value={buktiPembayaran}
            onChange={(value) => setBuktiPembayaran(String(value))}
          />
          <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
            <SummaryRow label="Total Tagihan" value={formatRupiah(total)} />
            <SummaryRow label="Total Sudah Dibayar" value={formatRupiah(0)} />
            <SummaryRow label="Nominal Bayar Sekarang" value={formatRupiah(totalBayarSaatBooking)} />
            <SummaryRow label="Status Setelah Pembayaran" value={statusPembayaranSaatBooking} />
            <div className="my-1 border-t" />
            <SummaryRow
              label={lebihBayar > 0 ? "Lebih Bayar" : "Sisa Setelah Pembayaran"}
              value={formatRupiah(lebihBayar > 0 ? lebihBayar : sisaSetelahPembayaran)}
              bold
            />
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
          <SummaryRow label={`Subtotal (${days} hari)`} value={formatRupiah(subtotal)} />
          <SummaryRow label="Diskon" value={`- ${formatRupiah(diskon)}`} />
          <div className="my-1 border-t" />
          <SummaryRow label="Total" value={formatRupiah(total)} bold />
        </div>
      </ModalForm>

      {/* Detail drawer */}
      <DetailDrawer
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.kode ?? ""}
        description={detail ? getCustomer(detail.customerId)?.nama : ""}
        footer={
          detail && canCancel(detail) ? (
            <Button variant="destructive" className="w-full" onClick={() => cancelTransaction(detail)}>
              <Ban /> Batalkan Transaksi
            </Button>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.paymentStatus} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Tanggal Mulai" value={formatDate(detail.tanggal_mulai)} />
              <Info label="Rencana Kembali" value={formatDate(detail.tanggal_rencana_kembali)} />
              <Info label="Durasi" value={`${txDays(detail)} hari`} />
            </div>
            <div>
              <h4 className="mb-2 font-display text-sm font-semibold">Barang Disewa</h4>
              <div className="space-y-2">
                {detail.items.map((l) => (
                  <div
                    key={l.itemId}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
                  >
                    <span>
                      {l.nama} <span className="text-muted-foreground">×{l.qty}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        {items.find((i) => i.id === l.itemId)?.satuan || "unit"}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatRupiah(l.qty * l.harga_sewa * txDays(detail))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
              <SummaryRow label="Subtotal" value={formatRupiah(detail.total + detail.diskon)} />
              <SummaryRow label="Diskon" value={`- ${formatRupiah(detail.diskon)}`} />
              <div className="my-1 border-t" />
              <SummaryRow label="Total" value={formatRupiah(detail.total)} bold />
              <SummaryRow label="Terbayar" value={formatRupiah(detail.terbayar)} muted />
            </div>
            {detail.catatan && (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {detail.catatan}
              </p>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

function SummaryRow({
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
      className={`flex items-center justify-between ${bold ? "text-base font-bold" : ""} ${muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
