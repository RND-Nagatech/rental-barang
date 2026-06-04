const express = require("express");
const {
  daftarRental,
  detailRental,
  tambahRental,
  ubahRental,
  hapusRental,
  ubahStatusRental,
} = require("../controllers/rentalController");

const router = express.Router();

router.route("/").get(daftarRental).post(tambahRental);
router.patch("/:id/status", ubahStatusRental);
router.route("/:id").get(detailRental).put(ubahRental).delete(hapusRental);

module.exports = router;
