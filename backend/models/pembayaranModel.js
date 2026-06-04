const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const hariIni = () => {
  const tanggal = new Date();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
  const hari = String(tanggal.getDate()).padStart(2, "0");
  return `${tanggal.getFullYear()}-${bulan}-${hari}`;
};

const pembayaranSchema = new mongoose.Schema(
  {
    kode_pembayaran: {
      type: String,
      required: [true, "Kode pembayaran wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    kode_rental: {
      type: String,
      required: [true, "Kode rental wajib diisi"],
      trim: true,
      uppercase: true,
    },
    tanggal_bayar: {
      type: String,
      required: [true, "Tanggal bayar wajib diisi"],
      default: hariIni,
    },
    tipe_bayar: {
      type: String,
      enum: ["dp", "tambah_dp", "pelunasan", "denda", "refund_deposit"],
      default: "dp",
    },
    metode_bayar: {
      type: String,
      enum: ["tunai", "transfer", "qris", "kartu", "lainnya"],
      default: "tunai",
    },
    jumlah_bayar: {
      type: Number,
      required: [true, "Jumlah bayar wajib diisi"],
      min: [0, "Jumlah bayar tidak boleh kurang dari 0"],
    },
    referensi_bayar: {
      type: String,
      trim: true,
      default: null,
    },
    bukti_bayar: {
      type: String,
      trim: true,
      default: null,
    },
    catatan: {
      type: String,
      trim: true,
      default: null,
    },
    ...commonFields,
  },
  schemaOptions
);

module.exports = mongoose.model("Pembayaran", pembayaranSchema, "tt_pembayaran");
