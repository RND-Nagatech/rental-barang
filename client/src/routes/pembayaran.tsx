import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Payment, PaymentMethod, PaymentType } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ModalForm } from "@/components/common/ModalForm";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { DatePickerField } from "@/components/common/DatePickerField";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, formatDate, toISODate } from "@/lib/format";

export const Route = createFileRoute("/pembayaran")({
  head: () => ({ meta: [{ title: "Pembayaran — Rentory" }] }),
  component: Page,
});

const TYPES: PaymentType[] = ["DP", "Tambah DP", "Pelunasan", "Denda", "Refund Deposit"];
const METHODS: PaymentMethod[] = ["Tunai", "Transfer", "QRIS", "Kartu"];

function Page() {
  const { payments, transactions, getCustomer, addPayment } = useStore();
  const [open, setOpen] = React.useState(false);
  const today = toISODate(new Date());
  const [form, setForm] = React.useState({
    transaksiId: "",
    kodeRental: "",
    tanggal: today,
    tipe: "DP" as PaymentType,
    metode: "Transfer" as PaymentMethod,
    nominal: 0,
    bukti: "",
    catatan: "",
  });

  async function save() {
    if ((!form.transaksiId && !form.kodeRental) || !form.nominal) {
      return toast.error("Pilih/isi kode rental & isi nominal.");
    }

    try {
      await addPayment({ ...form, bukti: form.bukti || "-" });
      toast.success("Pembayaran dicatat.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mencatat pembayaran.");
    }
  }

  const txInfo = (id: string) => {
    const t = transactions.find((x) => x.id === id || x.kode === id);
    return t ? `${t.kode} · ${getCustomer(t.customerId)?.nama}` : id || "-";
  };

  const columns: Column<Payment>[] = [
    { key: "tanggal", header: "Tanggal", render: (p) => formatDate(p.tanggal) },
    {
      key: "transaksi",
      header: "Transaksi",
      render: (p) => <span className="font-medium">{txInfo(p.transaksiId)}</span>,
    },
    {
      key: "tipe",
      header: "Tipe",
      render: (p) => <span className="text-sm font-medium">{p.tipe}</span>,
    },
    { key: "metode", header: "Metode" },
    {
      key: "nominal",
      header: "Nominal",
      render: (p) => <span className="font-semibold">{formatRupiah(p.nominal)}</span>,
    },
    {
      key: "bukti",
      header: "Bukti",
      render: (p) => <span className="text-muted-foreground">{p.bukti}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran"
        description="Catat pembayaran rental: DP, tambah DP, dan pelunasan."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Catat Pembayaran
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {transactions
          .filter((t) => t.status !== "Draft")
          .slice(0, 3)
          .map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.kode}</span>
                <StatusBadge status={t.paymentStatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {getCustomer(t.customerId)?.nama}
              </p>
              <p className="mt-2 text-sm">
                Terbayar <span className="font-semibold">{formatRupiah(t.terbayar)}</span> dari{" "}
                {formatRupiah(t.total)}
              </p>
            </div>
          ))}
      </div>

      <DataTable
        columns={columns}
        data={payments}
        rowKey={(p) => p.id}
        searchKeys={["metode", "catatan"]}
        searchPlaceholder="Cari pembayaran..."
      />

      <ModalForm open={open} onOpenChange={setOpen} title="Catat Pembayaran" onSubmit={save}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Kode Rental</Label>
          <Input
            value={form.kodeRental}
            onChange={(e) => setForm({ ...form, kodeRental: e.target.value })}
            placeholder="RT-260604-001"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pilih Transaksi</Label>
          <Select
            value={form.transaksiId}
            onValueChange={(v) => {
              const tx = transactions.find((t) => t.id === v);
              setForm({ ...form, transaksiId: v, kodeRental: tx?.kode || form.kodeRental });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih transaksi" />
            </SelectTrigger>
            <SelectContent>
              {transactions
                .filter((t) => t.status !== "Draft")
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.kode} · {getCustomer(t.customerId)?.nama}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tanggal</Label>
            <DatePickerField
              value={form.tanggal}
              onChange={(v) => setForm({ ...form, tanggal: v })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipe</Label>
            <Select
              value={form.tipe}
              onValueChange={(v) => setForm({ ...form, tipe: v as PaymentType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Metode</Label>
            <Select
              value={form.metode}
              onValueChange={(v) => setForm({ ...form, metode: v as PaymentMethod })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nominal</Label>
            <CurrencyInput
              value={form.nominal}
              onChange={(v) => setForm({ ...form, nominal: v })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Catatan</Label>
          <Input
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Bukti Pembayaran</Label>
          <ImageUploader
            label="Upload bukti pembayaran"
            value={form.bukti}
            onChange={(value) => setForm({ ...form, bukti: String(value) })}
          />
        </div>
      </ModalForm>
    </div>
  );
}
