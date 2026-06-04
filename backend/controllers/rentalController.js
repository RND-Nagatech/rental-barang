const Rental = require("../models/rentalModel");
const RentalDetail = require("../models/rentalDetailModel");
const Barang = require("../models/barangModel");
const Customer = require("../models/customerModel");
const asyncHandler = require("../utils/asyncHandler");
const buatKodeRental = require("../utils/kodeRental");
const {
  normalisasiStatus,
  validasiStatus,
  validasiPerubahanStatus,
} = require("../utils/rentalStatus");

const ambilDetailPayload = (body) => body.detail || body.details || body.items || [];

const hitungJumlahHari = (tanggalMulai, tanggalKembali) => {
  const mulai = new Date(tanggalMulai);
  const kembali = new Date(tanggalKembali);
  const selisih = kembali.getTime() - mulai.getTime();
  const hari = Math.ceil(selisih / (1000 * 60 * 60 * 24));
  return Math.max(1, hari || 1);
};

const cariCustomer = async (body) => {
  if (body.kode_customer) {
    return Customer.findOne({ kode_customer: String(body.kode_customer).toUpperCase() });
  }

  if (body.customerId) {
    return Customer.findById(body.customerId);
  }

  return null;
};

const cariBarang = async (line) => {
  if (line.kode_barang) {
    return Barang.findOne({ kode_barang: String(line.kode_barang).toUpperCase() });
  }

  if (line.itemId || line.id_barang) {
    return Barang.findById(line.itemId || line.id_barang);
  }

  return null;
};

