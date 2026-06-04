const express = require("express");
const { exportLaporan } = require("../controllers/laporanController");

const router = express.Router();

router.get("/export", exportLaporan);

module.exports = router;
