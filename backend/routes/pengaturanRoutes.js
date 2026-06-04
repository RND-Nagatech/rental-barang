const express = require("express");
const {
  ambilPengaturan,
  simpanPengaturan,
} = require("../controllers/pengaturanController");

const router = express.Router();

router.route("/").get(ambilPengaturan).put(simpanPengaturan);

module.exports = router;
