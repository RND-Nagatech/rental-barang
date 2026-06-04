const Rental = require("../models/rentalModel");

const pad = (value) => String(value).padStart(2, "0");

const buatKodeRental = async (tanggal = new Date()) => {
  const date = new Date(tanggal);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const prefix = `RT-${yy}${mm}${dd}`;

  const terakhir = await Rental.findOne({
    kode_rental: { $regex: `^${prefix}-` },
  }).sort({ kode_rental: -1 });

  const nomorTerakhir = terakhir
    ? Number(terakhir.kode_rental.split("-").at(-1))
    : 0;
  const nomorBerikutnya = String(nomorTerakhir + 1).padStart(3, "0");

  return `${prefix}-${nomorBerikutnya}`;
};

module.exports = buatKodeRental;
