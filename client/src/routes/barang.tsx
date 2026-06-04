import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Item, ItemCondition, ItemStatus } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ModalForm } from "@/components/common/ModalForm";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { ImageUploader } from "@/components/common/ImageUploader";
import { absoluteFileUrl, pengaturanApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, formatDate, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/barang")({
  head: () => ({ meta: [{ title: "Barang — Rentory" }] }),
  component: BarangPage,
});

const STATUSES: ItemStatus[] = ["Tersedia", "Disewa Sebagian", "Full Disewa", "Maintenance"];
const CONDITIONS: ItemCondition[] = [
  "Baik",
  "Lecet Ringan",
  "Rusak Ringan",
  "Rusak Berat",
  "Hilang",
];

const emptyForm = (kategoriId: string): Omit<Item, "id" | "riwayat"> => ({
  kode_barang: "",
  nama_barang: "",
  satuan: "unit",
  kategoriId,
  foto: "📦",
  harga_sewa_per_hari: 0,
  denda_per_hari: 0,
  stok_total: 1,
  stok_tersedia: 1,
  stok_di_gudang: 1,
  stok_sedang_keluar: 0,
  stok_maintenance: 0,
  stok_hilang: 0,
  deposit_default: 0,
  status: "Tersedia",
  kondisi: "Baik",
});

