const Barang = require("../models/barangModel");
const Rental = require("../models/rentalModel");
const RentalDetail = require("../models/rentalDetailModel");

const STATUS_BARANG_KELUAR = ["sedang_disewa"];
const STATUS_BARANG_DIKEMBALIKAN = ["serah_terima_kembali", "selesai"];

const hitungStatusBarang = (stokTotal, stokGudang) => {
  if (stokGudang <= 0) return "full_disewa";
  if (stokGudang < stokTotal) return "disewa_sebagian";
  return "tersedia";
};

const isRusak = (kondisi) => String(kondisi || "").toLowerCase().includes("rusak");
const isHilang = (kondisi) => String(kondisi || "").toLowerCase().includes("hilang");

const recalculateStokBarang = async (kodeBarangList = []) => {
  const filterBarang = kodeBarangList.length
    ? { kode_barang: { $in: [...new Set(kodeBarangList)] } }
    : {};
  const barangList = await Barang.find(filterBarang);
  const rentals = await Rental.find({
    status: { $in: [...STATUS_BARANG_KELUAR, ...STATUS_BARANG_DIKEMBALIKAN] },
  }).select("kode_rental status");
  const statusRentalMap = rentals.reduce((map, rental) => {
    map[rental.kode_rental] = rental.status;
    return map;
  }, {});
  const kodeRental = rentals.map((rental) => rental.kode_rental);

  for (const barang of barangList) {
    const details = kodeRental.length
      ? await RentalDetail.find({
          kode_rental: { $in: kodeRental },
          kode_barang: barang.kode_barang,
        })
      : [];

    let stokSedangKeluar = 0;
    let stokMaintenance = 0;
    let stokHilang = 0;

    details.forEach((detail) => {
      const statusRental = statusRentalMap[detail.kode_rental];
      const qtyKeluar = Number(detail.qty_keluar || detail.qty || 0);
      const qtyKembali = Number(detail.qty_kembali || 0);

      if (STATUS_BARANG_KELUAR.includes(statusRental)) {
        stokSedangKeluar += qtyKeluar;
        return;
      }

      if (STATUS_BARANG_DIKEMBALIKAN.includes(statusRental)) {
        if (isHilang(detail.kondisi_kembali)) {
          stokHilang += qtyKeluar;
          return;
        }

        stokHilang += Math.max(0, qtyKeluar - qtyKembali);

        if (isRusak(detail.kondisi_kembali)) {
          stokMaintenance += qtyKembali;
        }
      }
    });

    const stokTotal = Number(barang.stok_total || 0);
    const stokGudang = Math.max(
      0,
      stokTotal - stokSedangKeluar - stokMaintenance - stokHilang
    );

    barang.stok_sedang_keluar = stokSedangKeluar;
    barang.stok_maintenance = stokMaintenance;
    barang.stok_hilang = stokHilang;
    barang.stok_di_gudang = stokGudang;
    barang.stok_tersedia = stokGudang;
    barang.status = hitungStatusBarang(stokTotal, stokGudang);
    await barang.save();
  }
};

module.exports = {
  recalculateStokBarang,
  hitungStatusBarang,
};
