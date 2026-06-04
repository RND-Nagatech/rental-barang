import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Category } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ModalForm } from "@/components/common/ModalForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/kategori")({
  head: () => ({ meta: [{ title: "Kategori — Rentory" }] }),
  component: KategoriPage,
});

const empty = { kode: "", nama: "", deskripsi: "", icon: "Tag" };

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
    setForm({ kode: c.kode, nama: c.nama, deskripsi: c.deskripsi, icon: c.icon });
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
    { key: "nama", header: "Nama Kategori", render: (c) => <span className="font-semibold">{c.nama}</span> },
    { key: "deskripsi", header: "Deskripsi", render: (c) => <span className="text-muted-foreground">{c.deskripsi}</span> },
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
      </ModalForm>
    </div>
  );
}
