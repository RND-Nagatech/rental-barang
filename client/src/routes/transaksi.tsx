import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Eye, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { PaymentMethod, PaymentType, Transaction, TransactionLine } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ModalForm } from "@/components/common/ModalForm";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { DatePickerField } from "@/components/common/DatePickerField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { pengaturanApi } from "@/lib/api";
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
import { txTotal, txSubtotal, txDays } from "@/lib/rental";

export const Route = createFileRoute("/transaksi")({
  head: () => ({ meta: [{ title: "Transaksi Rental — Rentory" }] }),
  component: TransaksiPage,
});

const STATUS_FLOW = [
  "Draft",
  "Booking",
  "Siap Keluar",
  "Sedang Disewa",
  "Serah Terima Kembali",
  "Selesai",
];

function TransaksiPage() {
  const {
    transactions,
    customers,
    items,
    getCustomer,
    addTransaction,
    updateTransaction,
    addPayment,
  } = useStore();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Transaction | null>(null);

  const today = toISODate(new Date());
  const [customerId, setCustomerId] = React.useState("");
  const [mulai, setMulai] = React.useState(today);
  const [kembali, setKembali] = React.useState(today);
  const [lines, setLines] = React.useState<TransactionLine[]>([]);
  const [diskon, setDiskon] = React.useState(0);
  const [deposit, setDeposit] = React.useState(0);
  const [catatan, setCatatan] = React.useState("");
  const [defaultDeposit, setDefaultDeposit] = React.useState(0);
  const [metodePembayaran, setMetodePembayaran] = React.useState<PaymentMethod>("Transfer");
  const [nominalBayar, setNominalBayar] = React.useState(0);
  const [buktiPembayaran, setBuktiPembayaran] = React.useState("");
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paymentTarget, setPaymentTarget] = React.useState<Transaction | null>(null);
  const [paymentForm, setPaymentForm] = React.useState({
    tipe: "DP" as PaymentType,
    metode: "Transfer" as PaymentMethod,
    nominal: 0,
    bukti: "",
    catatan: "",
  });

  React.useEffect(() => {
    pengaturanApi
      .get()
      .then((data) => {
        setDefaultDeposit(data.deposit_minimum_default);
        setDeposit(data.deposit_minimum_default);
      })
      .catch(() => undefined);
  }, []);

  const filtered = transactions.filter((t) => statusFilter === "all" || t.status === statusFilter);
  const days = rentalDays(mulai, kembali);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.harga_sewa * days, 0);
  const total = Math.max(0, subtotal - diskon);

  function resetForm() {
    setCustomerId("");
    setMulai(today);
    setKembali(today);
    setLines([]);
    setDiskon(0);
    setDeposit(defaultDeposit);
    setCatatan("");
    setMetodePembayaran("Transfer");
    setNominalBayar(0);
    setBuktiPembayaran("");
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
    setDeposit((d) => Math.max(d, defaultDeposit) + item.deposit_default);
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
      deposit,
      depositDiterima: 0,
      total,
      catatan,
      status: "Booking",
      paymentStatus:
        nominalBayar <= 0 ? "Belum Bayar" : nominalBayar < total ? "Dibayar Sebagian" : "Lunas",
      terbayar: nominalBayar,
      dendaKeterlambatan: 0,
      dendaKerusakan: 0,
      dendaKehilangan: 0,
      metode_pembayaran: metodePembayaran,
      nominal_bayar: nominalBayar,
      bukti_pembayaran: buktiPembayaran,
    });
    toast.success("Transaksi dibuat dengan status Booking.");
    setOpen(false);
    resetForm();
  }

  function openPayment(t: Transaction) {
    setPaymentTarget(t);
    setPaymentForm({
      metode: "Transfer",
      nominal: Math.max(0, Math.round(txTotal(t) * 0.4)),
      bukti: "",
      catatan: "DP transaksi",
    });
    setPaymentOpen(true);
  }

  async function savePayment() {
    if (!paymentTarget) return;
    if (paymentForm.nominal <= 0) return toast.error("Nominal pembayaran wajib diisi.");

    try {
      await addPayment({
        transaksiId: paymentTarget.id,
        tanggal: today,
        tipe: paymentForm.tipe,
        metode: paymentForm.metode,
        nominal: paymentForm.nominal,
        bukti: paymentForm.bukti || "-",
        catatan: paymentForm.catatan,
      });
      toast.success("Pembayaran dicatat.");
      setPaymentOpen(false);
      setDetail(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mencatat pembayaran.");
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
      render: (t) => <span className="font-semibold">{formatRupiah(txTotal(t))}</span>,
    },
    { key: "bayar", header: "Bayar", render: (t) => <StatusBadge status={t.paymentStatus} /> },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (t) => (
        <Button variant="ghost" size="icon" onClick={() => setDetail(t)}>
          <Eye />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi Rental"
        description="Kelola transaksi rental dari Draft hingga Selesai."
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
            {i < STATUS_FLOW.length - 1 && <span className="text-muted-foreground">→</span>}
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
              <SelectItem value="all">Semua Status</SelectItem>
              {[...STATUS_FLOW, "Dibatalkan"].map((s) => (
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Deposit</Label>
            <CurrencyInput value={deposit} onChange={setDeposit} />
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

        <div className="grid gap-4 sm:grid-cols-2">
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
                {["Tunai", "Transfer", "QRIS", "Kartu"].map((metode) => (
                  <SelectItem key={metode} value={metode}>
                    {metode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nominal Bayar</Label>
            <CurrencyInput value={nominalBayar} onChange={setNominalBayar} />
          </div>
        </div>
        <ImageUploader
          label="Upload bukti pembayaran"
          value={buktiPembayaran}
          onChange={(value) => setBuktiPembayaran(String(value))}
        />

        <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
          <SummaryRow label={`Subtotal (${days} hari)`} value={formatRupiah(subtotal)} />
          <SummaryRow label="Diskon" value={`- ${formatRupiah(diskon)}`} />
          <div className="my-1 border-t" />
          <SummaryRow label="Total" value={formatRupiah(total)} bold />
          <SummaryRow label="Deposit" value={formatRupiah(deposit)} muted />
        </div>
      </ModalForm>

      {/* Detail drawer */}
      <DetailDrawer
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.kode ?? ""}
        description={detail ? getCustomer(detail.customerId)?.nama : ""}
        footer={
          detail?.paymentStatus !== "Lunas" ? (
            <Button className="w-full" onClick={() => openPayment(detail)}>
              <Wallet /> Bayar DP / Pelunasan
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
              <Info label="Deposit" value={formatRupiah(detail.deposit)} />
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
              <SummaryRow label="Subtotal" value={formatRupiah(txSubtotal(detail))} />
              <SummaryRow label="Diskon" value={`- ${formatRupiah(detail.diskon)}`} />
              <div className="my-1 border-t" />
              <SummaryRow label="Total" value={formatRupiah(txTotal(detail))} bold />
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

      <ModalForm
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title={`Pembayaran ${paymentTarget?.kode ?? ""}`}
        onSubmit={savePayment}
        submitLabel="Simpan Pembayaran"
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Jenis Pembayaran</Label>
          <Select
            value={paymentForm.tipe}
            onValueChange={(value) =>
              setPaymentForm({ ...paymentForm, tipe: value as PaymentType })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["DP", "Tambah DP", "Pelunasan", "Denda", "Refund Deposit"].map((tipe) => (
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
            value={paymentForm.metode}
            onValueChange={(value) =>
              setPaymentForm({ ...paymentForm, metode: value as PaymentMethod })
            }
          >
            <SelectTrigger>
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
          <Label className="text-xs text-muted-foreground">Nominal Bayar</Label>
          <CurrencyInput
            value={paymentForm.nominal}
            onChange={(value) => setPaymentForm({ ...paymentForm, nominal: value })}
          />
        </div>
        <ImageUploader
          label="Upload bukti pembayaran"
          value={paymentForm.bukti}
          onChange={(value) => setPaymentForm({ ...paymentForm, bukti: String(value) })}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Catatan</Label>
          <Textarea
            value={paymentForm.catatan}
            onChange={(e) => setPaymentForm({ ...paymentForm, catatan: e.target.value })}
          />
        </div>
      </ModalForm>
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
