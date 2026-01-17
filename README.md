# DOKUMENTASI ILAN LEARNING

## 1. Node.js + Express + PostgreSQL (Neon) di Vercel

## 1.1 Pengenalan
Project ini adalah contoh implementasi **Node.js + Express** yang terhubung dengan **PostgreSQL (Neon Tech)** dan di-deploy menggunakan **Vercel (serverless)**.  
Aplikasi ini mencakup static website, REST API, serta fitur chat sederhana yang tersimpan di database.

Preview:
https://ilan-nodejs-learn.vercel.app

---

## 2. Persyaratan

Sebelum memulai, pastikan sudah terinstall:

- Node.js (disarankan versi 18+)
- npm
- Git
- Akun GitHub
- Akun Vercel
- Akun Neon Tech (PostgreSQL)

---

## 3. Clone Repository

Clone repository dari GitHub ke lokal:

```bash
git clone https://github.com/AibyIlannn/ilan-nodejs-learn.git
```

Masuk ke folder project:
```bash
cd ilan-nodejs-learn
```

---

4. Install Dependency

Install semua dependency yang dibutuhkan:
```bash
npm install
```
Dependency utama yang digunakan:
- express
- dotenv
- @neondatabase/serverless

---

5. Setup Environment Variable (.env)

5.1 Membuat File .env
Buat file .env di root project:
```bash
touch .env
```
Isi dengan konfigurasi database PostgreSQL dari Neon:
```.env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```
Catatan:
- Jangan gunakan tanda kutip
- Jangan commit file .env ke GitHub
- Pastikan .env sudah ada di .gitignore
  
---

5.2 Mendapatkan DATABASE_URL dari Neon Tech

Langkah singkat:
1. Login ke https://neon.tech
2. Buat project PostgreSQL baru
3. Masuk ke menu Connection Details
4. Copy Connection String (DATABASE_URL)
5. Paste ke file .env

---

6. Struktur Project

Struktur folder utama:
```project
root/
├─ public/
│  ├─ index.html
│  ├─ about.html
│  └─ contact.html
├─ server.js
├─ vercel.json
├─ package.json
└─ .env
```

---

7. Menjalankan Project di Lokal
   
Jalankan server secara lokal:
```bash
npm start
```
Akses di browser:
http://localhost:3000

Test koneksi database:
http://localhost:3000/db-test

Jika berhasil, akan muncul versi PostgreSQL.

---

8. Setup Database Table (PostgreSQL)

Masuk ke Neon SQL Editor, lalu jalankan query berikut:
```sql
CREATE TABLE chats (
  id VARCHAR(5) PRIMARY KEY,
  message TEXT NOT NULL,
  user_id VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Table ini digunakan untuk menyimpan data chat.

---

9. API Endpoint

9.1 GET Semua Chat
Endpoint:
```api
GET /api/chats
```
Fungsi:
Mengambil seluruh chat dari database
Digunakan oleh frontend untuk menampilkan pesan

---

9.2 POST Chat Baru
Endpoint:
```api
POST /api/chats
```
Body JSON:
```json
{
  "message": "Isi chat",
  "user_id": "local_user_id"
}
```
Fungsi:
Menyimpan chat ke PostgreSQL
Digunakan saat user mengirim pesan

---

10. LocalStorage untuk Identitas User

Aplikasi ini menggunakan localStorage untuk menyimpan user_id sederhana:
Dibuat otomatis saat pertama kali membuka website

Digunakan untuk membedakan chat milik sendiri dan orang lain
Bukan sistem autentikasi, hanya untuk pembelajaran

---

11. Konfigurasi Vercel

11.1 File vercel.json
```vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

---

11.2 Setup ENV di Vercel

1. Masuk ke Dashboard Vercel
2. Pilih project
3. Masuk ke Settings → Environment Variable
4. Tambahkan:
   
Key   : DATABASE_URL
Value : (DATABASE_URL dari Neon)

Aktifkan untuk:
Production
Preview

---

12. Deploy ke Vercel

Push perubahan ke GitHub:
```bash
git add .
git commit -m "deploy express neon postgres"
git push origin main
```
Vercel akan otomatis melakukan deploy ulang.

---

13. Penutup

Project ini dibuat untuk tujuan pembelajaran:
- Node.js + Express
- PostgreSQL (Neon Tech)
- Serverless deployment di Vercel

Integrasi frontend dan backend tanpa framework tambahan


Cocok sebagai dasar untuk:
- REST API
- Chat app sederhana
- Latihan fullstack JavaScript

---
