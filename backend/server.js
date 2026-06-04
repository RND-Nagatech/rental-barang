const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDb = require("./config/db");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./utils/errorHandler");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    sukses: true,
    pesan: "API rental barang berjalan",
  });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server berjalan di port ${port}`);
    });

    server.on("error", (error) => {
      console.error(`Server gagal berjalan di port ${port}: ${error.message}`);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("Gagal menjalankan server:", error.message);
    process.exit(1);
  });
