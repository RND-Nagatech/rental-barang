import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { ChargeType, RentalCharge, Transaction, ItemCondition } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ImageUploader } from "@/components/common/ImageUploader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { absoluteFileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
const CHARGE_TYPES: ChargeType[] = [
  "Keterlambatan",
  "Kerusakan",
  "Kehilangan",
  "Laundry/Cleaning",
  "Lainnya",
];

function Page() {
  const { tx } = Route.useSearch();
  const { transactions, getCustomer, getItem, updateTransaction } = useStore();
  const [selectedId, setSelectedId] = React.useState(tx || "");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const list = transactions.filter((t) => t.status === "Sedang Disewa");
  const selected = list.find((t) => t.id === selectedId) || null;
  const rows = list
    .map((t) => ({
      ...t,
      customer: getCustomer(t.customerId)?.nama ?? "-",
      barang: t.items.map((item) => `${item.nama} x${item.qty_keluar || item.qty}`).join(", "),
      qtyTotal: t.items.reduce((sum, item) => sum + (item.qty_keluar || item.qty), 0),
      timing: returnTiming(t.tanggal_rencana_kembali),
    }))
    .filter((t) => {
      if (filterStatus === "overdue") return t.timing.overdue;
      if (filterStatus === "on_time") return !t.timing.overdue;
      return true;
    });
  const columns: Column<(typeof rows)[number]>[] = [
    { key: "kode", header: "Kode" },
    { key: "customer", header: "Customer" },
    { key: "tanggal_keluar", header: "Tgl Keluar", render: (row) => formatDate(row.tanggal_keluar) },
    {
      key: "tanggal_rencana_kembali",
      header: "Harus Kembali",
      render: (row) => formatDate(row.tanggal_rencana_kembali),
    },
    { key: "barang", header: "Barang", className: "max-w-xs truncate" },
    { key: "qtyTotal", header: "Qty" },
    {
      key: "status_kembali",
      header: "Status",
      render: (row) => <StatusBadge status={row.timing.overdue ? "Overdue" : "Tepat Waktu"} />,
    },
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
          title="Serah Terima Kembali"
          description="Periksa kondisi barang kembali dan hitung charge tambahan."
          actions={
            <Button variant="outline" onClick={() => setSelectedId("")}>
              <ArrowLeft /> Kembali
            </Button>
          }
        />
        <KembaliForm
          key={selected.id}
          t={selected}
          customer={getCustomer(selected.customerId)?.nama ?? "-"}
          getDenda={(id) => getItem(id)?.denda_per_hari ?? 0}
          satuan={(id) => getItem(id)?.satuan || "unit"}
          onDone={updateTransaction}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serah Terima Kembali"
        description="Pilih transaksi yang akan diproses pengembaliannya."
      />
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        searchKeys={["kode", "customer", "barang"]}
        searchPlaceholder="Cari kode, customer, atau barang..."
        toolbar={
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="overdue">Terlambat</SelectItem>
              <SelectItem value="on_time">Tepat waktu</SelectItem>
            </SelectContent>
          </Select>
        }
        onRowClick={(row) => setSelectedId(row.id)}
        emptyMessage="Tidak ada transaksi yang perlu dikembalikan."
      />
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
  const dendaTerlambat = t.items.reduce((s, l) => s + getDenda(l.itemId) * l.qty, 0) * lateDays;
  const butuhDeposit = ["Deposit Uang", "Deposit + Dokumen"].includes(t.jenis_jaminan);
  const butuhDokumen = ["Dokumen", "Deposit + Dokumen"].includes(t.jenis_jaminan);

  const [lines, setLines] = React.useState(
    t.items.map((l) => ({
      ...l,
      qty_kembali: l.qty_keluar || l.qty,
      kondisi_kembali: "Baik" as ItemCondition,
    })),
  );
  const [charges, setCharges] = React.useState<RentalCharge[]>(() => {
    if (t.charges?.length) return t.charges;
    if (dendaTerlambat <= 0) return [];

    return [
      {
        jenis_charge: "Keterlambatan",
        nominal: dendaTerlambat,
        catatan: `${lateDays} hari terlambat`,
        potong_dari_jaminan: Number(t.deposit_received || 0) > 0,
      },
    ];
  });
  const [statusDokumen, setStatusDokumen] = React.useState<"Dikembalikan" | "Ditahan">(
    "Dikembalikan",
  );

  const totalCharge = charges.reduce((sum, charge) => sum + Number(charge.nominal || 0), 0);
  const total = txTotal(t);
  const depositDiterima = Number(t.deposit_received || 0);
  const chargePotongJaminan = charges
    .filter((charge) => charge.potong_dari_jaminan)
    .reduce((sum, charge) => sum + Number(charge.nominal || 0), 0);
  const totalPotongan = butuhDeposit ? Math.min(depositDiterima, chargePotongJaminan) : 0;
  const chargePotongTidakTertutup = Math.max(0, chargePotongJaminan - totalPotongan);
  const chargeBelumDibayar =
    charges
      .filter((charge) => !charge.potong_dari_jaminan)
      .reduce((sum, charge) => sum + Number(charge.nominal || 0), 0) + chargePotongTidakTertutup;
  const depositRefund = Math.max(0, depositDiterima - totalPotongan);
  const sisaSewa = Math.max(0, total - t.terbayar);
  const sisaTagihan = sisaSewa + chargeBelumDibayar;
  const statusDeposit =
    depositDiterima <= 0 ? "Belum Diterima" : depositRefund > 0 ? "Dikembalikan" : "Dipotong";
  const statusJaminanFinal = butuhDokumen
    ? statusDokumen === "Ditahan"
      ? "Ditahan"
      : butuhDeposit
        ? statusDeposit
        : "Dikembalikan"
    : butuhDeposit
      ? statusDeposit
      : "Belum Diterima";

  function finish() {
    onDone({
      ...t,
      items: lines,
      tanggal_kembali: toISODate(new Date()),
      status: "Selesai",
      status_jaminan: statusJaminanFinal,
      deposit_status: statusDeposit,
      dendaKeterlambatan: charges
        .filter((charge) => charge.jenis_charge === "Keterlambatan")
        .reduce((sum, charge) => sum + charge.nominal, 0),
      dendaKerusakan: charges
        .filter((charge) => charge.jenis_charge === "Kerusakan")
        .reduce((sum, charge) => sum + charge.nominal, 0),
      dendaKehilangan: charges
        .filter((charge) => charge.jenis_charge === "Kehilangan")
        .reduce((sum, charge) => sum + charge.nominal, 0),
      charges,
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

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Charge / Tambahan Biaya</p>
              <p className="text-xs text-muted-foreground">
                Charge dapat dipotong dari jaminan atau menjadi sisa tagihan customer.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setCharges([
                  ...charges,
                  {
                    jenis_charge: "Lainnya",
                    nominal: 0,
                    catatan: "",
                    potong_dari_jaminan: butuhDeposit && depositDiterima > 0,
                  },
                ])
              }
            >
              <Plus /> Tambah
            </Button>
          </div>

          {charges.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              Belum ada charge tambahan.
            </div>
          ) : (
            <div className="space-y-3">
              {charges.map((charge, idx) => (
                <div key={idx} className="grid gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[180px_1fr_1fr_auto]">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Jenis Charge</Label>
                    <Select
                      value={charge.jenis_charge}
                      onValueChange={(value) =>
                        setCharges(
                          charges.map((item, i) =>
                            i === idx ? { ...item, jenis_charge: value as ChargeType } : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARGE_TYPES.map((jenis) => (
                          <SelectItem key={jenis} value={jenis}>
                            {jenis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nominal</Label>
                    <CurrencyInput
                      value={charge.nominal}
                      onChange={(value) =>
                        setCharges(
                          charges.map((item, i) =>
                            i === idx ? { ...item, nominal: value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Catatan</Label>
                    <Input
                      className="h-9"
                      value={charge.catatan}
                      placeholder="opsional"
                      onChange={(e) =>
                        setCharges(
                          charges.map((item, i) =>
                            i === idx ? { ...item, catatan: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-xs">
                      <Checkbox
                        checked={charge.potong_dari_jaminan}
                        onCheckedChange={(checked) =>
                          setCharges(
                            charges.map((item, i) =>
                              i === idx
                                ? { ...item, potong_dari_jaminan: Boolean(checked) }
                                : item,
                            ),
                          )
                        }
                      />
                      Potong jaminan
                    </label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setCharges(charges.filter((_, i) => i !== idx))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-semibold">Data Jaminan Diterima</p>
          <Row label="Jenis Jaminan" value={t.jenis_jaminan} />
          {butuhDeposit && <Row label="Deposit Diterima" value={formatRupiah(depositDiterima)} />}
          {butuhDokumen && (
            <>
              <Row label="Jenis Dokumen" value={t.jenis_dokumen} />
              <Row label="Nomor Dokumen" value={t.nomor_dokumen || "-"} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status Pengembalian Dokumen</Label>
                <Select
                  value={statusDokumen}
                  onValueChange={(value) => setStatusDokumen(value as "Dikembalikan" | "Ditahan")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dikembalikan">Dikembalikan</SelectItem>
                    <SelectItem value="Ditahan">Ditahan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
          <Row label="Status Jaminan" value={statusJaminanFinal} />
          {butuhDeposit && <Row label="Deposit Diterima" value={formatRupiah(depositDiterima)} />}
          {butuhDeposit && <Row label="Status Deposit" value={statusDeposit} />}
          <div className="my-1 border-t" />
          <Row
            label={`Denda Keterlambatan (${lateDays} hari)`}
            value={formatRupiah(dendaTerlambat)}
          />
          <Row label="Total Charge" value={formatRupiah(totalCharge)} bold />
          {butuhDeposit && <div className="my-1 border-t" />}
          {butuhDeposit && <Row label="Jaminan Diterima" value={formatRupiah(depositDiterima)} />}
          {butuhDeposit && <Row label="Potongan Jaminan" value={`- ${formatRupiah(totalPotongan)}`} muted />}
          {butuhDeposit && <Row label="Jaminan Dikembalikan" value={formatRupiah(depositRefund)} muted />}
          {butuhDeposit && <div className="my-1 border-t" />}
          <Row label="Charge Belum Dibayar" value={formatRupiah(chargeBelumDibayar)} />
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
