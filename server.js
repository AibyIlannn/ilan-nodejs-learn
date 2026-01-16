require("dotenv").config();

const express = require("express");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const app = express();

// koneksi ke Neon PostgreSQL
const sql = neon(process.env.DATABASE_URL);

// static files
app.use(express.static(path.join(__dirname, "public")));

// halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// 🔹 TEST DATABASE
app.get("/db-test", async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.status(200).json({
      success: true,
      database: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ⚠️ WAJIB untuk Vercel
module.exports = app;
