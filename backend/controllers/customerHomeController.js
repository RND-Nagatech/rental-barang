const Barang = require("../models/barangModel");
const Customer = require("../models/customerModel");
const Kategori = require("../models/kategoriModel");
const Pengaturan = require("../models/pengaturanModel");
const Rental = require("../models/rentalModel");
const RentalDetail = require("../models/rentalDetailModel");
const asyncHandler = require("../utils/asyncHandler");

const absoluteUrl = (req, url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}${String(url).startsWith("/") ? url : `/${url}`}`;
};

const statusHomeBarang = (barang) => {
  const stokTotal = Number(barang.stok_total || 0);
  const stokAktif =
    stokTotal - Number(barang.stok_maintenance || 0) - Number(barang.stok_hilang || 0);

  if (!barang.status_aktif || stokAktif <= 0) return "Tidak Tersedia";
  if (stokAktif < stokTotal) return "Stok Terbatas";
  return "Tersedia";
};

const statusKatalogBarang = (barang) => {
  const stokTotal = Number(barang.stok_total || 0);
  const stokReady =
    stokTotal - Number(barang.stok_maintenance || 0) - Number(barang.stok_hilang || 0);

  if (!barang.status_aktif || stokReady <= 0) return "Tidak Tersedia";
  if (stokReady < stokTotal) return "Sebagian Disewa";
  return "Tersedia";
};

const itemBarangHome = (req, barang) => {
  const kategori = barang.id_kategori || {};

  return {
    kode_barang: barang.kode_barang,
    nama_barang: barang.nama_barang,
    nama_kategori: kategori.nama_kategori || barang.nama_kategori || "",
    thumbnail_url: absoluteUrl(req, barang.thumbnail || barang.foto_barang || barang.foto),
    harga_sewa_per_hari: Number(barang.harga_sewa_per_hari || 0),
    satuan: barang.satuan || "unit",
    status_display: statusHomeBarang(barang),
    rating: Number(barang.rating || 0),
    jumlah_disewa: Number(barang.jumlah_disewa || 0),
  };
};

const itemBarangKatalog = (req, barang) => {
  const kategori = barang.id_kategori || {};

  return {
    kode_barang: barang.kode_barang,
    nama_barang: barang.nama_barang,
    kode_kategori: kategori.kode_kategori || barang.kode_kategori || "",
    nama_kategori: kategori.nama_kategori || barang.nama_kategori || "",
    thumbnail_url: absoluteUrl(req, barang.thumbnail || barang.foto_barang || barang.foto),
    harga_sewa_per_hari: Number(barang.harga_sewa_per_hari || 0),
    satuan: barang.satuan || "unit",
    rating: Number(barang.rating || 0),
    jumlah_disewa: Number(barang.jumlah_disewa || 0),
    status_display: statusKatalogBarang(barang),
  };
};

const statusRentalDisplay = (status) => {
  const map = {
    booking: "Dikonfirmasi",
    siap_keluar: "Disiapkan",
    sedang_disewa: "Aktif",
    serah_terima_kembali: "Proses Kembali",
    selesai: "Selesai",
    batal: "Batal",
  };

  return map[status] || "Dikonfirmasi";
};

const statusRentalLabel = (status) => {
  const map = {
    booking: "Booking",
    siap_keluar: "Siap Keluar",
    sedang_disewa: "Sedang Disewa",
    serah_terima_kembali: "Serah Terima Kembali",
    selesai: "Selesai",
    batal: "Batal",
  };

  return map[status] || "Booking";
};

const statusPembayaranOrder = (rental) => {
  const totalTagihan = Number(rental.total_sewa || 0) + Number(rental.total_denda || 0);
  const totalBayar = Number(rental.total_bayar || 0);

  if (totalBayar <= 0) return "Belum Bayar";
  if (totalBayar < totalTagihan) return "DP";
  return "Lunas";
};

const dateOnly = (value) => {
  if (!value) return "";
  return String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0] || "";
};

const ambilIdentitasCustomer = (req) => ({
  kodeCustomer: String(
    req.query.kode_customer || req.body?.kode_customer || req.headers["x-customer-code"] || ""
  ).trim().toUpperCase(),
  noHp: String(req.query.no_hp || req.body?.no_hp || req.headers["x-customer-phone"] || "").trim(),
});

const cariCustomerLogin = async (req) => {
  if (req.customer) return req.customer;

  const { kodeCustomer, noHp } = ambilIdentitasCustomer(req);
  const filter = [];

  if (kodeCustomer) filter.push({ kode_customer: kodeCustomer });
  if (noHp) filter.push({ no_hp: noHp });

  if (!filter.length) return null;
  return Customer.findOne({ $or: filter });
};

const filterRentalCustomer = (customer) => ({
  kode_customer: customer.kode_customer,
});

const ringkasanCustomer = async (customer) => {
  const filter = filterRentalCustomer(customer);
  const [totalPesanan, pesananAktif, pesananSelesai] = await Promise.all([
    Rental.countDocuments(filter),
    Rental.countDocuments({
      ...filter,
      status: { $in: ["booking", "siap_keluar", "sedang_disewa"] },
    }),
    Rental.countDocuments({
      ...filter,
      status: "selesai",
    }),
  ]);

  return {
    total_pesanan: totalPesanan,
    pesanan_aktif: pesananAktif,
    pesanan_selesai: pesananSelesai,
  };
};

const ambilCustomerHome = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit || 10), 50));

  const [pengaturan, categories, popularItems, readyItems] = await Promise.all([
    Pengaturan.findOne(),
    Kategori.find({
      status_aktif: true,
      tampil_di_apk: true,
    }).sort({ urutan_tampil: 1, nama_kategori: 1 }).limit(limit),
    Barang.find({
      status_aktif: true,
      tampil_di_apk: true,
      is_popular: true,
    }).populate("id_kategori").sort({ jumlah_disewa: -1, rating: -1, nama_barang: 1 }).limit(limit),
    Barang.find({
      status_aktif: true,
      tampil_di_apk: true,
      is_ready: true,
    }).populate("id_kategori").sort({ jumlah_disewa: -1, rating: -1, nama_barang: 1 }).limit(limit),
  ]);

  res.json({
    success: true,
    data: {
      app_name: pengaturan?.app_name || "Rentory",
      headline:
        pengaturan?.home_headline ||
        "Sewa apa saja, kapan saja. Mudah & terpercaya.",
      home_subheadline: pengaturan?.home_subheadline || "",
      categories: categories.map((kategori) => ({
        kode_kategori: kategori.kode_kategori,
        nama_kategori: kategori.nama_kategori,
        icon_url: absoluteUrl(req, kategori.icon_kategori || kategori.gambar_kategori),
      })),
      popular_items: popularItems.map((barang) => itemBarangHome(req, barang)),
      ready_items: readyItems.map((barang) => itemBarangHome(req, barang)),
    },
  });
});

const daftarCustomerKategori = asyncHandler(async (req, res) => {
  const categories = await Kategori.find({
    status_aktif: true,
    tampil_di_apk: true,
  }).sort({ urutan_tampil: 1, nama_kategori: 1 });

  res.json({
    success: true,
    data: {
      total: categories.length,
      items: categories.map((kategori) => ({
        kode_kategori: kategori.kode_kategori,
        nama_kategori: kategori.nama_kategori,
        icon_url: absoluteUrl(req, kategori.icon_kategori || kategori.gambar_kategori),
      })),
    },
  });
});

const daftarCustomerBarang = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const kodeKategori = String(req.query.kode_kategori || "").trim().toUpperCase();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));

  const kategoriFilter = kodeKategori
    ? await Kategori.findOne({ kode_kategori: kodeKategori }).select("_id")
    : null;

  if (kodeKategori && !kategoriFilter) {
    return res.json({
      success: true,
      data: {
        total: 0,
        items: [],
      },
    });
  }

  const filter = {
    status_aktif: true,
    tampil_di_apk: true,
    ...(kategoriFilter ? { id_kategori: kategoriFilter._id } : {}),
  };

  if (q) {
    const kategoriMatch = await Kategori.find({
      status_aktif: true,
      tampil_di_apk: true,
      nama_kategori: { $regex: q, $options: "i" },
    }).select("_id");

    filter.$or = [
      { nama_barang: { $regex: q, $options: "i" } },
      { id_kategori: { $in: kategoriMatch.map((kategori) => kategori._id) } },
    ];
  }

  const [total, items] = await Promise.all([
    Barang.countDocuments(filter),
    Barang.find(filter)
      .populate("id_kategori")
      .sort({ is_popular: -1, jumlah_disewa: -1, rating: -1, nama_barang: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    success: true,
    data: {
      total,
      items: items.map((barang) => itemBarangKatalog(req, barang)),
    },
  });
});

const daftarCustomerOrders = asyncHandler(async (req, res) => {
  const status = String(req.query.status || "all").toLowerCase();
  const customer = await cariCustomerLogin(req);

  if (!customer) {
    res.status(404);
    throw new Error("Customer login tidak ditemukan");
  }

  const filter = filterRentalCustomer(customer);

  if (status === "active") {
    filter.status = { $in: ["booking", "siap_keluar", "sedang_disewa", "serah_terima_kembali"] };
  } else if (status === "selesai") {
    filter.status = { $in: ["selesai", "batal"] };
  }

  const rentals = await Rental.find(filter).sort({ created_at: -1 });
  const kodeRental = rentals.map((rental) => rental.kode_rental);
  const details = await RentalDetail.find({ kode_rental: { $in: kodeRental } }).sort({
    created_at: 1,
  });
  const kodeBarang = [...new Set(details.map((detail) => detail.kode_barang))];
  const barangList = await Barang.find({ kode_barang: { $in: kodeBarang } }).select(
    "kode_barang foto thumbnail foto_barang"
  );

  const detailMap = details.reduce((map, detail) => {
    if (!map[detail.kode_rental]) map[detail.kode_rental] = [];
    map[detail.kode_rental].push(detail);
    return map;
  }, {});
  const barangMap = barangList.reduce((map, barang) => {
    map[barang.kode_barang] = barang;
    return map;
  }, {});

  const items = rentals.map((rental) => {
    const detail = detailMap[rental.kode_rental] || [];
    const totalTagihan = Number(rental.total_sewa || 0) + Number(rental.total_denda || 0);
    const totalBayar = Number(rental.total_bayar || 0);

    return {
      id: String(rental._id),
      kode_rental: rental.kode_rental,
      tanggal_order: dateOnly(rental.created_at) || rental.tanggal_mulai,
      periode_mulai: rental.tanggal_mulai,
      periode_selesai: rental.tanggal_rencana_kembali,
      status_rental: statusRentalLabel(rental.status),
      status_display: statusRentalDisplay(rental.status),
      status_pembayaran: statusPembayaranOrder(rental),
      total_tagihan: totalTagihan,
      total_bayar: totalBayar,
      sisa_tagihan: Math.max(0, totalTagihan - totalBayar),
      jumlah_jenis_barang: detail.length,
      thumbnail_items: detail.slice(0, 2).map((line) => {
        const barang = barangMap[line.kode_barang];
        return absoluteUrl(req, barang?.thumbnail || barang?.foto_barang || barang?.foto);
      }).filter(Boolean),
    };
  });

  res.json({
    success: true,
    data: {
      total: items.length,
      items,
    },
  });
});

const ambilCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await cariCustomerLogin(req);

  if (!customer) {
    res.status(404);
    throw new Error("Customer login tidak ditemukan");
  }

  res.json({
    success: true,
    data: {
      customer: {
        kode_customer: customer.kode_customer,
        nama_customer: customer.nama_customer,
        no_hp: customer.no_hp,
        email: customer.email || "",
        alamat_default: customer.alamat || "",
        foto_profile: absoluteUrl(req, customer.foto_profile),
      },
      summary: await ringkasanCustomer(customer),
    },
  });
});

const ubahCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await cariCustomerLogin(req);

  if (!customer) {
    res.status(404);
    throw new Error("Customer login tidak ditemukan");
  }

  if (req.body.nama_customer !== undefined) customer.nama_customer = req.body.nama_customer;
  if (req.body.no_hp !== undefined) customer.no_hp = req.body.no_hp;
  if (req.body.email !== undefined) customer.email = req.body.email || null;
  if (req.body.alamat_default !== undefined) customer.alamat = req.body.alamat_default || null;
  if (req.body.foto_profile !== undefined) customer.foto_profile = req.body.foto_profile || "";

  await customer.save();

  res.json({
    success: true,
    data: {
      customer: {
        kode_customer: customer.kode_customer,
        nama_customer: customer.nama_customer,
        no_hp: customer.no_hp,
        email: customer.email || "",
        alamat_default: customer.alamat || "",
        foto_profile: absoluteUrl(req, customer.foto_profile),
      },
      summary: await ringkasanCustomer(customer),
    },
  });
});

const daftarCustomerAddresses = asyncHandler(async (req, res) => {
  const customer = await cariCustomerLogin(req);

  if (!customer) {
    res.status(404);
    throw new Error("Customer login tidak ditemukan");
  }

  res.json({
    success: true,
    data: {
      total: customer.alamat ? 1 : 0,
      items: customer.alamat
        ? [
            {
              id: "default",
              label: "Alamat Utama",
              alamat: customer.alamat,
              is_default: true,
            },
          ]
        : [],
    },
  });
});

const ambilCustomerHelp = asyncHandler(async (req, res) => {
  const pengaturan = await Pengaturan.findOne();

  res.json({
    success: true,
    data: {
      title: "Bantuan",
      whatsapp: pengaturan?.telepon || "",
      faq: [
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
  });
});

const ambilCustomerAbout = asyncHandler(async (req, res) => {
  const pengaturan = await Pengaturan.findOne();

  res.json({
    success: true,
    data: {
      app_name: pengaturan?.app_name || "Rentory",
      nama_usaha: pengaturan?.nama_usaha || "Rentory Rental",
      versi: "1.0.0",
      alamat: pengaturan?.alamat || "",
      telepon: pengaturan?.telepon || "",
    },
  });
});

module.exports = {
  ambilCustomerHome,
  daftarCustomerKategori,
  daftarCustomerBarang,
  daftarCustomerOrders,
  ambilCustomerProfile,
  ubahCustomerProfile,
  daftarCustomerAddresses,
  ambilCustomerHelp,
  ambilCustomerAbout,
};
