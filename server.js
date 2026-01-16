require("dotenv").config();

const express = require("express");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const app = express();

// koneksi ke Neon PostgreSQL
const sql = neon(process.env.DATABASE_URL);

// static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

function generateId(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get("/api/chats", async (req, res) => {
  try {
    const chats = await sql`
      SELECT id, message, created_at
      FROM chats
      ORDER BY created_at ASC
      LIMIT 100
    `;
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chats", async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message || !user_id) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const id = generateId(5);

    await sql`
      INSERT INTO chats (id, message, user_id)
      VALUES (${id}, ${message}, ${user_id})
    `;

    res.status(201).json({ id, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
