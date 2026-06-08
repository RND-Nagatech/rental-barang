const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");

const SALT_ROUNDS = 10;

const formatUser = (user) => ({
  id: String(user._id),
  _id: user._id,
  kode_user: user.kode_user,
  nama_user: user.nama_user,
  email: user.email,
  role: user.role,
  status_aktif: Boolean(user.status_aktif),
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const buatKodeUser = async () => {
  const terakhir = await User.findOne({ kode_user: { $regex: "^USR-" } }).sort({ kode_user: -1 });
  const nomor = terakhir ? Number(String(terakhir.kode_user).split("-").at(-1)) || 0 : 0;
  return `USR-${String(nomor + 1).padStart(5, "0")}`;
};

const validateRole = (role) => {
  const value = String(role || "staff").toLowerCase();
  return ["admin", "staff"].includes(value) ? value : "staff";
};

const ensureUniqueEmail = async (email, ignoreId) => {
  const existing = await User.findOne({
    email,
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
  });

  if (existing) {
    const error = new Error("Email user sudah digunakan");
    error.statusCode = 409;
    throw error;
  }
};

const daftarUser = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ created_at: -1 });
  res.json({
    sukses: true,
    success: true,
    pesan: "Data user berhasil diambil",
    jumlah: users.length,
    data: users.map(formatUser),
  });
});

const tambahUser = asyncHandler(async (req, res) => {
  const namaUser = String(req.body.nama_user || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!namaUser || !email || !password) {
    res.status(400);
    throw new Error("Nama, email, dan password wajib diisi");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password minimal 6 karakter");
  }

  await ensureUniqueEmail(email);

  const user = await User.create({
    kode_user: req.body.kode_user || (await buatKodeUser()),
    nama_user: namaUser,
    email,
    password_hash: await bcrypt.hash(password, SALT_ROUNDS),
    role: validateRole(req.body.role),
    status_aktif: req.body.status_aktif ?? true,
  });

  res.status(201).json({
    sukses: true,
    success: true,
    pesan: "User berhasil ditambahkan",
    data: formatUser(user),
  });
});

const ubahUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User tidak ditemukan");
  }

  const email = String(req.body.email ?? user.email).trim().toLowerCase();
  await ensureUniqueEmail(email, user._id);

  user.nama_user = String(req.body.nama_user ?? user.nama_user).trim();
  user.email = email;
  user.role = validateRole(req.body.role ?? user.role);
  if (req.body.status_aktif !== undefined) user.status_aktif = Boolean(req.body.status_aktif);

  await user.save();

  res.json({
    sukses: true,
    success: true,
    pesan: "User berhasil diperbarui",
    data: formatUser(user),
  });
});

const ubahStatusUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User tidak ditemukan");
  }

  user.status_aktif = Boolean(req.body.status_aktif);
  await user.save();

  res.json({
    sukses: true,
    success: true,
    pesan: "Status user berhasil diperbarui",
    data: formatUser(user),
  });
});

const resetPasswordUser = asyncHandler(async (req, res) => {
  const password = String(req.body.password || "");
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password minimal 6 karakter");
  }

  const user = await User.findById(req.params.id).select("+password_hash");
  if (!user) {
    res.status(404);
    throw new Error("User tidak ditemukan");
  }

  user.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  await user.save();

  res.json({
    sukses: true,
    success: true,
    pesan: "Password user berhasil direset",
    data: formatUser(user),
  });
});

const hapusUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User tidak ditemukan");
  }

  res.json({
    sukses: true,
    success: true,
    pesan: "User berhasil dihapus",
    data: formatUser(user),
  });
});

module.exports = {
  daftarUser,
  tambahUser,
  ubahUser,
  ubahStatusUser,
  resetPasswordUser,
  hapusUser,
};
