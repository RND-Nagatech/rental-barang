const express = require("express");
const {
  daftarUser,
  tambahUser,
  ubahUser,
  ubahStatusUser,
  resetPasswordUser,
  hapusUser,
} = require("../controllers/adminUserController");
const { requireAdminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAdminAuth);
router.route("/users").get(daftarUser).post(tambahUser);
router.patch("/users/:id/status", ubahStatusUser);
router.patch("/users/:id/reset-password", resetPasswordUser);
router.route("/users/:id").put(ubahUser).delete(hapusUser);

module.exports = router;
