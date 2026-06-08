const MetodePembayaran = require("../models/metodePembayaranModel");
const buatCrudController = require("./crudController");
const asyncHandler = require("../utils/asyncHandler");

const baseController = buatCrudController(MetodePembayaran, {
  fieldCari: ["kode_metode", "nama_metode", "nama_bank", "nomor_rekening", "nama_pemilik"],
});

const buatKodeMetode = async () => {
  const terakhir = await MetodePembayaran.findOne({ kode_metode: { $regex: "^MP-" } }).sort({
    kode_metode: -1,
  });
  const nomor = terakhir ? Number(String(terakhir.kode_metode).split("-").at(-1)) || 0 : 0;
  return `MP-${String(nomor + 1).padStart(4, "0")}`;
};

const normalisasiPayload = (body) => ({
  ...body,
  kode_metode: body.kode_metode ? String(body.kode_metode).toUpperCase() : body.kode_metode,
  nama_metode: String(body.nama_metode || "").trim(),
  tipe_metode: ["bank_transfer", "qris", "e_wallet", "cash"].includes(body.tipe_metode)
    ? body.tipe_metode
    : "bank_transfer",
  nama_bank: String(body.nama_bank || "").trim(),
  nomor_rekening: String(body.nomor_rekening || "").trim(),
  nama_pemilik: String(body.nama_pemilik || "").trim(),
  qr_image: String(body.qr_image || "").trim(),
  instruksi_pembayaran: String(body.instruksi_pembayaran || "").trim(),
  tampil_di_apk: body.tampil_di_apk !== undefined ? Boolean(body.tampil_di_apk) : true,
  status_aktif: body.status_aktif !== undefined ? Boolean(body.status_aktif) : true,
  urutan_tampil: Number(body.urutan_tampil || 0),
});

const tambah = asyncHandler(async (req, res) => {
  const payload = normalisasiPayload(req.body);
  payload.kode_metode = payload.kode_metode || (await buatKodeMetode());

  const data = await MetodePembayaran.create(payload);

  res.status(201).json({
    sukses: true,
    pesan: "Metode pembayaran berhasil ditambahkan",
    data,
  });
});

const ubah = asyncHandler(async (req, res) => {
  const data = await MetodePembayaran.findByIdAndUpdate(
    req.params.id,
    normalisasiPayload(req.body),
    { new: true, runValidators: true }
  );

  if (!data) {
    res.status(404);
    throw new Error("Metode pembayaran tidak ditemukan");
  }

  res.json({
    sukses: true,
    pesan: "Metode pembayaran berhasil diubah",
    data,
  });
});

module.exports = {
  ...baseController,
  tambah,
  ubah,
};
