const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const metodePembayaranSchema = new mongoose.Schema(
  {
    kode_metode: {
      type: String,
      required: [true, "Kode metode wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nama_metode: {
      type: String,
      required: [true, "Nama metode wajib diisi"],
      trim: true,
    },
    tipe_metode: {
      type: String,
      enum: ["bank_transfer", "qris", "e_wallet", "cash"],
      default: "bank_transfer",
    },
    nama_bank: {
      type: String,
      trim: true,
      default: "",
    },
    nomor_rekening: {
      type: String,
      trim: true,
      default: "",
    },
    nama_pemilik: {
      type: String,
      trim: true,
      default: "",
    },
    qr_image: {
      type: String,
      trim: true,
      default: "",
    },
    instruksi_pembayaran: {
      type: String,
      trim: true,
      default: "",
    },
    tampil_di_apk: {
      type: Boolean,
      default: true,
    },
    status_aktif: {
      type: Boolean,
      default: true,
    },
    urutan_tampil: {
      type: Number,
      default: 0,
    },
    ...commonFields,
  },
  schemaOptions
);

module.exports = mongoose.model("MetodePembayaran", metodePembayaranSchema, "tm_metode_pembayaran");
