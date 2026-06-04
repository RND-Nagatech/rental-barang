const express = require("express");
const {
  ambilPengaturan,
  simpanPengaturan,
  tesKoneksiWhatsApp,
  prosesReminderWhatsAppHariIni,
  mulaiSesiWhatsAppWeb,
  statusSesiWhatsAppWeb,
  putusSesiWhatsAppWeb,
} = require("../controllers/pengaturanController");

const router = express.Router();

router.route("/").get(ambilPengaturan).put(simpanPengaturan);
router.post("/wa/test", tesKoneksiWhatsApp);
router.post("/wa/process-reminders", prosesReminderWhatsAppHariIni);
router.post("/wa/web/start", mulaiSesiWhatsAppWeb);
router.get("/wa/web/status", statusSesiWhatsAppWeb);
router.post("/wa/web/disconnect", putusSesiWhatsAppWeb);

module.exports = router;
