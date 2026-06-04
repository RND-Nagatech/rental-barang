import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Link2, LogOut, MessageCircle, QrCode, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { pengaturanApi } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [jenisJaminan, setJenisJaminan] = React.useState("deposit_uang");
  const [jenisDokumen, setJenisDokumen] = React.useState("ktp");
  const [notif, setNotif] = React.useState(true);
  const [autoOverdue, setAutoOverdue] = React.useState(true);
  const [waEnabled, setWaEnabled] = React.useState(false);
  const [waConnectionMode, setWaConnectionMode] = React.useState<"provider_api" | "web_qr">(
    "provider_api",
  );
  const [waProviderUrl, setWaProviderUrl] = React.useState("");
  const [waApiKey, setWaApiKey] = React.useState("");
  const [waSender, setWaSender] = React.useState("");
  const [waTestPhone, setWaTestPhone] = React.useState("");
  const [waNotifBooking, setWaNotifBooking] = React.useState(true);
  const [waReminderPembayaran, setWaReminderPembayaran] = React.useState(true);
  const [waReminderPengembalian, setWaReminderPengembalian] = React.useState(true);
  const [waWebStatus, setWaWebStatus] = React.useState<"disconnected" | "initializing" | "qr_ready" | "authenticated" | "connected" | "auth_failure">("disconnected");
  const [waWebQr, setWaWebQr] = React.useState("");
  const [waWebError, setWaWebError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [processingReminder, setProcessingReminder] = React.useState(false);

  React.useEffect(() => {
    pengaturanApi
      .get()
      .then((data) => {
        setNama(data.nama_usaha);
        setTelepon(data.telepon);
        setAlamat(data.alamat);
        setDenda(data.denda_keterlambatan_default);
        setDeposit(data.nominal_deposit_default ?? data.deposit_minimum_default);
        setJenisJaminan(data.jenis_jaminan_default || "deposit_uang");
        setJenisDokumen(data.jenis_dokumen_default || "ktp");
        setNotif(data.notifikasi_pengembalian);
        setAutoOverdue(data.tandai_overdue_otomatis);
        setWaEnabled(Boolean(data.wa_enabled));
        setWaConnectionMode(data.wa_connection_mode || "provider_api");
        setWaProviderUrl(data.wa_provider_url || "");
        setWaApiKey(data.wa_api_key || "");
        setWaSender(data.wa_sender || "");
        setWaTestPhone(data.wa_test_phone || "");
        setWaNotifBooking(Boolean(data.wa_notif_booking_success));
        setWaReminderPembayaran(Boolean(data.wa_reminder_pembayaran_hari_h));
        setWaReminderPengembalian(Boolean(data.wa_reminder_pengembalian_hari_h));
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
        jenis_jaminan_default: jenisJaminan,
        nominal_deposit_default: deposit,
        jenis_dokumen_default: jenisDokumen,
        wa_enabled: waEnabled,
        wa_connection_mode: waConnectionMode,
        wa_provider_url: waProviderUrl,
        wa_api_key: waApiKey,
        wa_sender: waSender,
        wa_test_phone: waTestPhone,
        wa_notif_booking_success: waNotifBooking,
        wa_reminder_pembayaran_hari_h: waReminderPembayaran,
        wa_reminder_pengembalian_hari_h: waReminderPengembalian,
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

  async function refreshWaWebStatus() {
    try {
      const hasil = await pengaturanApi.waWebStatus();
      setWaWebStatus((hasil.data.status as typeof waWebStatus) || "disconnected");
      setWaWebQr(hasil.data.qrDataUrl || "");
      setWaWebError(hasil.data.lastError || "");
    } catch (error) {
      setWaWebError(error instanceof Error ? error.message : "Gagal cek status WA Web");
    }
  }

  async function mulaiScanQrWA() {
    try {
      const hasil = await pengaturanApi.waWebStart();
      setWaWebStatus((hasil.data.status as typeof waWebStatus) || "initializing");
      setWaWebQr(hasil.data.qrDataUrl || "");
      setWaWebError(hasil.data.lastError || "");
      setWaEnabled(true);
      setWaConnectionMode("web_qr");
      toast.success("Mode scan QR dijalankan. Scan QR jika sudah muncul.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memulai scan QR WA.");
    }
  }

  async function disconnectWaWeb() {
    try {
      await pengaturanApi.waWebDisconnect();
      setWaWebStatus("disconnected");
      setWaWebQr("");
      setWaWebError("");
      toast.success("Sesi WhatsApp Web diputus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memutus sesi WA Web.");
    }
  }

  React.useEffect(() => {
    if (!waEnabled || waConnectionMode !== "web_qr") return;
    refreshWaWebStatus();
  }, [waEnabled, waConnectionMode]);

  React.useEffect(() => {
    if (!waEnabled || waConnectionMode !== "web_qr") return;

    const timer = window.setInterval(() => {
      refreshWaWebStatus();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [waEnabled, waConnectionMode]);

  async function testKoneksiWA() {
    if (!waTestPhone) {
      toast.error("Isi no WA tujuan test terlebih dahulu.");
      return;
    }

    setSendingTest(true);
    try {
      await pengaturanApi.waTest(waTestPhone);
      toast.success("Pesan test WA berhasil dikirim.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal kirim test WA.");
    } finally {
      setSendingTest(false);
    }
  }

  async function jalankanReminderHariIni() {
    setProcessingReminder(true);
    try {
      const hasil = await pengaturanApi.waProcessReminders();
      const data = hasil.data;
      toast.success(
        `Reminder diproses. Pembayaran: ${data.pembayaran}, Pengembalian: ${data.pengembalian}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses reminder WA.");
    } finally {
      setProcessingReminder(false);
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
            <div className="border-t" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Pengaturan Jaminan</p>
              <p className="text-xs text-muted-foreground">
                Atur nilai default jaminan untuk transaksi baru.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Jenis Jaminan Default</Label>
              <Select value={jenisJaminan} onValueChange={setJenisJaminan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit_uang">Deposit Uang</SelectItem>
                  <SelectItem value="dokumen">Dokumen</SelectItem>
                  <SelectItem value="deposit_dokumen">Deposit + Dokumen</SelectItem>
                  <SelectItem value="tanpa_jaminan">Tanpa Jaminan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nominal Deposit Default</Label>
              <CurrencyInput value={deposit} onChange={setDeposit} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Jenis Dokumen Default</Label>
              <Select value={jenisDokumen} onValueChange={setJenisDokumen}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ktp">KTP</SelectItem>
                  <SelectItem value="sim">SIM</SelectItem>
                  <SelectItem value="paspor">Paspor</SelectItem>
                  <SelectItem value="kartu_mahasiswa">Kartu Mahasiswa</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Integrasi WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              label="Aktifkan WhatsApp"
              desc="Gunakan WA untuk notifikasi booking dan reminder hari-H."
              checked={waEnabled}
              onChange={setWaEnabled}
            />

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mode Koneksi WhatsApp</Label>
              <Select
                value={waConnectionMode}
                onValueChange={(value) => setWaConnectionMode(value as "provider_api" | "web_qr")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider_api">Provider API</SelectItem>
                  <SelectItem value="web_qr">WhatsApp Web (Scan QR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {waConnectionMode === "provider_api" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Endpoint Provider WA</Label>
                  <Input
                    value={waProviderUrl}
                    onChange={(e) => setWaProviderUrl(e.target.value)}
                    placeholder="https://provider-wa.example/send"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">API Key WA</Label>
                  <Input
                    type="password"
                    value={waApiKey}
                    onChange={(e) => setWaApiKey(e.target.value)}
                    placeholder="api-key"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sender / Device</Label>
                  <Input
                    value={waSender}
                    onChange={(e) => setWaSender(e.target.value)}
                    placeholder="62812xxxx"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={mulaiScanQrWA}>
                    <QrCode /> Mulai Scan QR
                  </Button>
                  <Button type="button" variant="outline" onClick={refreshWaWebStatus}>
                    <RefreshCcw /> Refresh Status
                  </Button>
                  <Button type="button" variant="outline" onClick={disconnectWaWeb}>
                    <LogOut /> Putuskan Sesi
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Status WA Web: <span className="font-medium text-foreground">{waWebStatus}</span>
                </p>
                {waWebError ? (
                  <p className="text-xs text-destructive">{waWebError}</p>
                ) : null}
                {waWebQr ? (
                  <div className="rounded-lg border bg-card p-3 sm:max-w-xs">
                    <img src={waWebQr} alt="QR WhatsApp Web" className="h-auto w-full" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Scan QR ini dari WhatsApp di HP Anda seperti WhatsApp Web.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">Trigger Notifikasi WA</p>
              <Toggle
                label="Booking berhasil"
                desc="Kirim WA saat transaksi booking berhasil dibuat."
                checked={waNotifBooking}
                onChange={setWaNotifBooking}
              />
              <Toggle
                label="Reminder pembayaran belum lunas (hari H)"
                desc="Kirim WA jika hari ini jatuh tempo pengembalian namun masih ada sisa tagihan."
                checked={waReminderPembayaran}
                onChange={setWaReminderPembayaran}
              />
              <Toggle
                label="Reminder barang belum dikembalikan (hari H)"
                desc="Kirim WA jika hari ini jadwal pengembalian namun transaksi belum selesai."
                checked={waReminderPengembalian}
                onChange={setWaReminderPengembalian}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">No WA Test</Label>
                <Input
                  value={waTestPhone}
                  onChange={(e) => setWaTestPhone(e.target.value)}
                  placeholder="62812xxxx"
                />
              </div>
              <Button type="button" variant="outline" onClick={testKoneksiWA} disabled={sendingTest}>
                <Link2 /> Test Koneksi WA
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={jalankanReminderHariIni}
                disabled={processingReminder}
              >
                <BellRing /> Jalankan Reminder Hari Ini
              </Button>
            </div>
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
