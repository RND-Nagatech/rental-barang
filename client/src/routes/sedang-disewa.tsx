import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine } from "lucide-react";
import { useStore } from "@/store/AppStore";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/data/types";
import { formatDate } from "@/lib/format";
import { returnTiming } from "@/lib/rental";

export const Route = createFileRoute("/sedang-disewa")({
  head: () => ({ meta: [{ title: "Sedang Disewa — Rentory" }] }),
  component: Page,
});

function Page() {
  const { transactions, getCustomer, getItem } = useStore();
  const list = transactions.filter((t) => t.status === "Sedang Disewa");

  const columns: Column<Transaction>[] = [
    { key: "kode", header: "Kode", render: (t) => <span className="font-semibold">{t.kode}</span> },
    { key: "customer", header: "Customer", render: (t) => getCustomer(t.customerId)?.nama },
    {
      key: "barang",
      header: "Barang",
      render: (t) => (
        <span className="text-muted-foreground">
          {t.items
            .map((i) => `${i.nama} ×${i.qty} ${getItem(i.itemId)?.satuan || "unit"}`)
            .join(", ")}
        </span>
      ),
    },
    { key: "keluar", header: "Tgl Keluar", render: (t) => formatDate(t.tanggal_keluar) },
    { key: "harus", header: "Harus Kembali", render: (t) => formatDate(t.tanggal_rencana_kembali) },
    {
      key: "jaminan",
      header: "Jaminan",
      render: (t) =>
        t.status_jaminan === "Diterima" ? (
          <span className="text-sm font-medium">{t.jenis_jaminan}</span>
        ) : (
          <StatusBadge status="Belum Diterima" />
        ),
    },
    {
      key: "sisa",
      header: "Sisa / Status",
      render: (t) => {
        const r = returnTiming(t.tanggal_rencana_kembali);
        return r.overdue ? (
          <StatusBadge status="Overdue" />
        ) : (
          <span className="text-sm font-medium">{r.label}</span>
        );
      },
    },
    {
      key: "aksi",
      header: "",
      className: "text-right",
      render: (t) => (
        <Button asChild size="sm" variant="outline">
          <Link to="/serah-terima-kembali" search={{ tx: t.id }}>
            <ArrowDownToLine /> Pengembalian
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sedang Disewa"
        description="Transaksi aktif yang barangnya sedang berada di customer."
      />
      <DataTable
        columns={columns}
        data={list}
        rowKey={(t) => t.id}
        searchKeys={["kode"]}
        searchPlaceholder="Cari kode..."
        emptyMessage="Tidak ada barang yang sedang disewa."
      />
    </div>
  );
}
