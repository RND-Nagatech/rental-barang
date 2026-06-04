const express = require("express");
const kategoriRoutes = require("./kategoriRoutes");
const barangRoutes = require("./barangRoutes");
const customerRoutes = require("./customerRoutes");
const rentalRoutes = require("./rentalRoutes");
const pembayaranRoutes = require("./pembayaranRoutes");
const pengaturanRoutes = require("./pengaturanRoutes");
const uploadRoutes = require("./uploadRoutes");
const laporanRoutes = require("./laporanRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    sukses: true,
    pesan: "API rental barang siap digunakan",
    endpoints: {
      kategori: "/api/kategori",
      barang: "/api/barang",
      customer: "/api/customer",
      rental: "/api/rental",
      pembayaran: "/api/pembayaran",
      pengaturan: "/api/pengaturan",
      upload: "/api/upload",
      laporan_export: "/api/laporan/export",
    },
  });
});

router.use("/kategori", kategoriRoutes);
router.use("/barang", barangRoutes);
router.use("/customer", customerRoutes);
router.use("/rental", rentalRoutes);
router.use("/pembayaran", pembayaranRoutes);
router.use("/pengaturan", pengaturanRoutes);
router.use("/upload", uploadRoutes);
router.use("/laporan", laporanRoutes);

module.exports = router;
