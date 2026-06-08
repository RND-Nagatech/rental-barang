const express = require("express");
const { adminLogin, adminMe } = require("../controllers/authController");
const { requireAdminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/admin/login", adminLogin);
router.get("/admin/me", requireAdminAuth, adminMe);

module.exports = router;
