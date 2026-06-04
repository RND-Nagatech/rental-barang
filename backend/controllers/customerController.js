const Customer = require("../models/customerModel");
const buatCrudController = require("./crudController");

module.exports = buatCrudController(Customer, {
  fieldCari: ["kode_customer", "nama_customer", "nomor_identitas", "no_hp", "email"],
});
