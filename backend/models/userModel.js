const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const userSchema = new mongoose.Schema(
  {
    kode_user: {
      type: String,
      required: [true, "Kode user wajib diisi"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nama_user: {
      type: String,
      required: [true, "Nama user wajib diisi"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email wajib diisi"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password_hash: {
      type: String,
      required: [true, "Password wajib diisi"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
    status_aktif: {
      type: Boolean,
      default: true,
    },
    ...commonFields,
  },
  schemaOptions
);

module.exports = mongoose.model("User", userSchema, "tm_user");
