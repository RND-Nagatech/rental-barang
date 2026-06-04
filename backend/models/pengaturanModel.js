const mongoose = require("mongoose");
const { schemaOptions } = require("./commonFields");

const pengaturanSchema = new mongoose.Schema(
  {
    nama_usaha: {
      type: String,
      required: [true, "Nama usaha wajib diisi"],
      trim: true,
      default: "Rentory Rental",
    },
    telepon: {
      type: String,
      trim: true,
      default: "0812-0000-0000",
    },
    alamat: {
      type: String,
      trim: true,
      default: "Jl. Operasional No. 1, Jakarta",
    },
    denda_keterlambatan_default: {
      type: Number,
      min: [0, "Denda keterlambatan default tidak boleh kurang dari 0"],
      default: 25000,
    },
    deposit_minimum_default: {
      type: Number,
      min: [0, "Deposit minimum default tidak boleh kurang dari 0"],
      default: 100000,
    },
    jenis_jaminan_default: {
      type: String,
      enum: ["deposit_uang", "dokumen", "deposit_dokumen", "tanpa_jaminan"],
      default: "deposit_uang",
    },
    nominal_deposit_default: {
      type: Number,
      min: [0, "Nominal deposit default tidak boleh kurang dari 0"],
      default: 100000,
    },
    jenis_dokumen_default: {
      type: String,
      enum: ["ktp", "sim", "paspor", "kartu_mahasiswa", "lainnya"],
      default: "ktp",
    },
    notifikasi_pengembalian: {
      type: Boolean,
      default: true,
    },
    tandai_overdue_otomatis: {
      type: Boolean,
      default: true,
    },
  },
  schemaOptions
);

module.exports = mongoose.model("Pengaturan", pengaturanSchema, "tp_pengaturan");
