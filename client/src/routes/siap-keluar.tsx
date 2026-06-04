import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import type { Transaction } from "@/data/types";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/siap-keluar")({
  head: () => ({ meta: [{ title: "Siap Keluar — Rentory" }] }),
  component: SiapKeluarPage,
});

function SiapKeluarPage() {
  const { transactions, getCustomer, getItem, updateTransaction } = useStore();
  const list = transactions.filter((t) => t.status === "Booking");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Siap Keluar"
        description="Siapkan barang (picking list) untuk transaksi status Booking."
      />
      {list.length === 0 ? (
        <Empty text="Tidak ada transaksi Booking yang perlu disiapkan." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((t) => (
            <PickingCard
              key={t.id}
              t={t}
              customer={getCustomer(t.customerId)?.nama ?? "-"}
              satuan={(id) => getItem(id)?.satuan || "unit"}
              onDone={updateTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PickingCard({
  t,
  customer,
  satuan,
  onDone,
}: {
  t: Transaction;
  customer: string;
  satuan: (id: string) => string;
  onDone: (t: Transaction) => void;
}) {
  const [lines, setLines] = React.useState(
    t.items.map((l) => ({ ...l, qty_disiapkan: l.qty, checklist: false })),
  );
  const allChecked = lines.every((l) => l.checklist && l.qty_disiapkan >= l.qty);

  function finish() {
    if (!allChecked) return toast.error("Lengkapi checklist & qty semua barang.");
    onDone({ ...t, items: lines, status: "Siap Keluar" });
    toast.success(`${t.kode} → Siap Keluar.`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display text-base">{t.kode}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {customer} · keluar {formatDate(t.tanggal_mulai)}
          </p>
        </div>
        <StatusBadge status={t.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Picking List</p>
        {lines.map((l, idx) => (
          <div key={l.itemId} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <Checkbox
              checked={l.checklist}
              onCheckedChange={(v) =>
                setLines(lines.map((x, i) => (i === idx ? { ...x, checklist: !!v } : x)))
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.nama}</p>
              <p className="text-xs text-muted-foreground">
                Dibutuhkan: {l.qty} {satuan(l.itemId)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Disiapkan</span>
              <Input
                type="number"
                min={0}
                className="h-8 w-16"
                value={l.qty_disiapkan}
                onChange={(e) =>
                  setLines(
                    lines.map((x, i) => (i === idx ? { ...x, qty_disiapkan: +e.target.value } : x)),
                  )
                }
              />
            </div>
          </div>
        ))}
        <Button className="w-full" onClick={finish} disabled={!allChecked}>
          {allChecked ? <CheckCircle2 /> : <PackageCheck />} Siapkan Barang
        </Button>
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
