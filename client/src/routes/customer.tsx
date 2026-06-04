import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Eye, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Customer } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ModalForm } from "@/components/common/ModalForm";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah, formatDate } from "@/lib/format";
import { txTotal } from "@/lib/rental";

export const Route = createFileRoute("/customer")({
  head: () => ({ meta: [{ title: "Customer — Rentory" }] }),
  component: CustomerPage,
});

const empty = { nama: "", telepon: "", email: "", alamat: "", ktp: "" };

function CustomerPage() {
  const { customers, transactions, addCustomer, updateCustomer, getCustomer } = useStore();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [form, setForm] = React.useState(empty);
  const [detail, setDetail] = React.useState<Customer | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ nama: c.nama, telepon: c.telepon, email: c.email, alamat: c.alamat, ktp: c.ktp });
    setOpen(true);
  }
  function save() {
    if (!form.nama || !form.telepon) {
      toast.error("Nama dan telepon wajib diisi.");
      return;
    }
    if (editing) {
      updateCustomer({ ...editing, ...form });
      toast.success("Customer diperbarui.");
    } else {
      addCustomer(form);
      toast.success("Customer ditambahkan.");
    }
    setOpen(false);
  }

  const columns: Column<Customer>[] = [
    {
      key: "nama",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {c.nama.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="font-semibold">{c.nama}</p>
            <p className="text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "telepon", header: "Telepon" },
    { key: "alamat", header: "Alamat", render: (c) => <span className="text-muted-foreground line-clamp-1 max-w-[16rem]">{c.alamat}</span> },
    { key: "total", header: "Total Transaksi", render: (c) => `${c.totalTransaksi}×` },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setDetail(c)}><Eye /></Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil /></Button>
        </div>
      ),
    },
  ];

  const detailTx = detail ? transactions.filter((t) => t.customerId === detail.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer"
        description="Data pelanggan rental."
        actions={<Button onClick={openAdd}><Plus /> Tambah Customer</Button>}
      />

      <DataTable columns={columns} data={customers} rowKey={(c) => c.id} searchKeys={["nama", "telepon", "email"]} searchPlaceholder="Cari customer..." />

      <ModalForm open={open} onOpenChange={setOpen} title={editing ? "Edit Customer" : "Tambah Customer"} onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">No. Telepon</Label>
            <Input value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">No. KTP</Label>
            <Input value={form.ktp} onChange={(e) => setForm({ ...form, ktp: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Alamat</Label>
          <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
        </div>
      </ModalForm>

      <DetailDrawer open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.nama ?? ""} description="Profil customer">
        {detail && (
          <div className="space-y-6">
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <Row icon={Phone} value={detail.telepon} />
              <Row icon={Mail} value={detail.email} />
              <Row icon={MapPin} value={detail.alamat} />
              <Row icon={CreditCard} value={detail.ktp} />
            </div>
            <div>
              <h4 className="mb-2 font-display text-sm font-semibold">Riwayat Transaksi ({detailTx.length})</h4>
              {detailTx.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">Belum ada transaksi.</p>
              ) : (
                <div className="space-y-2">
                  {detailTx.map((t) => (
                    <div key={t.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{t.kode}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(t.tanggal_mulai)} · {formatRupiah(txTotal(t))}
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

function Row({ icon: Icon, value }: { icon: React.ComponentType<{ className?: string }>; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span>{value}</span>
    </div>
  );
}
