const Pengaturan = require("../models/pengaturanModel");
const asyncHandler = require("../utils/asyncHandler");

const defaultPengaturan = {
  nama_usaha: "Rentory Rental",
  telepon: "0812-0000-0000",
  alamat: "Jl. Operasional No. 1, Jakarta",
  denda_keterlambatan_default: 25000,
  deposit_minimum_default: 100000,
  notifikasi_pengembalian: true,
  tandai_overdue_otomatis: true,
};

const ambilPengaturan = asyncHandler(async (req, res) => {
  let pengaturan = await Pengaturan.findOne();

  if (!pengaturan) {
    pengaturan = await Pengaturan.create(defaultPengaturan);
  }

  res.json({
    sukses: true,
    pesan: "Pengaturan berhasil diambil",
    data: pengaturan,
  });
});

const simpanPengaturan = asyncHandler(async (req, res) => {
  let pengaturan = await Pengaturan.findOne();

  if (!pengaturan) {
    pengaturan = await Pengaturan.create({
      ...defaultPengaturan,
      ...req.body,
    });
  } else {
    Object.assign(pengaturan, req.body);
    await pengaturan.save();
  }

  res.json({
    sukses: true,
    pesan: "Pengaturan berhasil disimpan",
    data: pengaturan,
  });
});

module.exports = {
  ambilPengaturan,
  simpanPengaturan,
};
