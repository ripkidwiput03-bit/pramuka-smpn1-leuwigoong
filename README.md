

<div align="center">

# <img src="public/images/logo_pramuka_smpn1.svg" width="80" alt="Logo"/> <br/> Pramuka SMPN 1 Leuwigoong

**Platform Digital Lengkap untuk Manajemen Kegiatan Pramuka**

*Absensi QR · Blog · Berita · Chat Realtime · Minigame Edukatif · Leaderboard*

<br/>

[<img src="https://img.shields.io/badge/🚀_Live_Demo-2e7d32?style=for-the-badge" height="35"/>](#) [<img src="https://img.shields.io/badge/📖_Dokumentasi-1565c0?style=for-the-badge" height="35"/>](#-instalasi) [<img src="https://img.shields.io/badge/💛_Donasi-ffc107?style=for-the-badge" height="35"/>](#-dukung-project-ini)

<br/>

<img src="https://img.shields.io/badge/node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white"/> <img src="https://img.shields.io/badge/express-4.x-000000?style=flat-square&logo=express&logoColor=white"/> <img src="https://img.shields.io/badge/socket.io-4.x-010101?style=flat-square&logo=socket.io&logoColor=white"/> <img src="https://img.shields.io/badge/sqlite-sql.js-003B57?style=flat-square&logo=sqlite&logoColor=white"/> <img src="https://img.shields.io/badge/firebase-auth-FFCA28?style=flat-square&logo=firebase&logoColor=black"/> <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square"/> <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square"/>

<br/>

```
⛺ Digitalisasi kegiatan Pramuka — dari absensi hingga pembelajaran interaktif
```

</div>

<br/>

---

<br/>

## 🌟 Kenapa Project Ini?

> Mengelola kegiatan Pramuka masih pakai cara manual? Absensi kertas, info lewat grup WA yang tenggelam, materi yang membosankan?
>
> **Project ini hadir sebagai solusi all-in-one** — satu platform untuk semua kebutuhan organisasi Pramuka sekolah.

<br/>

## ⚡ Fitur Unggulan

<table>
<tr>
<td align="center" width="33%">
<br/>
<img width="60" src="https://cdn-icons-png.flaticon.com/512/1995/1995515.png" alt="QR"/>
<br/><br/>
<b>📸 Absensi QR Code</b>
<br/><br/>
Scan langsung via kamera HP.<br/>
Rekap otomatis per regu.<br/>
Export Excel & PDF.
<br/><br/>
</td>
<td align="center" width="33%">
<br/>
<img width="60" src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="Game"/>
<br/><br/>
<b>🎮 5 Minigame Edukatif</b>
<br/><br/>
Belajar materi Pramuka<br/>
sambil bermain. Sistem XP<br/>
& 10 level kehormatan.
<br/><br/>
</td>
<td align="center" width="33%">
<br/>
<img width="60" src="https://cdn-icons-png.flaticon.com/512/2462/2462719.png" alt="Chat"/>
<br/><br/>
<b>💬 Chat Realtime</b>
<br/><br/>
Komunikasi langsung antar<br/>
anggota. Powered by<br/>
Socket.io.
<br/><br/>
</td>
</tr>
<tr>
<td align="center" width="33%">
<br/>
<img width="60" src="https://cdn-icons-png.flaticon.com/512/4387/4387152.png" alt="Blog"/>
<br/><br/>
<b>📝 Blog & Berita</b>
<br/><br/>
Tulis artikel, like & komentar.<br/>
Berita otomatis dari<br/>
news scraper.
<br/><br/>
</td>
<td align="center" width="33%">
<br/>
<img width="60" src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" alt="Admin"/>
<br/><br/>
<b>🛡️ Panel Admin</b>
<br/><br/>
Kelola user, role, & sesi.<br/>
Dashboard statistik<br/>
lengkap.
<br/><br/>
</td>
<td align="center" width="33%">
<br/>
<img width="60" src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Profile"/>
<br/><br/>
<b>👤 Profil & Auth</b>
<br/><br/>
Login email + Google OAuth.<br/>
Upload foto, role system<br/>
3 tingkat.
<br/><br/>
</td>
</tr>
</table>

<br/>

---

<br/>

## 🎮 Minigame Kepramukaan

| # | Game | Deskripsi | XP |
|:-:|:-----|:----------|:--:|
| 📚 | **Kuis Pilihan Ganda** | 10 soal dari 37+ bank soal | +12/soal |
| ✅ | **Benar atau Salah** | Sprint 15 pernyataan cepat | +6/soal |
| 🔤 | **Susun Kata** | Acak huruf → istilah Pramuka | +15/kata |
| 🃏 | **Memory Match** | Cocokkan golongan & usia | +20/selesai |
| 🎭 | **Tebak Emoji** | Tebak istilah dari emoji | +10/soal |

### 🏅 Sistem Level

<div align="center">

`🪵 Kayu` → `🪨 Batu` → `🥉 Perunggu` → `🥈 Perak` → `🥇 Emas` → `💎 Berlian` → `🔮 Mutiara` → `⚡ Legend` → `🌟 Mythic` → `👑 Grand Master`

</div>

<br/>

---

<br/>

## 🏗️ Tech Stack

| Backend | Frontend | Database | Tools |
|:--------|:---------|:---------|:------|
| Node.js 18+ | HTML5 / CSS3 | sql.js (SQLite) | QRCode.js |
| Express 4.x | Vanilla JS | pramuka.db | ExcelJS |
| Socket.io 4.x | Font Awesome | game.db | PDFKit |
| JWT + bcryptjs | Google Fonts | | Multer |
| dotenv | Firebase SDK | | |

<br/>

---

<br/>

## 🚀 Instalasi

### Prasyarat

- **Node.js** 18+
- **npm** (bawaan Node.js)

### Langkah Cepat

```bash
# 1️⃣ Clone
git clone https://github.com/ripkidwiput03-bit/pramuka-smpn1-leuwigoong.git
cd pramuka-smpn1-leuwigoong

# 2️⃣ Install
npm install

# 3️⃣ Setup environment
cp .env.example .env
```

### Konfigurasi `.env`

```env
PORT=3000
JWT_SECRET=isi_dengan_string_random_yang_panjang_dan_aman

# Admin default (dibuat otomatis saat pertama jalan)
ADMIN_EMAIL=email@kamu.com
ADMIN_PASSWORD=password_admin_yang_kuat

# Firebase (untuk Google OAuth)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

### Jalankan

```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

> 🌐 Buka **http://localhost:3000** di browser

<br/>

### 📱 Install di Termux (Android)

<details>
<summary><b>Klik untuk lihat langkah Termux</b></summary>

<br/>

```bash
pkg update && pkg upgrade
pkg install nodejs git

git clone https://github.com/ripkidwiput03-bit/pramuka-smpn1-leuwigoong.git
cd pramuka-smpn1-leuwigoong
npm install

cp .env.example .env
nano .env          # edit konfigurasi

npm start
```

</details>

<br/>

---

<br/>

## 📁 Struktur Project

```
pramuka-smpn1-leuwigoong/
├── data/                        # Database (auto-generate, di .gitignore)
│   ├── pramuka.db               #   Users, posts, absensi, chat
│   └── game.db                  #   Players, scores, achievements
├── middleware/
│   └── auth.js                  # JWT authentication
├── public/                      # Frontend static files
│   ├── css/style.css            #   Stylesheet utama
│   ├── js/                      #   auth.js, app.js
│   ├── images/                  #   Logo & assets
│   ├── uploads/                 #   File upload user
│   └── *.html                   #   Halaman-halaman website
├── routes/                      # API endpoints
│   ├── auth.js                  #   Register, login, profil
│   ├── posts.js                 #   Blog & komentar
│   ├── attendance.js            #   Absensi QR + manual
│   ├── chat.js                  #   Pesan realtime
│   ├── news.js                  #   Berita & scraper
│   ├── game.js                  #   Minigame & leaderboard
│   └── admin.js                 #   Panel admin
├── database.js                  # Init pramuka.db
├── game-database.js             # Init game.db
├── server.js                    # Entry point + Socket.io
├── .env.example                 # Template environment
├── .gitignore
├── LICENSE
└── package.json
```

<br/>

---

<br/>

## 🗺️ Halaman Website

| Halaman | URL | Akses |
|:--------|:----|:-----:|
| 🏠 Beranda | `/` | 🌐 Publik |
| 📰 Berita | `/news.html` | 🌐 Publik |
| 📝 Blog | `/posts.html` | 🔐 Login |
| 📸 Absensi | `/attendance.html` | 🔐 Login |
| 💬 Chat | `/chat.html` | 🔐 Login |
| 🎮 Minigame | `/game.html` | 🔐 Login |
| 👤 Profil | `/profile.html` | 🔐 Login |
| 📊 Dashboard | `/dashboard.html` | 🔐 Login |
| 🛡️ Admin | `/admin.html` | 👑 Admin |

<br/>

---

<br/>

## 🔒 Keamanan

| Layer | Implementasi |
|:------|:-------------|
| 🔑 Autentikasi | JWT Token (7 hari) + httpOnly Cookie |
| 🔐 Password | Hash bcryptjs (salt rounds: 10) |
| 🌐 OAuth | Firebase Google Sign-In |
| 📁 Upload | Validasi tipe file + max 3MB |
| 🚫 Secrets | `.env` & `data/` di `.gitignore` |
| 🔧 Config | Firebase config dari server, tidak hardcode |

<br/>

---

<br/>

## 🤝 Kontribusi

Kontribusi sangat diterima! Berikut caranya:

```bash
# 1. Fork repo ini
# 2. Buat branch fitur
git checkout -b fitur/nama-fitur

# 3. Commit perubahan
git commit -m "feat: tambah fitur xyz"

# 4. Push
git push origin fitur/nama-fitur

# 5. Buka Pull Request di GitHub
```

> 💡 Untuk perubahan besar, buka **Issue** terlebih dahulu untuk diskusi.

<br/>

---

<br/>

## 💛 Dukung Project Ini

<div align="center">

Jika project ini bermanfaat, kamu bisa mendukung pengembangan melalui **donasi**:

<br/>

<img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" width="120" alt="DANA"/>

<br/><br/>

| | |
|:-:|:-:|
| 📱 **Nomor** | `0838-1520-1912` |
| 👤 **Nama** | `a/n Ripkidwiput` |

<br/>

Setiap donasi — berapapun — sangat berarti untuk:

| | |
|:-:|:--|
| ☕ | Beli kopi biar begadang coding |
| 🖥️ | Biaya server & hosting |
| 📚 | Pengembangan fitur baru |
| 🏕️ | Dukung kegiatan Pramuka |

<br/>

> *"Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."*

</div>

<br/>

---

<br/>

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat [`LICENSE`](LICENSE) untuk detail.

<br/>

---

<br/>

<div align="center">

### 💬 Kontak & Kolaborasi

<br/>

[<img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" height="40"/>](https://wa.me/6283815201912?text=Halo%2C%20saya%20tertarik%20dengan%20project%20Website%20Pramuka!) [<img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" height="40"/>](https://github.com/ripkidwiput03-bit)

<br/>

---

<br/>

<sub>

**Dibuat dengan ❤️ untuk Pramuka SMPN 1 Leuwigoong**

<br/>

<img src="https://img.shields.io/badge/Made_with-Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/> <img src="https://img.shields.io/badge/Runs_on-Termux-1b5e20?style=flat-square"/> <img src="https://img.shields.io/badge/🏕️-Pramuka_Digital-ffc107?style=flat-square"/>

<br/>

⭐ **Star repo ini** jika bermanfaat!

</sub>

</div>