const mongoose = require("mongoose");
const { commonFields, schemaOptions } = require("./commonFields");

const rentalChargeSchema = new mongoose.Schema(
  {
    kode_rental: {
      type: String,
      required: [true, "Kode rental wajib diisi"],
      trim: true,
      uppercase: true,
    },
    jenis_charge: {
      type: String,
      enum: ["keterlambatan", "kerusakan", "kehilangan", "laundry_cleaning", "lainnya"],
      required: [true, "Jenis charge wajib diisi"],
    },
    nominal: {
      type: Number,
      min: [0, "Nominal charge tidak boleh kurang dari 0"],
      default: 0,
    },
    catatan: {
      type: String,
      trim: true,
      default: null,
    },
    potong_dari_jaminan: {
      type: Boolean,
      default: false,
    },
    ...commonFields,
  },
  schemaOptions
);

module.exports = mongoose.model("RentalCharge", rentalChargeSchema, "tt_rental_charge");
