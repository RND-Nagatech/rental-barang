const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const rentalSchema = new mongoose.Schema(
  {
    kode_rental: {
      type: String,
      required: [true, "Kode rental wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    kode_customer: {
      type: String,
      required: [true, "Kode customer wajib diisi"],
      trim: true,
      uppercase: true,
    },
    nama_customer: {
      type: String,
      required: [true, "Nama customer wajib diisi"],
      trim: true,
    },
    tanggal_mulai: {
      type: String,
      required: [true, "Tanggal mulai wajib diisi"],
    },
    tanggal_rencana_kembali: {
      type: String,
      required: [true, "Tanggal rencana kembali wajib diisi"],
    },
    tanggal_keluar: {
      type: String,
      default: null,
    },
    tanggal_kembali: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "booking",
        "siap_keluar",
        "sedang_disewa",
        "serah_terima_kembali",
        "selesai",
        "batal",
      ],
      default: "draft",
    },
    subtotal: {
      type: Number,
      min: [0, "Subtotal tidak boleh kurang dari 0"],
      default: 0,
    },
    diskon: {
      type: Number,
      min: [0, "Diskon tidak boleh kurang dari 0"],
      default: 0,
    },
    deposit: {
      type: Number,
      min: [0, "Deposit tidak boleh kurang dari 0"],
      default: 0,
    },
    deposit_required: {
      type: Number,
      min: [0, "Deposit wajib tidak boleh kurang dari 0"],
      default: 0,
    },
    deposit_received: {
      type: Number,
      min: [0, "Deposit diterima tidak boleh kurang dari 0"],
      default: 0,
    },
    deposit_received_date: {
      type: String,
      default: null,
    },
    deposit_received_method: {
      type: String,
      enum: ["tunai", "transfer", "qris", "kartu", "lainnya"],
      default: null,
    },
    deposit_received_note: {
      type: String,
      trim: true,
      default: null,
    },
    deposit_status: {
      type: String,
      enum: ["belum_diterima", "diterima", "dikembalikan", "dipotong"],
      default: "belum_diterima",
    },
    jenis_jaminan: {
      type: String,
      enum: ["deposit_uang", "dokumen", "deposit_dokumen", "tanpa_jaminan"],
      default: "deposit_uang",
    },
    nominal_jaminan: {
      type: Number,
      min: [0, "Nominal jaminan tidak boleh kurang dari 0"],
      default: 0,
    },
    jenis_dokumen: {
      type: String,
      enum: ["ktp", "sim", "paspor", "kartu_mahasiswa", "lainnya"],
      default: null,
    },
    nomor_dokumen: {
      type: String,
      trim: true,
      default: null,
    },
    foto_dokumen: {
      type: [String],
      default: [],
    },
    status_jaminan: {
      type: String,
      enum: ["belum_diterima", "diterima", "dikembalikan", "dipotong", "ditahan"],
      default: "belum_diterima",
    },
    wa_last_booking_sent_at: {
      type: String,
      default: null,
    },
    wa_last_payment_reminder_at: {
      type: String,
      default: null,
    },
    wa_last_return_reminder_at: {
      type: String,
      default: null,
    },
    total_sewa: {
      type: Number,
      min: [0, "Total sewa tidak boleh kurang dari 0"],
      default: 0,
    },
    total_denda: {
      type: Number,
      min: [0, "Total denda tidak boleh kurang dari 0"],
      default: 0,
    },
    total_bayar: {
      type: Number,
      min: [0, "Total bayar tidak boleh kurang dari 0"],
      default: 0,
    },
    sisa_tagihan: {
      type: Number,
      min: [0, "Sisa tagihan tidak boleh kurang dari 0"],
      default: 0,
    },
    catatan: {
      type: String,
      trim: true,
      default: null,
    },
  },
  schemaOptions
);

module.exports = mongoose.model("Rental", rentalSchema, "tt_rental");
