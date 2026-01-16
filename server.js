require("dotenv").config();

const express = require("express");
const path = require("path");
const { neon } = require("@neondatabase/serverless");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// ========== SECURITY MIDDLEWARE ==========
// Helmet untuk security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // 100 requests per IP
  message: { error: "Terlalu banyak permintaan, coba lagi nanti" },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// Body parser dengan limit
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ========== DATABASE CONNECTION ==========
const sql = neon(process.env.DATABASE_URL);

// ========== UTILITY FUNCTIONS ==========
function generateId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers["x-real-ip"] || req.socket.remoteAddress || req.ip;

  // Bersihkan IPv6 prefix
  return ip.replace(/^::ffff:/, "");
}

// Sanitasi input untuk mencegah XSS
function sanitizeInput(input) {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Hapus HTML tags
    .replace(/['"]/g, "") // Hapus quotes
    .replace(/javascript:/gi, "") // Hapus javascript protocol
    .replace(/on\w+=/gi, "") // Hapus event handlers
    .slice(0, 500); // Batasi panjang
}

// Validasi ID format
function isValidId(id) {
  return /^[A-Za-z0-9]{5,10}$/.test(id);
}

// ========== VISITOR TRACKING ==========
async function trackVisitor(req, page) {
  const ip = getClientIp(req);

  try {
    // Insert IP baru
    await sql`
      INSERT INTO page_visitors (page, ip_address)
      VALUES (${page}, ${ip})
      ON CONFLICT (page, ip_address) DO NOTHING
    `;

    // Update total views
    const result = await sql`
      INSERT INTO page_views (page, total)
      VALUES (${page}, 1)
      ON CONFLICT (page)
      DO UPDATE SET total = page_views.total + 1
      RETURNING total
    `;

    return result[0]?.total || 0;
  } catch (error) {
    console.error("Visitor tracking error:", error.message);
    return 0;
  }
}

// ========== API ROUTES ==========

// Get all chats dengan sanitasi
app.get("/api/chats", async (req, res) => {
  try {
    const chats = await sql`
      SELECT id, message, created_at
      FROM chats
      ORDER BY created_at DESC
      LIMIT 100
    `;

    res.json(
      chats.map((chat) => ({
        id: chat.id,
        message: chat.message,
        created_at: chat.created_at
      }))
    );
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ error: "Gagal mengambil data chat" });
  }
});

// Post chat dengan limit 3x per IP
const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 jam
  max: 3, // 3 chat per IP per hari
  message: { error: "Batas maksimal 3 chat per hari telah tercapai" },
  keyGenerator: (req) => getClientIp(req),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

app.post("/api/chats", chatLimiter, async (req, res) => {
  try {
    let { message, user_id } = req.body;

    // Sanitasi input
    message = sanitizeInput(message);
    user_id = sanitizeInput(user_id);

    // Validasi
    if (!message || message.length < 1) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    if (!user_id || user_id.length < 3) {
      return res.status(400).json({ error: "User ID tidak valid" });
    }

    const ip = getClientIp(req);
    const id = generateId(8);

    // Cek jumlah chat dari IP ini dalam 24 jam terakhir
    const chatCount = await sql`
      SELECT COUNT(*) as count
      FROM chats
      WHERE ip_address = ${ip}
      AND created_at > NOW() - INTERVAL '24 hours'
    `;

    if (parseInt(chatCount[0].count) >= 3) {
      return res.status(429).json({
        error: "Batas maksimal 3 chat per hari telah tercapai"
      });
    }

    // Insert chat dengan IP address
    await sql`
      INSERT INTO chats (id, message, user_id, ip_address)
      VALUES (${id}, ${message}, ${user_id}, ${ip})
    `;

    res.status(201).json({
      success: true,
      id,
      message,
      remaining: 2 - parseInt(chatCount[0].count)
    });
  } catch (error) {
    console.error("Post chat error:", error);
    res.status(500).json({ error: "Gagal menyimpan chat" });
  }
});

// Get IP info untuk client
app.get("/api/client-info", async (req, res) => {
  try {
    const ip = getClientIp(req);

    // Cek jumlah chat dari IP ini
    const chatCount = await sql`
      SELECT COUNT(*) as count
      FROM chats
      WHERE ip_address = ${ip}
      AND created_at > NOW() - INTERVAL '24 hours'
    `;

    res.json({
      ip: ip,
      chatCount: parseInt(chatCount[0].count),
      remaining: Math.max(0, 3 - parseInt(chatCount[0].count))
    });
  } catch (error) {
    console.error("Client info error:", error);
    res.status(500).json({ error: "Gagal mengambil info client" });
  }
});

// Get page views
app.get("/api/page-views", async (req, res) => {
  try {
    const data = await sql`
      SELECT page, total
      FROM page_views
      ORDER BY page
    `;
    res.json(data);
  } catch (error) {
    console.error("Page views error:", error);
    res.status(500).json({ error: "Gagal mengambil data page views" });
  }
});

// Get unique visitors per page
app.get("/api/unique-visitors", async (req, res) => {
  try {
    const data = await sql`
      SELECT page, COUNT(DISTINCT ip_address) as unique_visitors
      FROM page_visitors
      GROUP BY page
      ORDER BY page
    `;
    res.json(data);
  } catch (error) {
    console.error("Unique visitors error:", error);
    res.status(500).json({ error: "Gagal mengambil data unique visitors" });
  }
});

// ========== PAGE ROUTES ==========
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

// ========== TEST ROUTES ==========
app.get("/db-test", async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.status(200).json({
      success: true,
      database: result[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========== ERROR HANDLERS ==========
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Jangan expose error details di production
  const isDev = process.env.NODE_ENV !== "production";

  res.status(err.status || 500).json({
    error: isDev ? err.message : "Terjadi kesalahan server",
    ...(isDev && { stack: err.stack })
  });
});

// ========== EXPORT ==========
module.exports = app;