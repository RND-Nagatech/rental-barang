import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ModalForm } from "@/components/common/ModalForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { adminUserApi, type AdminUserApi } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/manage-user")({
  head: () => ({ meta: [{ title: "Manage User — Rentory" }] }),
  component: ManageUserPage,
});

type UserForm = {
  nama_user: string;
  email: string;
  password: string;
  role: "admin" | "staff";
  status_aktif: boolean;
};

const emptyForm: UserForm = {
  nama_user: "",
  email: "",
  password: "",
  role: "staff",
  status_aktif: true,
};

function ManageUserPage() {
  const [users, setUsers] = React.useState<AdminUserApi[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUserApi | null>(null);
  const [form, setForm] = React.useState<UserForm>(emptyForm);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminUserApi.list();
      setUsers(response.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat user");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(user: AdminUserApi) {
    setEditing(user);
    setForm({
      nama_user: user.nama_user,
      email: user.email,
      password: "",
      role: user.role,
      status_aktif: user.status_aktif,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.nama_user.trim() || !form.email.trim()) {
      toast.error("Nama dan email wajib diisi.");
      return;
    }

    if (!editing && form.password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    try {
      if (editing) {
        await adminUserApi.update(editing.id || editing._id || "", {
          nama_user: form.nama_user,
          email: form.email,
          role: form.role,
          status_aktif: form.status_aktif,
        });
        toast.success("User diperbarui.");
      } else {
        await adminUserApi.create(form);
        toast.success("User ditambahkan.");
      }
      setOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan user");
    }
  }

  async function toggleStatus(user: AdminUserApi) {
    try {
      await adminUserApi.setStatus(user.id || user._id || "", !user.status_aktif);
      toast.success(user.status_aktif ? "User dinonaktifkan." : "User diaktifkan.");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status user");
    }
  }

  async function resetPassword(user: AdminUserApi) {
    const password = window.prompt(`Password baru untuk ${user.nama_user}`);
    if (password === null) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    try {
      await adminUserApi.resetPassword(user.id || user._id || "", password);
      toast.success("Password berhasil direset.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal reset password");
    }
  }

  async function removeUser(user: AdminUserApi) {
    if (!window.confirm(`Hapus user ${user.nama_user}?`)) return;
    try {
      await adminUserApi.remove(user.id || user._id || "");
      toast.success("User dihapus.");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus user");
    }
  }

  const columns: Column<AdminUserApi>[] = [
    {
      key: "nama_user",
      header: "User",
      render: (user) => (
        <div>
          <p className="font-semibold">{user.nama_user}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    { key: "kode_user", header: "Kode" },
    {
      key: "role",
      header: "Role",
      render: (user) => <Badge variant="secondary" className="capitalize">{user.role}</Badge>,
    },
    {
      key: "status_aktif",
      header: "Status",
      render: (user) => (
        <Badge variant={user.status_aktif ? "default" : "outline"}>
          {user.status_aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      render: (user) => <span className="text-muted-foreground">{formatDate(user.updated_at || user.created_at || "")}</span>,
    },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (user) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(user)}><Pencil /></Button>
          <Button variant="ghost" size="icon" title="Aktif/nonaktif" onClick={() => toggleStatus(user)}><Power /></Button>
          <Button variant="ghost" size="icon" title="Reset password" onClick={() => resetPassword(user)}><KeyRound /></Button>
          <Button variant="ghost" size="icon" title="Hapus" onClick={() => removeUser(user)}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage User"
        description="Kelola user admin dan staff untuk akses web admin."
        actions={<Button onClick={openAdd}><Plus /> Tambah User</Button>}
      />

      <DataTable
        columns={columns}
        data={users}
        rowKey={(user) => user.id || user._id || user.kode_user}
        searchKeys={["kode_user", "nama_user", "email", "role"]}
        searchPlaceholder="Cari user..."
        emptyMessage={loading ? "Memuat data user..." : "Belum ada user."}
      />

      <ModalForm open={open} onOpenChange={setOpen} title={editing ? "Edit User" : "Tambah User"} onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama User">
            <Input value={form.nama_user} onChange={(event) => setForm({ ...form, nama_user: event.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          {!editing && (
            <Field label="Password">
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </Field>
          )}
          <Field label="Role">
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserForm["role"] })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.status_aktif}
              onChange={(event) => setForm({ ...form, status_aktif: event.target.checked })}
            />
            Status aktif
          </label>
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
