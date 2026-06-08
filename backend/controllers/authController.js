const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Customer = require("../models/customerModel");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createToken } = require("../utils/token");

const DEFAULT_ADMIN_EMAIL = "rnd@nagatech.id";
const DEFAULT_ADMIN_PASSWORD = "berasputih";
const SALT_ROUNDS = 10;

const publicCustomer = (customer) => ({
  kode_customer: customer.kode_customer,
  nama_customer: customer.nama_customer,
  no_hp: customer.no_hp,
  email: customer.email || "",
  alamat_default: customer.alamat || "",
  foto_profile: customer.foto_profile || "",
});

const publicUser = (user) => ({
  id: String(user._id),
  kode_user: user.kode_user,
  nama_user: user.nama_user,
  email: user.email,
  role: user.role,
});

const seedDefaultAdmin = async () => {
  const count = await User.countDocuments();
  if (count > 0) return null;

  return User.create({
    kode_user: "USR-00001",
    nama_user: "Nagatech RnD",
    email: DEFAULT_ADMIN_EMAIL,
    password_hash: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS),
    role: "admin",
    status_aktif: true,
  });
};

const adminLogin = asyncHandler(async (req, res) => {
  await seedDefaultAdmin();

  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = await User.findOne({ email }).select("+password_hash");
  if (!user || !user.status_aktif || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401);
    throw new Error("Email atau password admin salah");
  }

  res.json({
    success: true,
    token: createToken({ tipe: "admin", id: String(user._id), email: user.email, role: user.role }),
    user: publicUser(user),
  });
});

const adminMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.admin),
  });
});

const buatKodeCustomer = async () => {
  const prefix = "CUS";
  const terakhir = await Customer.findOne({ kode_customer: { $regex: `^${prefix}-` } }).sort({
    kode_customer: -1,
  });
  const nomor = terakhir ? Number(String(terakhir.kode_customer).split("-").at(-1)) || 0 : 0;
  return `${prefix}-${String(nomor + 1).padStart(5, "0")}`;
};

const registerCustomer = asyncHandler(async (req, res) => {
  const namaCustomer = String(req.body.nama_customer || "").trim();
  const noHp = String(req.body.no_hp || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const alamat = String(req.body.alamat || "").trim();

  if (!namaCustomer || !noHp || !email || !password) {
    res.status(400);
    throw new Error("Nama, no HP, email, dan password wajib diisi");
  }

  const duplicate = await Customer.findOne({
    $or: [{ email }, { no_hp: noHp }],
  });

  if (duplicate) {
    res.status(409);
    throw new Error("Email atau no HP sudah terdaftar");
  }

  const customer = await Customer.create({
    kode_customer: await buatKodeCustomer(),
    nama_customer: namaCustomer,
    no_hp: noHp,
    email,
    password_hash: hashPassword(password),
    alamat: alamat || null,
    status_aktif: true,
  });

  res.status(201).json({
    success: true,
    token: createToken({
      tipe: "customer",
      id: String(customer._id),
      kode_customer: customer.kode_customer,
    }),
    customer: publicCustomer(customer),
  });
});

const loginCustomer = asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || req.body.no_hp || "").trim();
  const password = String(req.body.password || "");

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Email/no HP dan password wajib diisi");
  }

  const customer = await Customer.findOne({
    $or: [{ email: identifier.toLowerCase() }, { no_hp: identifier }],
  }).select("+password_hash");

  if (!customer || !customer.status_aktif || !verifyPassword(password, customer.password_hash)) {
    res.status(401);
    throw new Error("Email/no HP atau password salah");
  }

  res.json({
    success: true,
    token: createToken({
      tipe: "customer",
      id: String(customer._id),
      kode_customer: customer.kode_customer,
    }),
    customer: publicCustomer(customer),
  });
});

module.exports = {
  adminLogin,
  adminMe,
  loginCustomer,
  registerCustomer,
  seedDefaultAdmin,
};
