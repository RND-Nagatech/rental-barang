const express = require("express");
const authRoutes = require("./authRoutes");
const adminUserRoutes = require("./adminUserRoutes");
const kategoriRoutes = require("./kategoriRoutes");
const barangRoutes = require("./barangRoutes");
const customerRoutes = require("./customerRoutes");
const rentalRoutes = require("./rentalRoutes");
const pembayaranRoutes = require("./pembayaranRoutes");
const pengaturanRoutes = require("./pengaturanRoutes");
const uploadRoutes = require("./uploadRoutes");
const laporanRoutes = require("./laporanRoutes");
const { loginCustomer, registerCustomer } = require("../controllers/authController");
const {
  ambilCustomerHome,
  ambilCustomerAbout,
  ambilCustomerHelp,
  ambilCustomerProfile,
  daftarCustomerBarang,
  daftarCustomerAddresses,
  daftarCustomerKategori,
  daftarCustomerOrders,
  ubahCustomerProfile,
} = require("../controllers/customerHomeController");
const { requireCustomerAuth } = require("../middleware/authMiddleware");
const { tambahRental } = require("../controllers/rentalController");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    sukses: true,
    pesan: "API rental barang siap digunakan",
    endpoints: {
      kategori: "/api/kategori",
      barang: "/api/barang",
      customer: "/api/customer",
      customer_home: "/api/customer/home",
      customer_kategori: "/api/customer/kategori",
      customer_barang: "/api/customer/barang",
      customer_orders: "/api/customer/orders",
      customer_profile: "/api/customer/profile",
      customer_addresses: "/api/customer/addresses",
      customer_checkout: "/api/customer/checkout",
      customer_help: "/api/customer/help",
      customer_about: "/api/customer/about",
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
router.use("/auth", authRoutes);
router.use("/admin", adminUserRoutes);
router.get("/customer/home", ambilCustomerHome);
router.get("/customer/kategori", daftarCustomerKategori);
router.get("/customer/barang", daftarCustomerBarang);
router.post("/customer/auth/register", registerCustomer);
router.post("/customer/auth/login", loginCustomer);
router.get("/customer/orders", requireCustomerAuth, daftarCustomerOrders);
router
  .route("/customer/profile")
  .get(requireCustomerAuth, ambilCustomerProfile)
  .put(requireCustomerAuth, ubahCustomerProfile);
router.get("/customer/addresses", requireCustomerAuth, daftarCustomerAddresses);
router.get("/customer/cart", requireCustomerAuth, (req, res) => {
  res.json({ success: true, data: { total: 0, items: [] } });
});
router.post("/customer/checkout", requireCustomerAuth, (req, res, next) => {
  req.body.kode_customer = req.customer.kode_customer;
  req.body.status = "booking";
  return tambahRental(req, res, next);
});
router.get("/customer/help", ambilCustomerHelp);
router.get("/customer/about", ambilCustomerAbout);
router.use("/customer", customerRoutes);
router.use("/rental", rentalRoutes);
router.use("/pembayaran", pembayaranRoutes);
router.use("/pengaturan", pengaturanRoutes);
router.use("/upload", uploadRoutes);
router.use("/laporan", laporanRoutes);

module.exports = router;
