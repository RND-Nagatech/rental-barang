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
    satuan: {
      type: String,
      required: [true, "Satuan wajib diisi"],
      trim: true,
      lowercase: true,
      default: "unit",
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
    stok_di_gudang: {
      type: Number,
      min: [0, "Stok di gudang tidak boleh kurang dari 0"],
      default: 0,
    },
    stok_sedang_keluar: {
      type: Number,
      min: [0, "Stok sedang keluar tidak boleh kurang dari 0"],
      default: 0,
    },
    stok_maintenance: {
      type: Number,
      min: [0, "Stok maintenance tidak boleh kurang dari 0"],
      default: 0,
    },
    stok_hilang: {
      type: Number,
      min: [0, "Stok hilang tidak boleh kurang dari 0"],
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
    status: {
      type: String,
      enum: ["tersedia", "disewa_sebagian", "full_disewa", "maintenance"],
      default: "tersedia",
    },
    ...commonFields,
  },
  schemaOptions
);

barangSchema.pre("save", function setStatusFromStock(next) {
  if (this.isNew && !this.stok_di_gudang && !this.stok_tersedia && this.stok_total) {
    this.stok_di_gudang = this.stok_total;
  }

  if (this.status_aktif === false) {
    this.status = "maintenance";
    return next();
  }

  const stokTampilan = Number(this.stok_di_gudang ?? this.stok_tersedia ?? this.stok_total ?? 0);
  this.stok_tersedia = stokTampilan;

  if (stokTampilan <= 0) {
    this.status = "full_disewa";
  } else if (stokTampilan < Number(this.stok_total || 0)) {
    this.status = "disewa_sebagian";
  } else {
    this.status = "tersedia";
  }

  next();
});

barangSchema.pre("findOneAndUpdate", function setStatusFromStockOnUpdate(next) {
  const update = this.getUpdate() || {};
  const data = update.$set || update;

  if (data.status_aktif === false) {
    data.status = "maintenance";
  } else if (
    data.stok_total !== undefined ||
    data.stok_tersedia !== undefined ||
    data.stok_di_gudang !== undefined
  ) {
    const stokTotal = Number(data.stok_total ?? 0);
    const stokTersedia = Number(data.stok_di_gudang ?? data.stok_tersedia ?? stokTotal);
    data.stok_tersedia = stokTersedia;

    if (stokTersedia <= 0) {
      data.status = "full_disewa";
    } else if (stokTersedia < stokTotal) {
      data.status = "disewa_sebagian";
    } else {
      data.status = "tersedia";
    }
  }

  if (update.$set) {
    update.$set = data;
  }

  next();
});

module.exports = mongoose.model("Barang", barangSchema, "tm_barang");
