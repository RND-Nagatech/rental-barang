import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/common/DataTable";
import { ImageUploader } from "@/components/common/ImageUploader";
import { ModalForm } from "@/components/common/ModalForm";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { absoluteFileUrl, metodePembayaranApi, type ApiMetodePembayaran } from "@/lib/api";

export const Route = createFileRoute("/metode-pembayaran")({
  head: () => ({ meta: [{ title: "Metode Pembayaran — Rentory" }] }),
  component: MetodePembayaranPage,
});

const empty: Partial<ApiMetodePembayaran> = {
  kode_metode: "",
  nama_metode: "",
  tipe_metode: "bank_transfer",
  nama_bank: "",
  nomor_rekening: "",
  nama_pemilik: "",
  qr_image: "",
  instruksi_pembayaran: "",
  tampil_di_apk: true,
  status_aktif: true,
  urutan_tampil: 0,
};

const tipeLabel: Record<ApiMetodePembayaran["tipe_metode"], string> = {
  bank_transfer: "Bank Transfer",
  qris: "QRIS",
  e_wallet: "E-Wallet",
  cash: "Cash",
};

function MetodePembayaranPage() {
  const [items, setItems] = React.useState<ApiMetodePembayaran[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiMetodePembayaran | null>(null);
  const [form, setForm] = React.useState<Partial<ApiMetodePembayaran>>(empty);

  const loadData = React.useCallback(async () => {
    try {
      setItems(await metodePembayaranApi.list());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat metode pembayaran");
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(item: ApiMetodePembayaran) {
    setEditing(item);
    setForm(item);
    setOpen(true);
  }

  async function save() {
    if (!form.nama_metode?.trim()) {
      toast.error("Nama metode wajib diisi.");
      return;
    }

    try {
      if (editing) {
        await metodePembayaranApi.update(editing.id || editing._id, form);
        toast.success("Metode pembayaran diperbarui.");
      } else {
        await metodePembayaranApi.create(form);
        toast.success("Metode pembayaran ditambahkan.");
      }
      setOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan metode pembayaran");
    }
  }

  async function remove(item: ApiMetodePembayaran) {
    if (!window.confirm(`Hapus ${item.nama_metode}?`)) return;
    try {
      await metodePembayaranApi.remove(item.id || item._id);
      toast.success("Metode pembayaran dihapus.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus metode pembayaran");
    }
  }

  const columns: Column<ApiMetodePembayaran>[] = [
    { key: "kode_metode", header: "Kode", render: (item) => <Badge variant="secondary">{item.kode_metode}</Badge> },
    {
      key: "nama_metode",
      header: "Metode",
      render: (item) => (
        <div>
          <p className="font-semibold">{item.nama_metode}</p>
          <p className="text-xs text-muted-foreground">
            {[item.nama_bank, item.nomor_rekening, item.nama_pemilik].filter(Boolean).join(" · ") || "-"}
          </p>
        </div>
      ),
    },
    { key: "tipe_metode", header: "Tipe", render: (item) => tipeLabel[item.tipe_metode] },
    { key: "urutan_tampil", header: "Urutan" },
    {
      key: "apk",
      header: "APK",
      render: (item) => <Badge variant={item.tampil_di_apk ? "default" : "outline"}>{item.tampil_di_apk ? "Tampil" : "Disembunyikan"}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <Badge variant={item.status_aktif ? "default" : "outline"}>{item.status_aktif ? "Aktif" : "Nonaktif"}</Badge>,
    },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil /></Button>
          <Button variant="ghost" size="icon" onClick={() => remove(item)}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metode Pembayaran"
        description="Master rekening, QRIS, e-wallet, dan instruksi pembayaran toko untuk APK customer."
        actions={<Button onClick={openAdd}><Plus /> Tambah Metode</Button>}
      />

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id || item._id}
        searchKeys={["kode_metode", "nama_metode", "nama_bank", "nomor_rekening", "nama_pemilik"]}
      />

      <ModalForm open={open} onOpenChange={setOpen} title={editing ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"} onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode Metode">
            <Input value={form.kode_metode || ""} onChange={(e) => setForm({ ...form, kode_metode: e.target.value })} placeholder="Auto jika kosong" />
          </Field>
          <Field label="Nama Metode">
            <Input value={form.nama_metode || ""} onChange={(e) => setForm({ ...form, nama_metode: e.target.value })} placeholder="BCA Rentory" />
          </Field>
          <Field label="Tipe Metode">
            <select
              value={form.tipe_metode || "bank_transfer"}
              onChange={(e) => setForm({ ...form, tipe_metode: e.target.value as ApiMetodePembayaran["tipe_metode"] })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="qris">QRIS</option>
              <option value="e_wallet">E-Wallet</option>
              <option value="cash">Cash</option>
            </select>
          </Field>
          <Field label="Urutan Tampil">
            <Input type="number" value={form.urutan_tampil || 0} onChange={(e) => setForm({ ...form, urutan_tampil: Number(e.target.value || 0) })} />
          </Field>
          <Field label="Nama Bank / Provider">
            <Input value={form.nama_bank || ""} onChange={(e) => setForm({ ...form, nama_bank: e.target.value })} placeholder="BCA / GoPay / QRIS" />
          </Field>
          <Field label="Nomor Rekening / Nomor Akun">
            <Input value={form.nomor_rekening || ""} onChange={(e) => setForm({ ...form, nomor_rekening: e.target.value })} />
          </Field>
          <Field label="Nama Pemilik">
            <Input value={form.nama_pemilik || ""} onChange={(e) => setForm({ ...form, nama_pemilik: e.target.value })} />
          </Field>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">QR Image</Label>
            <ImageUploader
              label="Upload QR / gambar metode"
              value={form.qr_image ? absoluteFileUrl(form.qr_image) : ""}
              onChange={(value) => setForm({ ...form, qr_image: String(value) })}
            />
          </div>
        </div>
        <Field label="Instruksi Pembayaran">
          <Textarea
            value={form.instruksi_pembayaran || ""}
            onChange={(e) => setForm({ ...form, instruksi_pembayaran: e.target.value })}
            placeholder="Contoh: Transfer sesuai nominal tagihan lalu upload bukti pembayaran."
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Tampil di APK" checked={form.tampil_di_apk !== false} onChange={(value) => setForm({ ...form, tampil_di_apk: value })} />
          <Toggle label="Status Aktif" checked={form.status_aktif !== false} onChange={(value) => setForm({ ...form, status_aktif: value })} />
        </div>
      </ModalForm>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
