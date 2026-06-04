const notFound = (req, res, next) => {
  const error = new Error(`Endpoint tidak ditemukan: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let pesan = error.message || "Terjadi kesalahan pada server";

  if (error.name === "CastError") {
    statusCode = 404;
    pesan = "Data tidak ditemukan";
  }

  if (error.code === 11000) {
    statusCode = 400;
    const field = Object.keys(error.keyValue || {}).join(", ");
    pesan = `Data dengan ${field} tersebut sudah digunakan`;
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    pesan = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  res.status(statusCode).json({
    sukses: false,
    pesan,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
