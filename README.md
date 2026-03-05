<div align="center">

<img src="public/images/logo_pramuka_smpn1.svg" width="120" alt="Logo Pramuka SMPN 1 Leuwigoong"/>

# 🏕️ Website Pramuka SMPN 1 Leuwigoong

<p>Platform digital lengkap untuk manajemen kegiatan Pramuka — absensi QR, blog, berita, chat realtime, minigame edukatif, dan sistem leaderboard.</p>

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sql.js.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

[![License: Proprietary](https://img.shields.io/badge/License-MIT-ffc107?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-2e7d32?style=flat-square)]()
[![Platform](https://img.shields.io/badge/Platform-Termux%20%7C%20VPS-1b5e20?style=flat-square)]()

</div>

---

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 📋 Manajemen Anggota
- Registrasi & login (Email + Google OAuth)
- Edit profil & upload foto
- Role system: Admin, Pembina, Anggota
- Dashboard personal

### 📸 Absensi Digital
- Scan QR Code via **kamera langsung**
- Input manual Session ID
- Rekap per sesi, per regu, per anggota
- Export Excel & PDF
- Statistik kehadiran lengkap

### 📰 Konten & Blog
- Manajemen berita otomatis (news scraper)
- Blog anggota dengan likes & komentar
- Upload gambar & kategori

</td>
<td width="50%">

### 💬 Chat Realtime
- Pesan langsung antar anggota
- Powered by **Socket.io**
- Notifikasi realtime

### 🎮 Minigame Edukatif
- **5 game** materi kepramukaan
- Sistem XP & **10 level gelar kehormatan**
- Leaderboard global
- Achievement & statistik
- Database terpisah (`game.db`)

### 🛡️ Panel Admin
- Manajemen user, role, & sesi absensi
- Export laporan Excel/PDF
- Statistik dashboard lengkap

</td>
</tr>
</table>

---

## 🎮 Minigame Kepramukaan

| Game | Deskripsi | XP |
|:----:|-----------|:--:|
| 📚 **Kuis** | 10 soal pilihan ganda dari 37+ bank soal | +12/soal |
| ✅ **Benar/Salah** | Sprint 15 pernyataan kepramukaan | +6/soal |
| 🔤 **Susun Kata** | Acak huruf jadi istilah Pramuka | +15/kata |
| 🃏 **Memory Match** | Cocokkan golongan & usia Pramuka | +20/selesai |
| 🎭 **Tebak Emoji** | Tebak istilah dari petunjuk emoji | +10/soal |

**Level System** — dari 🪵 Kayu sampai 👑 Grand Master (10 level)

---

## 🛠️ Tech Stack

```
Backend          Frontend         Database         Tools
──────────────   ──────────────   ──────────────   ──────────────
Node.js 18+      HTML5 / CSS3     sql.js (SQLite)  QRCode.js
Express 4.x      Vanilla JS       pramuka.db       ExcelJS
Socket.io 4.x    Font Awesome     game.db          PDFKit
JWT Auth         Google Fonts     (terpisah)       Multer
bcryptjs         Firebase JS      
dotenv           Socket.io Client 
```

---

## 🚀 Instalasi

### Prasyarat
- Node.js 18+ atau Termux (Android)
- npm

### 1. Clone Repository

```bash
git clone https://github.com/ripkidwiput03-bit/pramuka-smpn1-leuwigoong.git
cd pramuka-smpn1-leuwigoong
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env` :

```env
PORT=3000
JWT_SECRET=isi_dengan_string_random_panjang

ADMIN_EMAIL=email@kamu.com
ADMIN_PASSWORD=password_admin

FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

### 4. Jalankan Server

```bash
# Mode normal
npm start

# Mode development (auto-restart)
npm run dev
```

Buka browser: **http://localhost:3000**

---

## 📱 Instalasi di Termux (Android)

```bash
# Update & install Node.js
pkg update && pkg upgrade
pkg install nodejs

# Clone & install
git clone https://github.com/username/pramuka-smpn1-leuwigoong.git
cd pramuka-smpn1-leuwigoong
npm install

# Setup .env
cp .env.example .env
nano .env

# Jalankan
npm start
```

---

## 📁 Struktur Project

```
pramuka-smpn1-leuwigoong/
│
├── 📂 data/                    # Database files (di .gitignore)
│   ├── pramuka.db              # DB utama (users, posts, absensi, dll)
│   └── game.db                 # DB game (players, scores, achievements)
│
├── 📂 middleware/
│   └── auth.js                 # JWT authentication middleware
│
├── 📂 public/                  # Static files (frontend)
│   ├── 📂 css/
│   │   └── style.css           # Main stylesheet
│   ├── 📂 js/
│   │   ├── auth.js             # AuthManager + Firebase init
│   │   └── app.js              # Global utilities
│   ├── 📂 images/              # Logo & assets
│   ├── 📂 uploads/             # File upload user
│   └── *.html                  # Halaman-halaman website
│
├── 📂 routes/
│   ├── auth.js                 # Register, login, profil, upload foto
│   ├── posts.js                # Blog & komentar
│   ├── attendance.js           # Absensi QR + manual (lengkap)
│   ├── chat.js                 # Pesan realtime
│   ├── news.js                 # Berita & scraper
│   ├── game.js                 # Minigame, skor, leaderboard
│   └── admin.js                # Panel admin
│
├── database.js                 # Init & helper pramuka.db
├── game-database.js            # Init & helper game.db
├── server.js                   # Entry point + Socket.io
├── .env                        # 🔒 Secrets (jangan di-commit!)
├── .env.example                # Template .env
├── .gitignore
└── package.json
```

---

## 🔒 Keamanan

- 🔑 JWT Token (7 hari expiry) + httpOnly Cookie
- 🔐 Password di-hash dengan **bcryptjs**
- 🌐 Firebase Google OAuth
- 📁 File upload dibatasi tipe & ukuran (max 3MB)
- 🚫 `.env` dan `data/` ada di `.gitignore`
- 🔧 Firebase config **tidak hardcode** di frontend — diambil dari server

---

## 📸 Halaman Website

| Halaman | URL | Akses |
|---------|-----|-------|
| Beranda | `/` | Publik |
| Berita | `/news.html` | Publik |
| Blog | `/posts.html` | Login |
| Absensi | `/attendance.html` | Login |
| Chat | `/chat.html` | Login |
| Minigame | `/game.html` | Login |
| Profil | `/profile.html` | Login |
| Dashboard | `/dashboard.html` | Login |
| Admin | `/admin.html` | Admin only |

---

## 👤 Default Admin

Setelah pertama kali jalan, akun admin dibuat otomatis dari `.env`:

```
Email    : nilai ADMIN_EMAIL di .env
Password : nilai ADMIN_PASSWORD di .env
```

> ⚠️ **Segera ganti password setelah deploy!**

---

## 🤝 Kontribusi

Pull request sangat diterima! Untuk perubahan besar, buka issue dulu ya.

1. Fork repository ini
2. Buat branch fitur (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan (`git commit -m 'feat: tambah fitur xyz'`)
4. Push ke branch (`git push origin fitur/nama-fitur`)
5. Buka Pull Request

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat [`LICENSE`](LICENSE) untuk info lebih lanjut.

---

<div align="center">

### 💬 Ada pertanyaan atau mau kolaborasi?

<a href="https://wa.me/6283815201912?text=Halo%2C%20saya%20tertarik%20dengan%20project%20Website%20Pramuka%20SMPN%201%20Leuwigoong!">
  <img src="https://img.shields.io/badge/WhatsApp-Hubungi%20Saya-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp"/>
</a>

<br/><br/>

<sub>Dibuat dengan ❤️ untuk Pramuka SMPN 1 Leuwigoong</sub>

<br/>

<img src="https://img.shields.io/badge/Made%20with-Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Runs%20on-Termux-1b5e20?style=flat-square"/>
<img src="https://img.shields.io/badge/🏕️-Pramuka%20SMPN%201%20Leuwigoong-ffc107?style=flat-square"/>

</div>
