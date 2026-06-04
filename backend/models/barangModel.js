const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const barangSchema = new mongoose.Schema(
  {
    kode_barang: {
      type: String,
      required: [true, "Kode barang wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nama_barang: {
      type: String,
      required: [true, "Nama barang wajib diisi"],
      trim: true,
    },
    id_kategori: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kategori",
      required: [true, "Kategori wajib diisi"],
    },
    deskripsi: {
      type: String,
      trim: true,
      default: null,
    },
    merk: {
      type: String,
      trim: true,
      default: null,
    },
    tipe: {
      type: String,
      trim: true,
      default: null,
    },
    nomor_seri: {
      type: String,
      trim: true,
      default: null,
    },
    kondisi: {
      type: String,
      enum: ["baik", "rusak_ringan", "rusak_berat"],
      default: "baik",
    },
    stok_total: {
      type: Number,
      required: [true, "Stok total wajib diisi"],
      min: [0, "Stok total tidak boleh kurang dari 0"],
      default: 0,
    },
    stok_tersedia: {
      type: Number,
      required: [true, "Stok tersedia wajib diisi"],
      min: [0, "Stok tersedia tidak boleh kurang dari 0"],
      default: 0,
    },
    harga_sewa_per_hari: {
      type: Number,
      required: [true, "Harga sewa per hari wajib diisi"],
      min: [0, "Harga sewa per hari tidak boleh kurang dari 0"],
      default: 0,
    },
    denda_per_hari: {
      type: Number,
      min: [0, "Denda per hari tidak boleh kurang dari 0"],
      default: 0,
    },
    deposit_default: {
      type: Number,
      min: [0, "Deposit default tidak boleh kurang dari 0"],
      default: 0,
    },
    foto: {
      type: String,
      trim: true,
      default: null,
    },
    status_aktif: {
      type: Boolean,
      default: true,
    },
    ...commonFields,
  },
  schemaOptions
);

module.exports = mongoose.model("Barang", barangSchema, "tm_barang");
