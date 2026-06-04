import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileBarChart,
  PackageOpen,
  AlertTriangle,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/AppStore";
import { laporanApi } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SummaryCard } from "@/components/common/SummaryCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction } from "@/data/types";
import { formatRupiah, formatDate } from "@/lib/format";
import { txTotal, returnTiming } from "@/lib/rental";

export const Route = createFileRoute("/laporan")({
  head: () => ({ meta: [{ title: "Laporan — Rentory" }] }),
  component: Page,
});

function Page() {
  const { transactions, payments, getCustomer } = useStore();

  const pendapatan = payments.reduce((s, p) => s + p.nominal, 0);
  const totalDenda = transactions.reduce(
    (s, t) => s + t.dendaKeterlambatan + t.dendaKerusakan + t.dendaKehilangan,
    0,
  );
  const terlambat = transactions.filter(
    (t) => t.status === "Sedang Disewa" && returnTiming(t.tanggal_rencana_kembali).overdue,
  );
  const barangKeluar = transactions.filter((t) => t.tanggal_keluar);

  async function exportLaporan() {
    try {
      const response = await fetch(laporanApi.exportUrl());

      if (!response.ok) {
        throw new Error("Export laporan gagal.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename =
        response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        "laporan-rental.csv";
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Laporan berhasil diunduh.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export laporan gagal.");
    }
  }

  const rentalCols: Column<Transaction>[] = [
    { key: "kode", header: "Kode", render: (t) => <span className="font-semibold">{t.kode}</span> },
    { key: "cust", header: "Customer", render: (t) => getCustomer(t.customerId)?.nama },
    {
      key: "periode",
      header: "Periode",
      render: (t) => `${formatDate(t.tanggal_mulai)} → ${formatDate(t.tanggal_rencana_kembali)}`,
    },
    { key: "total", header: "Total", render: (t) => formatRupiah(txTotal(t)) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
  ];

  const keluarCols: Column<Transaction>[] = [
    { key: "kode", header: "Kode", render: (t) => <span className="font-semibold">{t.kode}</span> },
    { key: "cust", header: "Customer", render: (t) => getCustomer(t.customerId)?.nama },
    { key: "keluar", header: "Tgl Keluar", render: (t) => formatDate(t.tanggal_keluar) },
    {
      key: "barang",
      header: "Barang",
      render: (t) => t.items.map((i) => `${i.nama} ×${i.qty}`).join(", "),
    },
  ];

  const lateCols: Column<Transaction>[] = [
    { key: "kode", header: "Kode", render: (t) => <span className="font-semibold">{t.kode}</span> },
    { key: "cust", header: "Customer", render: (t) => getCustomer(t.customerId)?.nama },
    { key: "harus", header: "Harus Kembali", render: (t) => formatDate(t.tanggal_rencana_kembali) },
    { key: "late", header: "Keterlambatan", render: (t) => <StatusBadge status="Overdue" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Ringkasan laporan operasional rental per periode."
        actions={
          <Button onClick={exportLaporan}>
            <Download /> Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Pendapatan"
          value={formatRupiah(pendapatan)}
          icon={Wallet}
          tone="success"
        />
        <SummaryCard
          label="Total Denda"
          value={formatRupiah(totalDenda)}
          icon={ShieldAlert}
          tone="danger"
        />
        <SummaryCard
          label="Barang Keluar"
          value={barangKeluar.length}
          icon={PackageOpen}
          tone="info"
        />
        <SummaryCard
          label="Keterlambatan"
          value={terlambat.length}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <Tabs defaultValue="rental">
        <TabsList className="flex-wrap">
          <TabsTrigger value="rental">
            <FileBarChart className="mr-1 size-4" /> Rental
          </TabsTrigger>
          <TabsTrigger value="keluar">Barang Keluar</TabsTrigger>
          <TabsTrigger value="terlambat">Keterlambatan</TabsTrigger>
          <TabsTrigger value="pendapatan">Pendapatan & Denda</TabsTrigger>
        </TabsList>

        <TabsContent value="rental" className="mt-4">
          <DataTable
            columns={rentalCols}
            data={transactions}
            rowKey={(t) => t.id}
            searchKeys={["kode"]}
          />
        </TabsContent>
        <TabsContent value="keluar" className="mt-4">
          <DataTable
            columns={keluarCols}
            data={barangKeluar}
            rowKey={(t) => t.id}
            searchKeys={["kode"]}
            emptyMessage="Belum ada barang keluar."
          />
        </TabsContent>
        <TabsContent value="terlambat" className="mt-4">
          <DataTable
            columns={lateCols}
            data={terlambat}
            rowKey={(t) => t.id}
            searchKeys={["kode"]}
            emptyMessage="Tidak ada keterlambatan."
          />
        </TabsContent>
        <TabsContent value="pendapatan" className="mt-4">
          <DataTable
            columns={[
              { key: "tanggal", header: "Tanggal", render: (p) => formatDate(p.tanggal) },
              { key: "tipe", header: "Tipe", render: (p) => p.tipe },
              { key: "metode", header: "Metode", render: (p) => p.metode },
              {
                key: "nominal",
                header: "Nominal",
                render: (p) => <span className="font-semibold">{formatRupiah(p.nominal)}</span>,
              },
            ]}
            data={payments}
            rowKey={(p) => p.id}
            searchKeys={["metode", "catatan"]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
