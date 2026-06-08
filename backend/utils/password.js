const crypto = require("crypto");

const KEY_LENGTH = 64;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (!password || !storedHash || !String(storedHash).includes(":")) return false;

  const [salt, hash] = String(storedHash).split(":");
  const candidate = crypto.scryptSync(String(password), salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");

  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
};

module.exports = {
  hashPassword,
  verifyPassword,
};
