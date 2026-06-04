import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { pengaturanApi } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — Rentory" }] }),
  component: Page,
});

function Page() {
  const [nama, setNama] = React.useState("Rentory Rental");
  const [telepon, setTelepon] = React.useState("0812-0000-0000");
  const [alamat, setAlamat] = React.useState("Jl. Operasional No. 1, Jakarta");
  const [denda, setDenda] = React.useState(25000);
  const [deposit, setDeposit] = React.useState(100000);
  const [notif, setNotif] = React.useState(true);
  const [autoOverdue, setAutoOverdue] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    pengaturanApi
      .get()
      .then((data) => {
        setNama(data.nama_usaha);
        setTelepon(data.telepon);
        setAlamat(data.alamat);
        setDenda(data.denda_keterlambatan_default);
        setDeposit(data.deposit_minimum_default);
        setNotif(data.notifikasi_pengembalian);
        setAutoOverdue(data.tandai_overdue_otomatis);
      })
      .catch((error) => {
        toast.error(error.message || "Gagal memuat pengaturan.");
      });
  }, []);

  async function save() {
    setSaving(true);

    try {
      await pengaturanApi.update({
        nama_usaha: nama,
        telepon,
        alamat,
        denda_keterlambatan_default: denda,
        deposit_minimum_default: deposit,
        notifikasi_pengembalian: notif,
        tandai_overdue_otomatis: autoOverdue,
      });
      toast.success("Pengaturan disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Konfigurasi aplikasi dan kebijakan rental."
        actions={
          <Button onClick={save} disabled={saving}>
            <Save /> Simpan
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Profil Usaha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nama Usaha</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telepon</Label>
              <Input value={telepon} onChange={(e) => setTelepon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alamat</Label>
              <Input value={alamat} onChange={(e) => setAlamat(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Kebijakan Rental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Denda Keterlambatan Default / Hari
              </Label>
              <CurrencyInput value={denda} onChange={setDenda} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Deposit Minimum Default</Label>
              <CurrencyInput value={deposit} onChange={setDeposit} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Notifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              label="Notifikasi pengembalian"
              desc="Ingatkan barang yang harus kembali hari ini."
              checked={notif}
              onChange={setNotif}
            />
            <Toggle
              label="Tandai overdue otomatis"
              desc="Beri badge overdue pada transaksi yang melewati tanggal kembali."
              checked={autoOverdue}
              onChange={setAutoOverdue}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
