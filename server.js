require("dotenv").config();

const express = require("express");
const path = require("path");
const { neon } = require("@neondatabase/serverless");
const Groq = require("groq-sdk");

const app = express();

// Koneksi ke Neon PostgreSQL
const sql = neon(process.env.DATABASE_URL);

// Inisialisasi Groq Client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Daftar kata kasar dasar
const badWords = [
  "anjing", "ajg", "4jg", "anjir", "anj1ng", "4nj1ng",
  "kontol", "kntl", "k0nt0l", "kont0l",
  "memek", "m3m3k", "mmk", "m3mk",
  "ngentot", "ngent0t", "ng3nt0t", "ngntd",
  "bangsat", "bngst", "b4ngs4t",
  "tolol", "t0l0l", "tll",
  "goblok", "gblk", "g0bl0k",
  "babi", "b4b1", "bab1",
  "asu", "4su", "asw",
  "jancok", "jnck", "j4nc0k",
  "coli", "c0li", "cl1", "ah", "yemeteh",
  "pelacur", "plcr", "p3l4cur",
  "lonte", "l0nt3", "lnt",
  "perek", "pr3k", "p3r3k",
  "sundal", "sundl", "sund4l",
  "bajingan", "bjngn", "b4j1ng4n",
  "tai", "t41", "t4i",
  "sial", "s14l", "s1al",
  "sialan", "s14l4n", "s1alan",
  "fuck", "fck", "f*ck",
  "shit", "sh1t", "sht",
  "bitch", "b1tch", "btch",
  "dick", "d1ck", "dck",
  "pussy", "psy", "p*ssy",
  "ass", "4ss", "a$$", "pepek", "fefek",
  "bacin", "nenen", "ah ah"
];

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "src")));
app.use(express.json());

function generateId(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fungsi filter kata kasar sederhana
function containsBadWords(text) {
  const lowerText = text.toLowerCase();
  return badWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'i');
    return regex.test(lowerText);
  });
}

// Fungsi analisis menggunakan Groq AI
async function analyzeWithGroqAI(message) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Anda adalah sistem moderasi konten yang bertugas mendeteksi kata kasar, ujaran kebencian, dan konten tidak pantas dalam bahasa Indonesia dan Inggris.

Analisis pesan dan berikan respons dalam format JSON:
{
  "isProfane": boolean,
  "severity": "low" | "medium" | "high",
  "reason": "penjelasan singkat mengapa dianggap tidak pantas",
  "detected": ["kata yang terdeteksi"]
}

Deteksi:
- Kata kasar dan variasinya (m3m3k, kntl, ngent0t, dll)
- Ujaran kebencian (SARA)
- Ancaman kekerasan
- Konten seksual eksplisit
- Spam atau link mencurigakan

Jika pesan AMAN, set isProfane: false`
        },
        {
          role: "user",
          content: `Analisis pesan ini: "${message}"`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Groq AI Error:", error.message);
    return {
      isProfane: false,
      severity: "low",
      reason: "AI analysis unavailable",
      detected: []
    };
  }
}

// Fungsi utama moderasi konten
async function moderateContent(message) {
  const hasBadWords = containsBadWords(message);
  
  if (hasBadWords) {
    return {
      allowed: false,
      reason: "Pesan mengandung kata-kata yang tidak pantas",
      method: "basic_filter",
      severity: "high"
    };
  }

  const aiAnalysis = await analyzeWithGroqAI(message);
  
  if (aiAnalysis.isProfane) {
    return {
      allowed: false,
      reason: aiAnalysis.reason || "Konten tidak pantas terdeteksi oleh AI",
      method: "ai_analysis",
      severity: aiAnalysis.severity,
      detected: aiAnalysis.detected
    };
  }

  return {
    allowed: true,
    reason: "Pesan aman",
    method: "both_passed"
  };
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress
  );
}

async function trackVisitor(req, page) {
  const ip = getClientIp(req);

  try {
    await sql`
      INSERT INTO page_visitors (page, ip_address)
      VALUES (${page}, ${ip})
      ON CONFLICT (page, ip_address) DO NOTHING
    `;

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

// ==================== ROUTES ====================

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

// ⚠️ PENTING: Route spesifik HARUS di atas route dinamis!

// halaman upload artikel (admin / private)
app.get("/article/uploads", async (req, res) => {
  await trackVisitor(req, "/article/uploads");
  res.sendFile(path.join(__dirname, "public", "article-upload.html"));
});

// halaman list artikel
app.get("/article", async (req, res) => {
  await trackVisitor(req, "/article");
  res.sendFile(path.join(__dirname, "public", "article.html"));
});

// halaman detail artikel - HARUS PALING BAWAH
app.get("/article/:slug", async (req, res) => {
  await trackVisitor(req, "/article/" + req.params.slug);
  res.sendFile(path.join(__dirname, "public", "article-detail.html"));
});

// ==================== API ENDPOINTS ====================

// Endpoint untuk verifikasi PIN upload
app.post("/api/verify-upload-pin", (req, res) => {
  try {
    const { pin } = req.body;
    const correctPin = process.env.KEY_UPLOAD || "200929";

    if (pin === correctPin) {
      return res.json({ 
        success: true, 
        message: "PIN verified successfully" 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid PIN" 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

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

app.get("/api/chats", async (req, res) => {
  try {
    const chats = await sql`
      SELECT id, message, created_at, user_id
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

    const moderation = await moderateContent(message);

    if (!moderation.allowed) {
      return res.status(403).json({
        error: "Message blocked",
        reason: moderation.reason,
        severity: moderation.severity,
        method: moderation.method
      });
    }

    const id = generateId(5);

    await sql`
      INSERT INTO chats (id, message, user_id)
      VALUES (${id}, ${message}, ${user_id})
    `;

    res.status(201).json({ 
      id, 
      message,
      moderation: {
        passed: true,
        method: moderation.method
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/articles", async (req, res) => {
  try {
    const { q } = req.query;

    const data = q
      ? await sql`
          SELECT id, slug, title, about, image_base64, created_at
          FROM articles
          WHERE title ILIKE ${"%" + q + "%"}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT id, slug, title, about, image_base64, created_at
          FROM articles
          ORDER BY created_at DESC
        `;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/articles", async (req, res) => {
  try {
    const { title, about, image, content } = req.body;

    if (!title || !about || !image) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const id = generateId();

    await sql`
      INSERT INTO articles (id, slug, title, about, image_base64, content)
      VALUES (
        ${id},
        ${slug},
        ${title},
        ${about},
        ${image},
        ${JSON.stringify(content)}
      )
    `;

    res.json({ success: true, slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/articles/:slug", async (req, res) => {
  try {
    const article = await sql`
      SELECT * FROM articles WHERE slug = ${req.params.slug}
    `;
    res.json(article[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;