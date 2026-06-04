const express = require("express");
const {
  daftarPembayaran,
  tambahPembayaran,
} = require("../controllers/pembayaranController");

const router = express.Router();

router.route("/").get(daftarPembayaran).post(tambahPembayaran);

module.exports = router;
