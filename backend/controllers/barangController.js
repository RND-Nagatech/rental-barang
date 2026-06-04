const Barang = require("../models/barangModel");
const buatCrudController = require("./crudController");

module.exports = buatCrudController(Barang, {
  fieldCari: ["kode_barang", "nama_barang", "merk", "tipe", "nomor_seri"],
  populate: ["id_kategori"],
});
