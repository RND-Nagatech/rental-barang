const Rental = require("../models/rentalModel");
const RentalDetail = require("../models/rentalDetailModel");
const Barang = require("../models/barangModel");
const Customer = require("../models/customerModel");
const Pembayaran = require("../models/pembayaranModel");
const asyncHandler = require("../utils/asyncHandler");
const buatKodeRental = require("../utils/kodeRental");
const buatKodePembayaran = require("../utils/kodePembayaran");
const { recalculateStokBarang } = require("../utils/recalculateStokBarang");
const {
  normalisasiStatus,
  validasiStatus,
  validasiPerubahanStatus,
} = require("../utils/rentalStatus");

const ambilDetailPayload = (body) => body.detail || body.details || body.items || [];

const toDateOnly = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const hariIni = () => {
  const tanggal = new Date();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
  const hari = String(tanggal.getDate()).padStart(2, "0");
  return `${tanggal.getFullYear()}-${bulan}-${hari}`;
};

const normalisasiMetodeBayar = (metode) =>
  String(metode || "")
    .trim()
    .toLowerCase();

const tentukanStatusDeposit = (depositDiterima, totalPotongan) => {
  const nominalDiterima = Number(depositDiterima || 0);
  const potongan = Number(totalPotongan || 0);

  if (nominalDiterima <= 0) return "belum_diterima";
  if (nominalDiterima - potongan > 0) return "dikembalikan";
  return "dipotong";
};

const rentangOverlap = (mulaiA, selesaiA, mulaiB, selesaiB) =>
  toDateOnly(mulaiA) <= toDateOnly(selesaiB) && toDateOnly(selesaiA) >= toDateOnly(mulaiB);

