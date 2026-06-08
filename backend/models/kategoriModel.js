const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const kategoriSchema = new mongoose.Schema(
  {
    kode_kategori: {
      type: String,
      required: [true, "Kode kategori wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nama_kategori: {
      type: String,
      required: [true, "Nama kategori wajib diisi"],
      trim: true,
    },
    deskripsi: {
      type: String,
      trim: true,
      default: null,
    },
    icon_kategori: {
      type: String,
      trim: true,
      default: "",
    },
    gambar_kategori: {
      type: String,
      trim: true,
      default: "",
    },
    urutan_tampil: {
      type: Number,
      min: [0, "Urutan tampil tidak boleh kurang dari 0"],
      default: 0,
    },
    tampil_di_apk: {
      type: Boolean,
      default: true,
    },
    status_aktif: {
      type: Boolean,
      default: true,
    },
    ...commonFields,
  },
  schemaOptions
);

module.exports = mongoose.model("Kategori", kategoriSchema, "tm_kategori");
