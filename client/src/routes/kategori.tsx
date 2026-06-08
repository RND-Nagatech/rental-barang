import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Category } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ModalForm } from "@/components/common/ModalForm";
import { ImageUploader } from "@/components/common/ImageUploader";
import { absoluteFileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/kategori")({
  head: () => ({ meta: [{ title: "Kategori — Rentory" }] }),
  component: KategoriPage,
});

const empty = {
  kode: "",
  nama: "",
  deskripsi: "",
  icon: "Tag",
  icon_kategori: "",
  gambar_kategori: "",
  urutan_tampil: 0,
  tampil_di_apk: true,
  status_aktif: true,
};

function KategoriPage() {
  const { categories, items, addCategory, updateCategory } = useStore();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState(empty);

  const count = (catId: string) => items.filter((i) => i.kategoriId === catId).length;

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      kode: c.kode,
      nama: c.nama,
      deskripsi: c.deskripsi,
      icon: c.icon,
      icon_kategori: c.icon_kategori || "",
      gambar_kategori: c.gambar_kategori || "",
      urutan_tampil: c.urutan_tampil || 0,
      tampil_di_apk: c.tampil_di_apk !== false,
      status_aktif: c.status_aktif !== false,
    });
    setOpen(true);
  }
  function save() {
    if (!form.nama || !form.kode) {
      toast.error("Kode dan nama kategori wajib diisi.");
      return;
    }
    if (editing) {
      updateCategory({ ...editing, ...form });
      toast.success("Kategori diperbarui.");
    } else {
      addCategory(form);
      toast.success("Kategori ditambahkan.");
    }
    setOpen(false);
  }

  const columns: Column<Category>[] = [
    { key: "kode", header: "Kode", render: (c) => <Badge variant="secondary">{c.kode}</Badge> },
    {
      key: "nama",
      header: "Nama Kategori",
      render: (c) => (
        <div className="flex items-center gap-3">
          <KategoriIcon category={c} />
          <span className="font-semibold">{c.nama}</span>
        </div>
      ),
    },
    { key: "deskripsi", header: "Deskripsi", render: (c) => <span className="text-muted-foreground">{c.deskripsi}</span> },
    { key: "urutan", header: "Urutan APK", render: (c) => formatNumber(c.urutan_tampil || 0) },
    {
      key: "apk",
      header: "APK",
      render: (c) => <Badge variant={c.tampil_di_apk === false ? "outline" : "default"}>{c.tampil_di_apk === false ? "Disembunyikan" : "Tampil"}</Badge>,
    },
    { key: "jumlah", header: "Jumlah Barang", render: (c) => formatNumber(count(c.id)) },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (c) => (
        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
          <Pencil />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori"
        description="Kelompokkan barang rental ke dalam kategori."
        actions={<Button onClick={openAdd}><Plus /> Tambah Kategori</Button>}
      />

      <DataTable columns={columns} data={categories} rowKey={(c) => c.id} searchKeys={["nama", "kode", "deskripsi"]} />

      <ModalForm open={open} onOpenChange={setOpen} title={editing ? "Edit Kategori" : "Tambah Kategori"} onSubmit={save}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Kode</Label>
          <Input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="CMP" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nama Kategori</Label>
          <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Camping" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Deskripsi</Label>
          <Input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi singkat" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Urutan Tampil APK</Label>
          <Input type="number" value={form.urutan_tampil} onChange={(e) => setForm({ ...form, urutan_tampil: +e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Gambar/Icon Kategori APK</Label>
          <ImageUploader
            label="Upload gambar kategori"
            value={form.gambar_kategori || form.icon_kategori}
            onChange={(value) =>
              setForm({
                ...form,
                gambar_kategori: String(value),
                icon_kategori: String(value),
                icon: String(value) || "Tag",
              })
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">Tampil di APK</Label>
          <Switch checked={form.tampil_di_apk} onCheckedChange={(value) => setForm({ ...form, tampil_di_apk: value })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label className="text-xs text-muted-foreground">Status Aktif</Label>
          <Switch checked={form.status_aktif} onCheckedChange={(value) => setForm({ ...form, status_aktif: value })} />
        </div>
      </ModalForm>
    </div>
  );
}

function KategoriIcon({ category }: { category: Category }) {
  const image = category.gambar_kategori || category.icon_kategori || "";
  const isFile = Boolean(image && (image.startsWith("/uploads/") || /^https?:\/\//.test(image)));

  if (isFile) {
    return <img src={absoluteFileUrl(image)} alt="" className="size-9 rounded-lg object-cover" />;
  }

  return <span className="grid size-9 place-items-center rounded-lg bg-muted text-xs">{category.icon || "Tag"}</span>;
}
