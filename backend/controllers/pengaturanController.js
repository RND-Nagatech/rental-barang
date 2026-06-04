const Pengaturan = require("../models/pengaturanModel");
const asyncHandler = require("../utils/asyncHandler");

const defaultPengaturan = {
  nama_usaha: "Rentory Rental",
  telepon: "0812-0000-0000",
  alamat: "Jl. Operasional No. 1, Jakarta",
  denda_keterlambatan_default: 25000,
  deposit_minimum_default: 100000,
  jenis_jaminan_default: "deposit_uang",
  nominal_deposit_default: 100000,
  jenis_dokumen_default: "ktp",
  notifikasi_pengembalian: true,
  tandai_overdue_otomatis: true,
};

const normalisasiBodyPengaturan = (body = {}) => {
  const hasil = { ...body };

  if (hasil.nominal_deposit_default === undefined) {
    hasil.nominal_deposit_default = Number(
      hasil.deposit_minimum_default ?? defaultPengaturan.nominal_deposit_default
    );
  }

  if (hasil.deposit_minimum_default === undefined) {
    hasil.deposit_minimum_default = Number(
      hasil.nominal_deposit_default ?? defaultPengaturan.deposit_minimum_default
    );
  }

  if (!hasil.jenis_jaminan_default) {
    hasil.jenis_jaminan_default = defaultPengaturan.jenis_jaminan_default;
  }

  if (!hasil.jenis_dokumen_default) {
    hasil.jenis_dokumen_default = defaultPengaturan.jenis_dokumen_default;
  }

  return hasil;
};

const ambilPengaturan = asyncHandler(async (req, res) => {
  let pengaturan = await Pengaturan.findOne();

  if (!pengaturan) {
    pengaturan = await Pengaturan.create(normalisasiBodyPengaturan(defaultPengaturan));
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
      ...normalisasiBodyPengaturan(req.body),
    });
  } else {
    Object.assign(pengaturan, normalisasiBodyPengaturan(req.body));
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
