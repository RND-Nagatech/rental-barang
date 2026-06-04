const uploadFile = (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("File wajib diunggah");
  }

  res.status(201).json({
    sukses: true,
    pesan: "File berhasil diunggah",
    data: {
      nama_file: req.file.filename,
      nama_asli: req.file.originalname,
      tipe_file: req.file.mimetype,
      ukuran_file: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
  });
};

module.exports = {
  uploadFile,
};