const hitungJumlahHari = (tanggalMulai, tanggalKembali) => {
  const [tahunMulai, bulanMulai, hariMulai] = toDateOnly(tanggalMulai).split("-").map(Number);
  const [tahunKembali, bulanKembali, hariKembali] = toDateOnly(tanggalKembali).split("-").map(Number);
  const mulai = new Date(tahunMulai, bulanMulai - 1, hariMulai);
  const kembali = new Date(tahunKembali, bulanKembali - 1, hariKembali);
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

const hitungQtyTerkunciKalender = async (kodeBarang, tanggalKeluar, tanggalRencanaKembali, kodeRentalAbaikan) => {
  const rentals = await Rental.find({
    status: { $in: ["booking", "siap_keluar", "sedang_disewa"] },
    ...(kodeRentalAbaikan ? { kode_rental: { $ne: kodeRentalAbaikan } } : {}),
  }).select("kode_rental tanggal_mulai tanggal_keluar tanggal_rencana_kembali");
  const rentalsOverlap = rentals.filter((rental) => {
    const mulai = rental.tanggal_keluar || rental.tanggal_mulai;
    return rentangOverlap(mulai, rental.tanggal_rencana_kembali, tanggalKeluar, tanggalRencanaKembali);
  });
  const kodeRental = rentalsOverlap.map((rental) => rental.kode_rental);

  if (kodeRental.length === 0) return 0;

  const details = await RentalDetail.find({
    kode_rental: { $in: kodeRental },
    kode_barang: kodeBarang,
  });

  return details.reduce((sum, detail) => sum + Number(detail.qty || 0), 0);
};

const siapkanDetail = async (detailPayload, tanggalMulai, tanggalKembali, opsi = {}) => {
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

    const qtyTerkunci = await hitungQtyTerkunciKalender(
      barang.kode_barang,
      tanggalMulai,
      tanggalKembali,
      opsi.kodeRentalAbaikan
    );
    const stokTersediaUntukValidasi = Math.max(
      0,
      Number(barang.stok_total || 0) -
        Number(barang.stok_maintenance || 0) -
        Number(barang.stok_hilang || 0) -
        qtyTerkunci
    );

    if (qty > stokTersediaUntukValidasi) {
      const error = new Error(
        `Qty ${barang.nama_barang} melebihi stok tersedia (${stokTersediaUntukValidasi})`
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
  const depositRequired = Number(body.deposit_required ?? body.deposit ?? 0);
  const totalDenda = Number(body.total_denda || 0);
  const totalBayar = Number(body.total_bayar || body.terbayar || 0);
  const totalSewa = Math.max(0, subtotal - diskon);

  return {
    subtotal,
    diskon,
    deposit: depositRequired,
    deposit_required: depositRequired,
    total_sewa: totalSewa,
    total_denda: totalDenda,
    total_bayar: totalBayar,
    sisa_tagihan: Math.max(0, totalSewa + totalDenda - totalBayar),
  };
};

const ambilKodeBarangRental = async (kodeRental) => {
  const detail = await RentalDetail.find({ kode_rental: kodeRental }).select("kode_barang");
  return detail.map((item) => item.kode_barang);
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
  const status = normalisasiStatus(req.body.status || "booking");

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
    tanggal_keluar: req.body.tanggal_keluar || tanggalMulai,
    tanggal_kembali: req.body.tanggal_kembali || null,
    status,
    ...total,
    deposit_received: 0,
    deposit_received_date: null,
    deposit_received_method: null,
    deposit_received_note: null,
    deposit_status: "belum_diterima",
    catatan: req.body.catatan || null,
  });

  await RentalDetail.insertMany(
    detail.map((item) => ({
      kode_rental: rental.kode_rental,
      ...item,
    }))
  );

  if (Number(req.body.nominal_bayar || req.body.total_bayar || 0) > 0) {
    const jumlahBayar = Number(req.body.nominal_bayar || req.body.total_bayar || 0);

    await Pembayaran.create({
      kode_pembayaran: await buatKodePembayaran(req.body.tanggal_bayar || hariIni()),
      kode_rental: rental.kode_rental,
      tanggal_bayar: req.body.tanggal_bayar || hariIni(),
      tipe_bayar: req.body.jenis_pembayaran
        ? String(req.body.jenis_pembayaran).toLowerCase().replace(/\s+/g, "_")
        : jumlahBayar >= rental.total_sewa
          ? "pelunasan"
          : "dp",
      metode_bayar: String(req.body.metode_pembayaran || "tunai").toLowerCase(),
      jumlah_bayar: jumlahBayar,
      bukti_bayar: req.body.bukti_pembayaran || null,
      catatan: req.body.catatan_pembayaran || null,
    });

    rental.total_bayar = jumlahBayar;
    rental.sisa_tagihan = Math.max(
      0,
      Number(rental.total_sewa || 0) + Number(rental.total_denda || 0) - jumlahBayar
    );
    await rental.save();
  }

  await recalculateStokBarang(detail.map((item) => item.kode_barang));

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
  const detailSebelumnya = await RentalDetail.find({ kode_rental: rental.kode_rental });
  const detailPayloadDenganQtySebelumnya = detailPayload.map((item) => ({
    ...item,
  }));
  const detail = detailPayload.length
    ? await siapkanDetail(detailPayloadDenganQtySebelumnya, tanggalMulai, tanggalKembali, {
        kodeRentalAbaikan: rental.kode_rental,
      })
    : detailSebelumnya;
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
  rental.deposit_required = total.deposit_required;
  rental.subtotal = total.subtotal;
  rental.total_sewa = total.total_sewa;
  rental.total_denda = total.total_denda;
  rental.total_bayar = total.total_bayar;
  rental.sisa_tagihan = total.sisa_tagihan;
  rental.catatan = req.body.catatan ?? rental.catatan;
  rental.status = statusTujuan;

  const adaUpdateDepositDiterima =
    req.body.deposit_received !== undefined || req.body.depositDiterima !== undefined;

  if (adaUpdateDepositDiterima) {
    const depositDiterima = Number(req.body.deposit_received ?? req.body.depositDiterima ?? 0);

    if (depositDiterima < 0) {
      res.status(400);
      throw new Error("Deposit diterima tidak boleh kurang dari 0");
    }

    rental.deposit_received = depositDiterima;
    rental.deposit_received_date =
      req.body.deposit_received_date || req.body.tanggal_deposit || rental.deposit_received_date || hariIni();
    rental.deposit_received_method = req.body.deposit_received_method
      ? normalisasiMetodeBayar(req.body.deposit_received_method)
      : rental.deposit_received_method;
    rental.deposit_received_note =
      req.body.deposit_received_note ?? req.body.catatan_deposit ?? rental.deposit_received_note;
    rental.deposit_status = depositDiterima > 0 ? "diterima" : "belum_diterima";
  }

  if (statusTujuan === "sedang_disewa") {
    rental.tanggal_keluar = req.body.tanggal_keluar || rental.tanggal_keluar || hariIni();

    if (Number(rental.deposit_received || 0) > 0) {
      rental.deposit_status = "diterima";
      rental.deposit_received_date = rental.deposit_received_date || hariIni();
    }
  }

  if (statusTujuan === "serah_terima_kembali" || statusTujuan === "selesai") {
    rental.tanggal_kembali = req.body.tanggal_kembali || rental.tanggal_kembali || hariIni();

    rental.deposit_status = tentukanStatusDeposit(
      rental.deposit_received,
      rental.total_denda
    );
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

  const kodeBarangBerubah = [
    ...detailSebelumnya.map((item) => item.kode_barang),
    ...detail.map((item) => item.kode_barang),
  ];
  await recalculateStokBarang(kodeBarangBerubah);

  await kirimRental(res, rental, 200, "Rental berhasil diubah");
});

const hapusRental = asyncHandler(async (req, res) => {
  const rental = await Rental.findByIdAndDelete(req.params.id);

  if (!rental) {
    res.status(404);
    throw new Error("Rental tidak ditemukan");
  }

  const kodeBarangRental = await ambilKodeBarangRental(rental.kode_rental);
  await RentalDetail.deleteMany({ kode_rental: rental.kode_rental });
  await recalculateStokBarang(kodeBarangRental);

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
    rental.tanggal_keluar = req.body.tanggal_keluar || hariIni();
  }

  if (statusTujuan === "serah_terima_kembali" || statusTujuan === "selesai") {
    rental.tanggal_kembali = req.body.tanggal_kembali || hariIni();
    rental.deposit_status = tentukanStatusDeposit(
      rental.deposit_received,
      rental.total_denda
    );
  }

  await rental.save();
  await recalculateStokBarang(await ambilKodeBarangRental(rental.kode_rental));
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
