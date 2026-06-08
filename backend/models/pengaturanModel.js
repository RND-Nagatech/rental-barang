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
    tentang_rentory: {
      type: String,
      trim: true,
      default:
        "Rentory adalah platform rental barang yang membantu customer menyewa kebutuhan acara, perlengkapan, dan barang harian dengan proses yang mudah, transparan, dan terpercaya.",
    },
    bantuan_whatsapp: {
      type: String,
      trim: true,
      default: "",
    },
    bantuan_faq: {
      type: [
        {
          pertanyaan: {
            type: String,
            trim: true,
            default: "",
          },
          jawaban: {
            type: String,
            trim: true,
            default: "",
          },
        },
      ],
      default: [
        {
          pertanyaan: "Bagaimana cara membuat pesanan?",
          jawaban: "Pilih barang dari katalog, masukkan ke keranjang, lalu checkout.",
        },
        {
          pertanyaan: "Kapan jaminan dibayarkan?",
          jawaban: "Jaminan dicatat admin saat serah terima keluar.",
        },
      ],
    },
    app_name: {
      type: String,
      trim: true,
      default: "Rentory",
    },
    home_headline: {
      type: String,
      trim: true,
      default: "Sewa apa saja, kapan saja. Mudah & terpercaya.",
    },
    home_subheadline: {
      type: String,
      trim: true,
      default: "",
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
    wa_enabled: {
      type: Boolean,
      default: false,
    },
    wa_connection_mode: {
      type: String,
      enum: ["provider_api", "web_qr"],
      default: "provider_api",
    },
    wa_provider_url: {
      type: String,
      trim: true,
      default: "",
    },
    wa_api_key: {
      type: String,
      trim: true,
      default: "",
    },
    wa_sender: {
      type: String,
      trim: true,
      default: "",
    },
    wa_test_phone: {
      type: String,
      trim: true,
      default: "",
    },
    wa_notif_booking_success: {
      type: Boolean,
      default: true,
    },
    wa_reminder_pembayaran_hari_h: {
      type: Boolean,
      default: true,
    },
    wa_reminder_pengembalian_hari_h: {
      type: Boolean,
      default: true,
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
