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

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress
  );
}

async function trackVisitor(req, page) {
  const ip = getClientIp(req);

  try {
    // coba simpan IP + page
    await sql`
      INSERT INTO page_visitors (page, ip_address)
      VALUES (${page}, ${ip})
    `;

    // kalau berhasil insert → berarti IP baru
    await sql`
      UPDATE page_views
      SET total = total + 1
      WHERE page = ${page}
    `;
  } catch (error) {
    // error UNIQUE → IP sudah ada → diabaikan
    if (error.code !== "23505") {
      console.error("Visitor tracking error:", error.message);
    }
  }
}

// halaman utama
app.get("/", async (req, res) => {
  await trackVisitor(req, "/");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", async (req, res) => {
  await trackVisitor(req, "/about");
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/contact", async (req, res) => {
  await trackVisitor(req, "/contact");
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

app.get("/api/page-views", async (req, res) => {
  const data = await sql`
    SELECT * FROM page_views
    ORDER BY page
  `;
  res.json(data);
});

// ⚠️ WAJIB untuk Vercel
module.exports = app;
