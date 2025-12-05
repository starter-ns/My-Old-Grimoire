// backend/app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Connect to MongoDB using .env
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Static folder for images
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes (we will create them next)
const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");

app.use("/api/auth", userRoutes);
app.use("/api/books", bookRoutes);

module.exports = app;
