const customerController = require("../controllers/customerController");
const buatCrudRoutes = require("./crudRoutes");

module.exports = buatCrudRoutes(customerController);
