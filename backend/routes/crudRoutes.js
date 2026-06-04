const express = require("express");

const buatCrudRoutes = (controller) => {
  const router = express.Router();

  router.route("/").get(controller.daftar).post(controller.tambah);
  router
    .route("/:id")
    .get(controller.detail)
    .put(controller.ubah)
    .delete(controller.hapus);

  return router;
};

module.exports = buatCrudRoutes;
