const Pengaturan = require("../models/pengaturanModel");
const Rental = require("../models/rentalModel");
const Customer = require("../models/customerModel");
const asyncHandler = require("../utils/asyncHandler");
const { kirimWhatsApp } = require("../utils/whatsappNotifier");
const {
  startWhatsAppWeb,
  getWhatsAppWebStatus,
  disconnectWhatsAppWeb,
} = require("../utils/whatsappWebClient");

const hariIni = () => {
  const tanggal = new Date();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
  const hari = String(tanggal.getDate()).padStart(2, "0");
  return `${tanggal.getFullYear()}-${bulan}-${hari}`;
};

const defaultPengaturan = {
  nama_usaha: "Rentory Rental",
  telepon: "0812-0000-0000",
  alamat: "Jl. Operasional No. 1, Jakarta",
  tentang_rentory:
    "Rentory adalah platform rental barang yang membantu customer menyewa kebutuhan acara, perlengkapan, dan barang harian dengan proses yang mudah, transparan, dan terpercaya.",
  bantuan_whatsapp: "",
  bantuan_faq: [
    {
      pertanyaan: "Bagaimana cara membuat pesanan?",
      jawaban: "Pilih barang dari katalog, masukkan ke keranjang, lalu checkout.",
    },
    {
      pertanyaan: "Kapan jaminan dibayarkan?",
      jawaban: "Jaminan dicatat admin saat serah terima keluar.",
    },
  ],
  app_name: "Rentory",
  home_headline: "Sewa apa saja, kapan saja. Mudah & terpercaya.",
  home_subheadline: "",
  denda_keterlambatan_default: 25000,
  deposit_minimum_default: 100000,
  jenis_jaminan_default: "deposit_uang",
  nominal_deposit_default: 100000,
  jenis_dokumen_default: "ktp",
  wa_enabled: false,
  wa_connection_mode: "provider_api",
  wa_provider_url: "",
  wa_api_key: "",
  wa_sender: "",
  wa_test_phone: "",
  wa_notif_booking_success: true,
  wa_reminder_pembayaran_hari_h: true,
  wa_reminder_pengembalian_hari_h: true,
  notifikasi_pengembalian: true,
  tandai_overdue_otomatis: true,
};

const normalisasiBodyPengaturan = (body = {}) => {
  const hasil = { ...body };

  if (hasil.nominal_deposit_default === undefined) {
    hasil.nominal_deposit_default = Number(
      hasil.deposit_minimum_default ?? defaultPengaturan.nominal_deposit_default
    );
  }

  if (hasil.deposit_minimum_default === undefined) {
    hasil.deposit_minimum_default = Number(
      hasil.nominal_deposit_default ?? defaultPengaturan.deposit_minimum_default
    );
  }

  if (!hasil.jenis_jaminan_default) {
    hasil.jenis_jaminan_default = defaultPengaturan.jenis_jaminan_default;
  }

  if (!hasil.jenis_dokumen_default) {
    hasil.jenis_dokumen_default = defaultPengaturan.jenis_dokumen_default;
  }

  hasil.app_name = String(hasil.app_name || defaultPengaturan.app_name).trim();
  hasil.home_headline = String(
    hasil.home_headline || defaultPengaturan.home_headline
  ).trim();
  hasil.home_subheadline = String(hasil.home_subheadline || "").trim();
  hasil.tentang_rentory = String(
    hasil.tentang_rentory || defaultPengaturan.tentang_rentory
  ).trim();
  hasil.bantuan_whatsapp = String(hasil.bantuan_whatsapp || "").trim();
  hasil.bantuan_faq = Array.isArray(hasil.bantuan_faq)
    ? hasil.bantuan_faq
        .map((item) => ({
          pertanyaan: String(item?.pertanyaan || "").trim(),
          jawaban: String(item?.jawaban || "").trim(),
        }))
        .filter((item) => item.pertanyaan || item.jawaban)
    : defaultPengaturan.bantuan_faq;

  hasil.wa_enabled = Boolean(hasil.wa_enabled);
  hasil.wa_connection_mode =
    hasil.wa_connection_mode === "web_qr" ? "web_qr" : "provider_api";
  hasil.wa_provider_url = String(hasil.wa_provider_url || "").trim();
  hasil.wa_api_key = String(hasil.wa_api_key || "").trim();
  hasil.wa_sender = String(hasil.wa_sender || "").trim();
  hasil.wa_test_phone = String(hasil.wa_test_phone || "").trim();
  hasil.wa_notif_booking_success =
    hasil.wa_notif_booking_success === undefined
      ? defaultPengaturan.wa_notif_booking_success
      : Boolean(hasil.wa_notif_booking_success);
  hasil.wa_reminder_pembayaran_hari_h =
    hasil.wa_reminder_pembayaran_hari_h === undefined
      ? defaultPengaturan.wa_reminder_pembayaran_hari_h
      : Boolean(hasil.wa_reminder_pembayaran_hari_h);
  hasil.wa_reminder_pengembalian_hari_h =
    hasil.wa_reminder_pengembalian_hari_h === undefined
      ? defaultPengaturan.wa_reminder_pengembalian_hari_h
      : Boolean(hasil.wa_reminder_pengembalian_hari_h);

  return hasil;
};

const ambilAtauBuatPengaturan = async () => {
  let pengaturan = await Pengaturan.findOne();

  if (!pengaturan) {
    pengaturan = await Pengaturan.create(normalisasiBodyPengaturan(defaultPengaturan));
  }

  return pengaturan;
};

