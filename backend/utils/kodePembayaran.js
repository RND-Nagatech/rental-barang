const Pembayaran = require("../models/pembayaranModel");

const pad = (value) => String(value).padStart(2, "0");

const buatKodePembayaran = async (tanggal = new Date()) => {
  const dateOnly =
    typeof tanggal === "string"
      ? tanggal.slice(0, 10)
      : `${tanggal.getFullYear()}-${pad(tanggal.getMonth() + 1)}-${pad(tanggal.getDate())}`;
  const [yyyy, mm, dd] = dateOnly.split("-");
  const yy = String(yyyy).slice(-2);
  const prefix = `BYR-${yy}${mm}${dd}`;

  const terakhir = await Pembayaran.findOne({
    kode_pembayaran: { $regex: `^${prefix}-` },
  }).sort({ kode_pembayaran: -1 });

  const nomorTerakhir = terakhir
    ? Number(terakhir.kode_pembayaran.split("-").at(-1))
    : 0;
  const nomorBerikutnya = String(nomorTerakhir + 1).padStart(3, "0");

  return `${prefix}-${nomorBerikutnya}`;
};

module.exports = buatKodePembayaran;
