import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/store/AppStore";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, toISODate } from "@/lib/format";

export const Route = createFileRoute("/kalender")({
  head: () => ({ meta: [{ title: "Kalender Ketersediaan — Rentory" }] }),
  component: Page,
});

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function Page() {
  const { transactions, items, categories, getCustomer } = useStore();
  const [ref, setRef] = React.useState(new Date());
  const [catFilter, setCatFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<string | null>(null);

  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalStok = items.filter((i) => catFilter === "all" || i.kategoriId === catFilter).reduce((s, i) => s + i.stok_total, 0);

  function bookingsOn(dateStr: string) {
    return transactions.filter(
      (t) => ["Booking", "Siap Keluar", "Sedang Disewa"].includes(t.status) &&
        dateStr >= t.tanggal_mulai && dateStr <= t.tanggal_rencana_kembali &&
        (catFilter === "all" || t.items.some((l) => items.find((i) => i.id === l.itemId)?.kategoriId === catFilter)),
    );
  }
  function bookedQty(dateStr: string) {
    return bookingsOn(dateStr).reduce((s, t) => s + t.items.filter((l) => catFilter === "all" || items.find((i) => i.id === l.itemId)?.kategoriId === catFilter).reduce((a, l) => a + l.qty, 0), 0);
  }

  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1) as unknown as null[],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender Ketersediaan"
        description="Pantau ketersediaan stok per tanggal."
        actions={
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">
              {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(ref)}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setRef(new Date(year, month - 1, 1))}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" onClick={() => setRef(new Date(year, month + 1, 1))}><ChevronRight /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {HARI.map((h) => <div key={h} className="py-1 text-center text-xs font-semibold text-muted-foreground">{h}</div>)}
              {cells.map((day, i) => {
                if (!day) return <div key={`e${i}`} />;
                const dateStr = toISODate(new Date(year, month, day));
                const booked = bookedQty(dateStr);
                const tersedia = Math.max(0, totalStok - booked);
                const full = totalStok > 0 && tersedia === 0;
                const partial = booked > 0 && !full;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelected(dateStr)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                      selected === dateStr && "ring-2 ring-primary",
                      full ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : partial ? "border-warning/40 bg-warning/15"
                        : "bg-card hover:bg-muted",
                    )}
                  >
                    <span className="font-semibold">{day}</span>
                    <span className="text-[10px] text-muted-foreground">{full ? "Penuh" : `${tersedia} sisa`}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <Legend className="bg-card border" label="Tersedia" />
              <Legend className="bg-warning/15 border-warning/40" label="Sebagian terbooking" />
              <Legend className="bg-destructive/10 border-destructive/30" label="Full booked" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">{selected ? formatDate(selected) : "Pilih tanggal"}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!selected ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Klik tanggal untuk melihat barang yang disewa.</p>
            ) : bookingsOn(selected).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada barang disewa pada tanggal ini.</p>
            ) : (
              bookingsOn(selected).map((t) => (
                <div key={t.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{getCustomer(t.customerId)?.nama}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.items.map((l) => `${l.nama} ×${l.qty}`).join(", ")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("size-3 rounded border", className)} />{label}</span>;
}
