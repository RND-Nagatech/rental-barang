const mongoose = require("mongoose");

const connectDb = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI belum diatur di file .env");
  }

  const connection = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB terhubung: ${connection.connection.host}`);
};

module.exports = connectDb;
