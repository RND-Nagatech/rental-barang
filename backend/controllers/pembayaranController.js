const Pembayaran = require("../models/pembayaranModel");
const Rental = require("../models/rentalModel");
const asyncHandler = require("../utils/asyncHandler");
const buatKodePembayaran = require("../utils/kodePembayaran");

const normalisasiTipeBayar = (tipe) =>
  String(tipe || "dp")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const normalisasiMetodeBayar = (metode) =>
  String(metode || "tunai")
    .trim()
    .toLowerCase();

const daftarPembayaran = asyncHandler(async (req, res) => {
  const pembayaran = await Pembayaran.find().sort({ tanggal_bayar: -1, created_at: -1 });

  res.json({
    sukses: true,
    pesan: "Data pembayaran berhasil diambil",
    jumlah: pembayaran.length,
    data: pembayaran,
  });
});

const tambahPembayaran = asyncHandler(async (req, res) => {
  const filterRental = [];

  if (req.body.id_rental) {
    filterRental.push({ _id: req.body.id_rental });
  }

  if (req.body.kode_rental) {
    filterRental.push({ kode_rental: String(req.body.kode_rental).toUpperCase() });
  }

  const rental = filterRental.length
    ? await Rental.findOne({ $or: filterRental })
    : null;

  if (!rental) {
    res.status(404);
    throw new Error("Rental tidak ditemukan");
  }

  const jumlahBayar = Number(req.body.jumlah_bayar || req.body.nominal || 0);

  if (jumlahBayar <= 0) {
    res.status(400);
    throw new Error("Jumlah bayar wajib lebih dari 0");
  }

  const pembayaran = await Pembayaran.create({
    kode_pembayaran:
      req.body.kode_pembayaran || (await buatKodePembayaran(req.body.tanggal_bayar)),
    kode_rental: rental.kode_rental,
    tanggal_bayar: req.body.tanggal_bayar || req.body.tanggal || new Date(),
    tipe_bayar: normalisasiTipeBayar(req.body.tipe_bayar || req.body.tipe),
    metode_bayar: normalisasiMetodeBayar(req.body.metode_bayar || req.body.metode),
    jumlah_bayar: jumlahBayar,
    referensi_bayar: req.body.referensi_bayar || null,
    bukti_bayar: req.body.bukti_bayar || req.body.bukti || null,
    catatan: req.body.catatan || null,
  });

  rental.total_bayar = Number(rental.total_bayar || 0) + jumlahBayar;
  rental.sisa_tagihan = Math.max(
    0,
    Number(rental.total_sewa || 0) +
      Number(rental.total_denda || 0) -
      Number(rental.total_bayar || 0)
  );
  await rental.save();

  res.status(201).json({
    sukses: true,
    pesan: "Pembayaran berhasil dicatat",
    data: pembayaran,
  });
});

module.exports = {
  daftarPembayaran,
  tambahPembayaran,
};
