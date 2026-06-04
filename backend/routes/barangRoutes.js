const barangController = require("../controllers/barangController");
const buatCrudRoutes = require("./crudRoutes");

module.exports = buatCrudRoutes(barangController);