const siapkanDetail = async (detailPayload, tanggalMulai, tanggalKembali) => {
  if (!Array.isArray(detailPayload) || detailPayload.length === 0) {
    const error = new Error("Detail barang wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const detail = [];
  const jumlahHariDefault = hitungJumlahHari(tanggalMulai, tanggalKembali);

  for (const line of detailPayload) {
    const barang = await cariBarang(line);

    if (!barang) {
      const error = new Error("Barang pada detail tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const qty = Number(line.qty || line.jumlah || 0);

    if (!qty || qty < 1) {
      const error = new Error("Qty rental minimal 1");
      error.statusCode = 400;
      throw error;
    }

    if (qty > barang.stok_tersedia) {
      const error = new Error(
        `Qty ${barang.nama_barang} melebihi stok tersedia (${barang.stok_tersedia})`
      );
      error.statusCode = 400;
      throw error;
    }

    const jumlahHari = Number(line.jumlah_hari || jumlahHariDefault);
    const hargaSewa = Number(barang.harga_sewa_per_hari || 0);
    const subtotal = qty * hargaSewa * jumlahHari;
    const qtyDisiapkan = Number(line.qty_disiapkan || 0);
    const qtyKeluar = Number(line.qty_keluar || 0);
    const qtyKembali = Number(line.qty_kembali || 0);

    if (qtyDisiapkan > qty) {
      const error = new Error(`Qty disiapkan ${barang.nama_barang} melebihi qty rental`);
      error.statusCode = 400;
      throw error;
    }

    if (qtyKeluar > qty) {
      const error = new Error(`Qty keluar ${barang.nama_barang} melebihi qty rental`);
      error.statusCode = 400;
      throw error;
    }

    if (qtyKembali > (qtyKeluar || qty)) {
      const error = new Error(`Qty kembali ${barang.nama_barang} melebihi qty keluar`);
      error.statusCode = 400;
      throw error;
    }

    detail.push({
      kode_barang: barang.kode_barang,
      nama_barang: barang.nama_barang,
      qty,
      harga_sewa_per_hari: hargaSewa,
      jumlah_hari: jumlahHari,
      subtotal,
      denda_per_hari: Number(barang.denda_per_hari || 0),
      qty_disiapkan: qtyDisiapkan,
      qty_keluar: qtyKeluar,
      qty_kembali: qtyKembali,
      kondisi_awal: line.kondisi_awal || "Baik",
      kondisi_kembali: line.kondisi_kembali || "Baik",
      foto_kondisi_awal: Array.isArray(line.foto_kondisi_awal)
        ? line.foto_kondisi_awal
        : [],
      foto_kondisi_kembali: Array.isArray(line.foto_kondisi_kembali)
        ? line.foto_kondisi_kembali
        : [],
      checklist: Boolean(line.checklist),
      catatan: line.catatan || null,
    });
  }

  return detail;
};

const hitungTotal = (detail, body = {}) => {
  const subtotal = detail.reduce((sum, line) => sum + Number(line.subtotal || 0), 0);
  const diskon = Number(body.diskon || 0);
  const deposit = Number(body.deposit || 0);
  const totalDenda = Number(body.total_denda || 0);
  const totalBayar = Number(body.total_bayar || body.terbayar || 0);
  const totalSewa = Math.max(0, subtotal - diskon);

  return {
    subtotal,
    diskon,
    deposit,
    total_sewa: totalSewa,
    total_denda: totalDenda,
    total_bayar: totalBayar,
    sisa_tagihan: Math.max(0, totalSewa + totalDenda - totalBayar),
  };
};

const sinkronStokStatus = async (kodeRental, statusTujuan) => {
  const detail = await RentalDetail.find({ kode_rental: kodeRental });

  if (statusTujuan === "sedang_disewa") {
    for (const line of detail) {
      await Barang.updateOne(
        { kode_barang: line.kode_barang },
        { $inc: { stok_tersedia: -Number(line.qty_keluar || line.qty || 0) } }
      );
    }
  }

  if (statusTujuan === "serah_terima_kembali") {
    for (const line of detail) {
      await Barang.updateOne(
        { kode_barang: line.kode_barang },
        { $inc: { stok_tersedia: Number(line.qty_kembali || 0) } }
      );
    }
  }
};

const kirimRental = async (res, rental, statusCode = 200, pesan = "Data berhasil diambil") => {
  const detail = await RentalDetail.find({ kode_rental: rental.kode_rental }).sort({
    created_at: 1,
  });

  res.status(statusCode).json({
    sukses: true,
    pesan,
    data: {
      ...rental.toObject(),
      detail,
    },
  });
};

const daftarRental = asyncHandler(async (req, res) => {
  const { status, cari } = req.query;
  const filter = {};

  if (status && status !== "all") {
    filter.status = normalisasiStatus(status);
  }

  if (cari) {
    filter.$or = [
      { kode_rental: { $regex: cari, $options: "i" } },
      { kode_customer: { $regex: cari, $options: "i" } },
      { nama_customer: { $regex: cari, $options: "i" } },
      { catatan: { $regex: cari, $options: "i" } },
    ];
  }

  const rentals = await Rental.find(filter).sort({ created_at: -1 });
  const kodeRental = rentals.map((item) => item.kode_rental);
  const details = await RentalDetail.find({ kode_rental: { $in: kodeRental } });
  const detailMap = details.reduce((map, item) => {
    const key = item.kode_rental;
    map[key] = map[key] || [];
    map[key].push(item);
    return map;
  }, {});

  res.json({
    sukses: true,
    pesan: "Data rental berhasil diambil",
    jumlah: rentals.length,
    data: rentals.map((item) => ({
      ...item.toObject(),
      detail: detailMap[item.kode_rental] || [],
    })),
  });
});

const detailRental = asyncHandler(async (req, res) => {
  const rental = await Rental.findById(req.params.id);

  if (!rental) {
    res.status(404);
    throw new Error("Rental tidak ditemukan");
  }

  await kirimRental(res, rental);
});

const tambahRental = asyncHandler(async (req, res) => {
  const customer = await cariCustomer(req.body);

  if (!customer) {
    res.status(404);
    throw new Error("Customer tidak ditemukan");
  }

  const tanggalMulai = req.body.tanggal_mulai;
  const tanggalKembali = req.body.tanggal_rencana_kembali;
  const detail = await siapkanDetail(ambilDetailPayload(req.body), tanggalMulai, tanggalKembali);
  const total = hitungTotal(detail, req.body);
  const kodeRental = req.body.kode_rental || (await buatKodeRental(tanggalMulai));
  const status = normalisasiStatus(req.body.status || "draft");

  if (!validasiStatus(status)) {
    res.status(400);
    throw new Error("Status tidak valid");
  }

  const rental = await Rental.create({
    kode_rental: kodeRental,
    kode_customer: customer.kode_customer,
    nama_customer: customer.nama_customer,
    tanggal_mulai: tanggalMulai,
    tanggal_rencana_kembali: tanggalKembali,
    tanggal_keluar: req.body.tanggal_keluar || null,
    tanggal_kembali: req.body.tanggal_kembali || null,
    status,
    ...total,
    catatan: req.body.catatan || null,
  });

  await RentalDetail.insertMany(
    detail.map((item) => ({
      kode_rental: rental.kode_rental,
      ...item,
    }))
  );

  await kirimRental(res, rental, 201, "Rental berhasil dibuat");
});

const ubahRental = asyncHandler(async (req, res) => {
  const rental = await Rental.findById(req.params.id);

  if (!rental) {
    res.status(404);
    throw new Error("Rental tidak ditemukan");
  }

  const customer = await cariCustomer(req.body);
  const kodeCustomer = customer?.kode_customer || req.body.kode_customer || rental.kode_customer;
  const namaCustomer = customer?.nama_customer || req.body.nama_customer || rental.nama_customer;
  const tanggalMulai = req.body.tanggal_mulai || rental.tanggal_mulai;
  const tanggalKembali = req.body.tanggal_rencana_kembali || rental.tanggal_rencana_kembali;
  const detailPayload = ambilDetailPayload(req.body);
  const detail = detailPayload.length
    ? await siapkanDetail(detailPayload, tanggalMulai, tanggalKembali)
    : await RentalDetail.find({ kode_rental: rental.kode_rental });
  const total = hitungTotal(detail, req.body);
  const statusTujuan = req.body.status ? normalisasiStatus(req.body.status) : rental.status;
  const statusSebelum = rental.status;

  if (statusTujuan !== statusSebelum) {
    const hasilValidasi = validasiPerubahanStatus(statusSebelum, statusTujuan);

    if (!hasilValidasi.valid) {
      res.status(400);
      throw new Error(hasilValidasi.pesan);
    }
  }

  rental.kode_customer = kodeCustomer;
  rental.nama_customer = namaCustomer;
  rental.tanggal_mulai = tanggalMulai;
  rental.tanggal_rencana_kembali = tanggalKembali;
  rental.tanggal_keluar = req.body.tanggal_keluar ?? rental.tanggal_keluar;
  rental.tanggal_kembali = req.body.tanggal_kembali ?? rental.tanggal_kembali;
  rental.diskon = total.diskon;
  rental.deposit = total.deposit;
  rental.subtotal = total.subtotal;
  rental.total_sewa = total.total_sewa;
  rental.total_denda = total.total_denda;
  rental.total_bayar = total.total_bayar;
  rental.sisa_tagihan = total.sisa_tagihan;
  rental.catatan = req.body.catatan ?? rental.catatan;
  rental.status = statusTujuan;

  if (statusTujuan === "sedang_disewa") {
    rental.tanggal_keluar = req.body.tanggal_keluar || rental.tanggal_keluar || new Date();
  }

  if (statusTujuan === "serah_terima_kembali" || statusTujuan === "selesai") {
    rental.tanggal_kembali = req.body.tanggal_kembali || rental.tanggal_kembali || new Date();
  }

  await rental.save();

  if (detailPayload.length) {
    await RentalDetail.deleteMany({ kode_rental: rental.kode_rental });
    await RentalDetail.insertMany(
      detail.map((item) => ({
        kode_rental: rental.kode_rental,
        ...item,
      }))
    );
  }

  if (statusTujuan !== statusSebelum) {
    await sinkronStokStatus(rental.kode_rental, statusTujuan);
  }

  await kirimRental(res, rental, 200, "Rental berhasil diubah");
});

const hapusRental = asyncHandler(async (req, res) => {
  const rental = await Rental.findByIdAndDelete(req.params.id);

  if (!rental) {
    res.status(404);
    throw new Error("Rental tidak ditemukan");
  }

  await RentalDetail.deleteMany({ kode_rental: rental.kode_rental });

  res.json({
    sukses: true,
    pesan: "Rental berhasil dihapus",
    data: rental,
  });
});

const ubahStatusRental = asyncHandler(async (req, res) => {
  const rental = await Rental.findById(req.params.id);

  if (!rental) {
    res.status(404);
    throw new Error("Rental tidak ditemukan");
  }

  const statusTujuan = normalisasiStatus(req.body.status);
  const hasilValidasi = validasiPerubahanStatus(rental.status, statusTujuan);

  if (!hasilValidasi.valid) {
    res.status(400);
    throw new Error(hasilValidasi.pesan);
  }

  rental.status = statusTujuan;

  if (statusTujuan === "sedang_disewa") {
    rental.tanggal_keluar = req.body.tanggal_keluar || new Date();
  }

  if (statusTujuan === "serah_terima_kembali" || statusTujuan === "selesai") {
    rental.tanggal_kembali = req.body.tanggal_kembali || new Date();
  }

  await rental.save();
  await sinkronStokStatus(rental.kode_rental, statusTujuan);
  await kirimRental(res, rental, 200, "Status rental berhasil diubah");
});

module.exports = {
  daftarRental,
  detailRental,
  tambahRental,
  ubahRental,
  hapusRental,
  ubahStatusRental,
};
