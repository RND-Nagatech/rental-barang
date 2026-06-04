const asyncHandler = require("../utils/asyncHandler");

const buatCrudController = (Model, pilihan = {}) => {
  const populate = pilihan.populate || [];

  const tambah = asyncHandler(async (req, res) => {
    const data = await Model.create(req.body);

    res.status(201).json({
      sukses: true,
      pesan: "Data berhasil ditambahkan",
      data,
    });
  });

  const daftar = asyncHandler(async (req, res) => {
    const { cari, status_aktif } = req.query;
    const filter = {};

    if (status_aktif !== undefined) {
      filter.status_aktif = status_aktif === "true";
    }

    if (cari && pilihan.fieldCari?.length) {
      filter.$or = pilihan.fieldCari.map((field) => ({
        [field]: { $regex: cari, $options: "i" },
      }));
    }

    let query = Model.find(filter).sort({ created_at: -1 });
    populate.forEach((field) => {
      query = query.populate(field);
    });

    const data = await query;

    res.json({
      sukses: true,
      pesan: "Data berhasil diambil",
      jumlah: data.length,
      data,
    });
  });

  const detail = asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    populate.forEach((field) => {
      query = query.populate(field);
    });

    const data = await query;

    if (!data) {
      res.status(404);
      throw new Error("Data tidak ditemukan");
    }

    res.json({
      sukses: true,
      pesan: "Detail data berhasil diambil",
      data,
    });
  });

  const ubah = asyncHandler(async (req, res) => {
    const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!data) {
      res.status(404);
      throw new Error("Data tidak ditemukan");
    }

    res.json({
      sukses: true,
      pesan: "Data berhasil diubah",
      data,
    });
  });

  const hapus = asyncHandler(async (req, res) => {
    const data = await Model.findByIdAndDelete(req.params.id);

    if (!data) {
      res.status(404);
      throw new Error("Data tidak ditemukan");
    }

    res.json({
      sukses: true,
      pesan: "Data berhasil dihapus",
      data,
    });
  });

  return {
    tambah,
    daftar,
    detail,
    ubah,
    hapus,
  };
};

module.exports = buatCrudController;
