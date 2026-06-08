const User = require("../models/userModel");
const Customer = require("../models/customerModel");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/token");

const bearerToken = (req) => {
  const header = req.headers.authorization || "";
  const [type, token] = String(header).split(" ");
  return /^Bearer$/i.test(type) ? token : "";
};

const requireAdminAuth = asyncHandler(async (req, res, next) => {
  const payload = verifyToken(bearerToken(req));
  if (!payload || payload.tipe !== "admin") {
    res.status(401);
    throw new Error("Login admin dibutuhkan");
  }

  const admin = await User.findById(payload.id);
  if (!admin || !admin.status_aktif) {
    res.status(401);
    throw new Error("Session admin tidak valid");
  }

  req.admin = admin;
  next();
});

const requireCustomerAuth = asyncHandler(async (req, res, next) => {
  const payload = verifyToken(bearerToken(req));
  if (!payload || payload.tipe !== "customer") {
    res.status(401);
    throw new Error("Login customer dibutuhkan");
  }

  const customer = await Customer.findOne({
    _id: payload.id,
    kode_customer: payload.kode_customer,
  });

  if (!customer || !customer.status_aktif) {
    res.status(401);
    throw new Error("Session customer tidak valid");
  }

  req.customer = customer;
  next();
});

module.exports = {
  requireAdminAuth,
  requireCustomerAuth,
};
