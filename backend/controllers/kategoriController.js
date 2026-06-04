const Kategori = require("../models/kategoriModel");
const buatCrudController = require("./crudController");

module.exports = buatCrudController(Kategori, {
  fieldCari: ["kode_kategori", "nama_kategori", "deskripsi"],
});
