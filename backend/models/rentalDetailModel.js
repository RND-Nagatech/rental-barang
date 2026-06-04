const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const rentalDetailSchema = new mongoose.Schema(
  {
    kode_rental: {
      type: String,
      required: [true, "Kode rental wajib diisi"],
      trim: true,
      uppercase: true,
    },
    kode_barang: {
      type: String,
      required: [true, "Kode barang wajib diisi"],
      trim: true,
      uppercase: true,
    },
    nama_barang: {
      type: String,
      required: [true, "Nama barang wajib diisi"],
      trim: true,
    },
    qty: {
      type: Number,
      required: [true, "Qty wajib diisi"],
      min: [1, "Qty minimal 1"],
      default: 1,
    },
    harga_sewa_per_hari: {
      type: Number,
      required: [true, "Harga sewa per hari wajib diisi"],
      min: [0, "Harga sewa per hari tidak boleh kurang dari 0"],
      default: 0,
    },
    jumlah_hari: {
      type: Number,
      required: [true, "Jumlah hari wajib diisi"],
      min: [1, "Jumlah hari minimal 1"],
      default: 1,
    },
    subtotal: {
      type: Number,
      min: [0, "Subtotal tidak boleh kurang dari 0"],
      default: 0,
    },
    denda_per_hari: {
      type: Number,
      min: [0, "Denda per hari tidak boleh kurang dari 0"],
      default: 0,
    },
    qty_disiapkan: {
      type: Number,
      min: [0, "Qty disiapkan tidak boleh kurang dari 0"],
      default: 0,
    },
    qty_keluar: {
      type: Number,
      min: [0, "Qty keluar tidak boleh kurang dari 0"],
      default: 0,
    },
    qty_kembali: {
      type: Number,
      min: [0, "Qty kembali tidak boleh kurang dari 0"],
      default: 0,
    },
    kondisi_awal: {
      type: String,
      trim: true,
      default: "Baik",
    },
    kondisi_kembali: {
      type: String,
      trim: true,
      default: "Baik",
    },
    foto_kondisi_awal: {
      type: [String],
      default: [],
    },
    foto_kondisi_kembali: {
      type: [String],
      default: [],
    },
    checklist: {
      type: Boolean,
      default: false,
    },
    catatan: {
      type: String,
      trim: true,
      default: null,
    },
  },
  schemaOptions
);

module.exports = mongoose.model(
  "RentalDetail",
  rentalDetailSchema,
  "tt_rental_detail"
);
