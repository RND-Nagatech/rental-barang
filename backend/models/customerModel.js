const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const customerSchema = new mongoose.Schema(
  {
    kode_customer: {
      type: String,
      required: [true, "Kode customer wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nama_customer: {
      type: String,
      required: [true, "Nama customer wajib diisi"],
      trim: true,
    },
    jenis_identitas: {
      type: String,
      enum: ["ktp", "sim", "paspor", "lainnya"],
      default: "ktp",
    },
    nomor_identitas: {
      type: String,
      trim: true,
      default: null,
    },
    no_hp: {
      type: String,
      required: [true, "No HP wajib diisi"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    alamat: {
      type: String,
      trim: true,
      default: null,
    },
    catatan: {
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

module.exports = mongoose.model("Customer", customerSchema, "tm_customer");
