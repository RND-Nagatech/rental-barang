const Rental = require("../models/rentalModel");
const RentalDetail = require("../models/rentalDetailModel");
const Pembayaran = require("../models/pembayaranModel");
const asyncHandler = require("../utils/asyncHandler");

const csvValue = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const csvLine = (values) => values.map(csvValue).join(",");

const formatTanggal = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const hariIni = () => {
  const tanggal = new Date();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
  const hari = String(tanggal.getDate()).padStart(2, "0");
  return `${tanggal.getFullYear()}-${bulan}-${hari}`;
};

const exportLaporan = asyncHandler(async (req, res) => {
  const rentals = await Rental.find().sort({ created_at: -1 });
  const kodeRental = rentals.map((item) => item.kode_rental);
  const details = await RentalDetail.find({ kode_rental: { $in: kodeRental } }).sort({
    kode_rental: 1,
    created_at: 1,
  });
  const payments = await Pembayaran.find().sort({ tanggal_bayar: -1, created_at: -1 });

  const lines = [];

  lines.push("Laporan Rental");
  lines.push(
    csvLine([
      "kode_rental",
      "kode_customer",
      "nama_customer",
      "tanggal_mulai",
      "tanggal_rencana_kembali",
      "tanggal_keluar",
      "tanggal_kembali",
      "status",
      "subtotal",
      "diskon",
      "deposit",
      "total_sewa",
      "total_denda",
      "total_bayar",
      "sisa_tagihan",
      "catatan",
    ])
  );

  rentals.forEach((item) => {
    lines.push(
      csvLine([
        item.kode_rental,
        item.kode_customer,
        item.nama_customer,
        formatTanggal(item.tanggal_mulai),
        formatTanggal(item.tanggal_rencana_kembali),
        formatTanggal(item.tanggal_keluar),
        formatTanggal(item.tanggal_kembali),
        item.status,
        item.subtotal,
        item.diskon,
        item.deposit,
        item.total_sewa,
        item.total_denda,
        item.total_bayar,
        item.sisa_tagihan,
        item.catatan,
      ])
    );
  });

  lines.push("");
  lines.push("Detail Rental");
  lines.push(
    csvLine([
      "kode_rental",
      "kode_barang",
      "nama_barang",
      "qty",
      "qty_disiapkan",
      "qty_keluar",
      "qty_kembali",
      "kondisi_awal",
      "kondisi_kembali",
      "harga_sewa_per_hari",
      "jumlah_hari",
      "subtotal",
      "denda_per_hari",
      "catatan",
    ])
  );

  details.forEach((item) => {
    lines.push(
      csvLine([
        item.kode_rental,
        item.kode_barang,
        item.nama_barang,
        item.qty,
        item.qty_disiapkan,
        item.qty_keluar,
        item.qty_kembali,
        item.kondisi_awal,
        item.kondisi_kembali,
        item.harga_sewa_per_hari,
        item.jumlah_hari,
        item.subtotal,
        item.denda_per_hari,
        item.catatan,
      ])
    );
  });

  lines.push("");
  lines.push("Pembayaran");
  lines.push(
    csvLine([
      "kode_pembayaran",
      "kode_rental",
      "tanggal_bayar",
      "tipe_bayar",
      "metode_bayar",
      "jumlah_bayar",
      "bukti_bayar",
      "catatan",
    ])
  );

  payments.forEach((item) => {
    lines.push(
      csvLine([
        item.kode_pembayaran,
        item.kode_rental,
        formatTanggal(item.tanggal_bayar),
        item.tipe_bayar,
        item.metode_bayar,
        item.jumlah_bayar,
        item.bukti_bayar,
        item.catatan,
      ])
    );
  });

  const filename = `laporan-rental-${hariIni()}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(`\uFEFF${lines.join("\n")}`);
});

module.exports = {
  exportLaporan,
};