function BarangPage() {
  const { items, categories, getCategory, addItem, updateItem } = useStore();
  const [defaultDenda, setDefaultDenda] = React.useState(0);
  const [catFilter, setCatFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [form, setForm] = React.useState(emptyForm(categories[0]?.id ?? ""));
  const [detail, setDetail] = React.useState<Item | null>(null);

  React.useEffect(() => {
    pengaturanApi
      .get()
      .then((data) => setDefaultDenda(data.denda_keterlambatan_default))
      .catch(() => setDefaultDenda(0));
  }, []);

  const filtered = items.filter(
    (i) =>
      (catFilter === "all" || i.kategoriId === catFilter) &&
      (statusFilter === "all" || i.status === statusFilter),
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ...emptyForm(categories[0]?.id ?? ""),
      denda_per_hari: defaultDenda,
    });
    setFormOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    const { id, riwayat, ...rest } = item;
    setForm(rest);
    setFormOpen(true);
  }

  function save() {
    if (!form.nama_barang || !form.kode_barang) {
      toast.error("Kode dan nama barang wajib diisi.");
      return;
    }
    if (editing) {
      updateItem({ ...editing, ...form });
      toast.success("Barang diperbarui.");
    } else {
      addItem(form);
      toast.success("Barang ditambahkan.");
    }
    setFormOpen(false);
  }

  const columns: Column<Item>[] = [
    {
      key: "nama",
      header: "Barang",
      render: (i) => (
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-lg">
            <FotoBarang foto={i.foto} className="size-10 rounded-lg" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{i.nama_barang}</p>
            <p className="text-xs text-muted-foreground">{i.kode_barang}</p>
          </div>
        </div>
      ),
    },
    {
      key: "kategori",
      header: "Kategori",
      render: (i) => <Badge variant="secondary">{getCategory(i.kategoriId)?.nama}</Badge>,
    },
    { key: "harga", header: "Sewa/hari", render: (i) => formatRupiah(i.harga_sewa_per_hari) },
    { key: "satuan", header: "Satuan", render: (i) => i.satuan },
    {
      key: "stok",
      header: "Stok Gudang",
      render: (i) => (
        <span className="font-medium">
          {formatNumber(i.stok_di_gudang)}
          <span className="text-muted-foreground"> / {formatNumber(i.stok_total)}</span>
        </span>
      ),
    },
    { key: "deposit", header: "Deposit", render: (i) => formatRupiah(i.deposit_default) },
    { key: "status", header: "Status", render: (i) => <StatusBadge status={i.status} /> },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (i) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setDetail(i)}>
            <Eye />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
            <Pencil />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barang"
        description="Kelola inventaris barang rental beserta stok dan harga."
        actions={
          <Button onClick={openAdd}>
            <Plus /> Tambah Barang
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(i) => i.id}
        searchKeys={["nama_barang", "kode_barang"]}
        searchPlaceholder="Cari nama / kode barang..."
        toolbar={
          <>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <ModalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Edit Barang" : "Tambah Barang"}
        size="lg"
        onSubmit={save}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode Barang">
            <Input
              value={form.kode_barang}
              onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
              placeholder="CMP-004"
            />
          </Field>
          <Field label="Nama Barang">
            <Input
              value={form.nama_barang}
              onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
              placeholder="Nama barang"
            />
          </Field>
          <Field label="Satuan">
            <Select value={form.satuan} onValueChange={(v) => setForm({ ...form, satuan: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["pcs", "unit", "set", "lusin", "pasang", "box", "meter"].map((satuan) => (
                  <SelectItem key={satuan} value={satuan}>
                    {satuan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Kategori">
            <Select
              value={form.kategoriId}
              onValueChange={(v) => setForm({ ...form, kategoriId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as ItemStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Harga Sewa / Hari">
            <CurrencyInput
              value={form.harga_sewa_per_hari}
              onChange={(v) => setForm({ ...form, harga_sewa_per_hari: v })}
            />
          </Field>
          <Field label="Denda / Hari">
            <CurrencyInput
              value={form.denda_per_hari}
              onChange={(v) => setForm({ ...form, denda_per_hari: v })}
            />
          </Field>
          <Field label="Stok Total">
            <Input
              type="number"
              value={form.stok_total}
              onChange={(e) => {
                const stokTotal = +e.target.value;
                setForm({
                  ...form,
                  stok_total: stokTotal,
                  stok_di_gudang: editing ? form.stok_di_gudang : stokTotal,
                  stok_tersedia: editing ? form.stok_tersedia : stokTotal,
                });
              }}
            />
          </Field>
          <Field label="Stok di Gudang">
            <Input
              type="number"
              value={form.stok_di_gudang}
              onChange={(e) =>
                setForm({
                  ...form,
                  stok_di_gudang: +e.target.value,
                  stok_tersedia: +e.target.value,
                })
              }
            />
          </Field>
          <Field label="Stok Maintenance">
            <Input
              type="number"
              value={form.stok_maintenance}
              onChange={(e) => setForm({ ...form, stok_maintenance: +e.target.value })}
            />
          </Field>
          <Field label="Stok Hilang">
            <Input
              type="number"
              value={form.stok_hilang}
              onChange={(e) => setForm({ ...form, stok_hilang: +e.target.value })}
            />
          </Field>
          <Field label="Deposit Default">
            <CurrencyInput
              value={form.deposit_default}
              onChange={(v) => setForm({ ...form, deposit_default: v })}
            />
          </Field>
          <Field label="Kondisi">
            <Select
              value={form.kondisi}
              onValueChange={(v) => setForm({ ...form, kondisi: v as ItemCondition })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Foto Barang">
          <ImageUploader
            label="Upload foto barang"
            value={form.foto}
            onChange={(value) => setForm({ ...form, foto: String(value) })}
          />
        </Field>
      </ModalForm>

      <DetailDrawer
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.nama_barang ?? ""}
        description={detail?.kode_barang}
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <FotoBarang foto={detail.foto} className="size-16 rounded-xl" />
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detail.status} />
                <StatusBadge status={detail.kondisi} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Info label="Kategori" value={getCategory(detail.kategoriId)?.nama ?? "-"} />
              <Info label="Satuan" value={detail.satuan} />
              <Info label="Sewa / Hari" value={formatRupiah(detail.harga_sewa_per_hari)} />
              <Info label="Denda / Hari" value={formatRupiah(detail.denda_per_hari)} />
              <Info label="Deposit" value={formatRupiah(detail.deposit_default)} />
              <Info label="Stok Total" value={formatNumber(detail.stok_total)} />
              <Info label="Stok Gudang" value={formatNumber(detail.stok_di_gudang)} />
              <Info label="Sedang Keluar" value={formatNumber(detail.stok_sedang_keluar)} />
              <Info label="Maintenance" value={formatNumber(detail.stok_maintenance)} />
              <Info label="Hilang" value={formatNumber(detail.stok_hilang)} />
            </div>

            <div>
              <h4 className="mb-2 font-display text-sm font-semibold">Riwayat Transaksi</h4>
              {detail.riwayat.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                  Belum ada riwayat transaksi.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.riwayat.map((h) => (
                    <div key={h.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{h.transaksi}</span>
                        <StatusBadge status={h.kondisiKembali} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {h.customer} · {formatDate(h.tanggal)} · {h.qty} unit
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
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

function FotoBarang({ foto, className }: { foto: string; className?: string }) {
  const isFile = Boolean(foto && (foto.startsWith("/uploads/") || /^https?:\/\//.test(foto)));

  if (isFile) {
    return <img src={absoluteFileUrl(foto)} alt="" className={`${className ?? ""} object-cover`} />;
  }

  return (
    <span className={`grid place-items-center bg-muted text-lg ${className ?? ""}`}>
      {foto || "📦"}
    </span>
  );
}