const ambilPengaturan = asyncHandler(async (req, res) => {
  const pengaturan = await ambilAtauBuatPengaturan();

  res.json({
    sukses: true,
    pesan: "Pengaturan berhasil diambil",
    data: pengaturan,
  });
});

const simpanPengaturan = asyncHandler(async (req, res) => {
  let pengaturan = await Pengaturan.findOne();

  if (!pengaturan) {
    pengaturan = await Pengaturan.create({
      ...defaultPengaturan,
      ...normalisasiBodyPengaturan(req.body),
    });
  } else {
    Object.assign(pengaturan, normalisasiBodyPengaturan(req.body));
    await pengaturan.save();
  }

  res.json({
    sukses: true,
    pesan: "Pengaturan berhasil disimpan",
    data: pengaturan,
  });
});

const tesKoneksiWhatsApp = asyncHandler(async (req, res) => {
  const pengaturan = await ambilAtauBuatPengaturan();
  const nomorTujuan = String(req.body.no_hp || pengaturan.wa_test_phone || "").trim();

  if (!nomorTujuan) {
    res.status(400);
    throw new Error("No HP tujuan test WA wajib diisi");
  }

  const pesan =
    req.body.pesan ||
    `Test koneksi WhatsApp berhasil. Sistem rental aktif pada ${new Date().toLocaleString("id-ID")}.`;

  const hasilKirim = await kirimWhatsApp({
    pengaturan,
    to: nomorTujuan,
    message: pesan,
  });

  res.json({
    sukses: true,
    pesan: "Pesan test WhatsApp berhasil dikirim",
    data: {
      ...hasilKirim,
      no_hp: nomorTujuan,
      mode: pengaturan.wa_connection_mode || "provider_api",
    },
  });
});

const prosesReminderWhatsAppHariIni = asyncHandler(async (req, res) => {
  const pengaturan = await ambilAtauBuatPengaturan();
  const today = hariIni();

  if (!pengaturan.wa_enabled) {
    return res.json({
      sukses: true,
      pesan: "WA nonaktif, tidak ada reminder yang diproses",
      data: { booking: 0, pembayaran: 0, pengembalian: 0 },
    });
  }

  const kandidat = await Rental.find({
    tanggal_rencana_kembali: today,
    status: { $in: ["booking", "siap_keluar", "sedang_disewa", "serah_terima_kembali"] },
  });

  let reminderPembayaran = 0;
  let reminderPengembalian = 0;

  for (const rental of kandidat) {
    const customer = await Customer.findOne({ kode_customer: rental.kode_customer });
    const noHp = customer?.no_hp;

    if (!noHp) continue;

    if (
      pengaturan.wa_reminder_pembayaran_hari_h &&
      Number(rental.sisa_tagihan || 0) > 0 &&
      rental.wa_last_payment_reminder_at !== today
    ) {
      await kirimWhatsApp({
        pengaturan,
        to: noHp,
        message: `Reminder pembayaran ${rental.kode_rental}: hari ini jatuh tempo pengembalian, namun masih ada sisa tagihan sebesar Rp ${Number(rental.sisa_tagihan || 0).toLocaleString("id-ID")}.`,
      });
      rental.wa_last_payment_reminder_at = today;
      reminderPembayaran += 1;
    }

    if (
      pengaturan.wa_reminder_pengembalian_hari_h &&
      rental.status !== "selesai" &&
      rental.wa_last_return_reminder_at !== today
    ) {
      await kirimWhatsApp({
        pengaturan,
        to: noHp,
        message: `Reminder pengembalian ${rental.kode_rental}: hari ini adalah jadwal pengembalian barang. Mohon segera proses pengembalian.`,
      });
      rental.wa_last_return_reminder_at = today;
      reminderPengembalian += 1;
    }

    await rental.save();
  }

  res.json({
    sukses: true,
    pesan: "Proses reminder WhatsApp hari ini selesai",
    data: {
      booking: 0,
      pembayaran: reminderPembayaran,
      pengembalian: reminderPengembalian,
    },
  });
});

const mulaiSesiWhatsAppWeb = asyncHandler(async (req, res) => {
  const pengaturan = await ambilAtauBuatPengaturan();

  // Jangan blokir proses scan QR hanya karena user belum klik simpan di UI.
  if (!pengaturan.wa_enabled || pengaturan.wa_connection_mode !== "web_qr") {
    pengaturan.wa_enabled = true;
    pengaturan.wa_connection_mode = "web_qr";
    await pengaturan.save();
  }

  const data = await startWhatsAppWeb();

  res.json({
    sukses: true,
    pesan: "Sesi WhatsApp Web diproses",
    data,
  });
});

const statusSesiWhatsAppWeb = asyncHandler(async (req, res) => {
  const data = await getWhatsAppWebStatus();

  res.json({
    sukses: true,
    pesan: "Status WhatsApp Web berhasil diambil",
    data,
  });
});

const putusSesiWhatsAppWeb = asyncHandler(async (req, res) => {
  const data = await disconnectWhatsAppWeb();

  res.json({
    sukses: true,
    pesan: "Sesi WhatsApp Web berhasil diputus",
    data,
  });
});

module.exports = {
  ambilPengaturan,
  simpanPengaturan,
  tesKoneksiWhatsApp,
  prosesReminderWhatsAppHariIni,
  mulaiSesiWhatsAppWeb,
  statusSesiWhatsAppWeb,
  putusSesiWhatsAppWeb,
};
