#!/bin/bash

clear
echo ""
echo "🏕️ ============================================="
echo "🏕️  INSTALLER"
echo "🏕️  Pramuka SMPN 1 Leuwigoong"
echo "🏕️  Website Full-Stack Node.js"
echo "🏕️ ============================================="
echo ""
sleep 1

# ---- STEP 1: Update & Upgrade ----
echo "📦 [1/8] Updating Termux packages..."
apt update -y 2>/dev/null
apt upgrade -y 2>/dev/null
pkg update -y 2>/dev/null
pkg upgrade -y 2>/dev/null
echo "✅ Packages updated"
echo ""

# ---- STEP 2: Install Node.js ----
echo "📦 [2/8] Installing Node.js..."
pkg install nodejs-lts -y 2>/dev/null || pkg install nodejs -y 2>/dev/null
echo "   Node version: $(node -v 2>/dev/null || echo 'not found')"
echo "   NPM version:  $(npm -v 2>/dev/null || echo 'not found')"
echo "✅ Node.js installed"
echo ""

# ---- STEP 3: Install Build Tools ----
echo "📦 [3/8] Installing build tools for native modules..."
pkg install python -y 2>/dev/null
pkg install make -y 2>/dev/null
pkg install clang -y 2>/dev/null
pkg install g++ -y 2>/dev/null
pkg install binutils -y 2>/dev/null
pkg install pkg-config -y 2>/dev/null
pkg install libc++ -y 2>/dev/null
echo "✅ Build tools installed"
echo ""

# ---- STEP 4: Install Git ----
echo "📦 [4/8] Installing Git..."
pkg install git -y 2>/dev/null
echo "✅ Git installed"
echo ""

# ---- STEP 5: Create Directories ----
echo "📁 [5/8] Creating project directories..."

# ── Database folder ──────────────────────────
mkdir -p data
# Buat .gitkeep agar folder tetap ada di git
touch data/.gitkeep
echo "   ✅ data/"

# ── Upload folders ───────────────────────────
mkdir -p public/uploads/fotoprofil
touch public/uploads/fotoprofil/.gitkeep
echo "   ✅ public/uploads/fotoprofil/"

mkdir -p public/uploads/posts
touch public/uploads/posts/.gitkeep
echo "   ✅ public/uploads/posts/"

mkdir -p public/uploads/attendance
touch public/uploads/attendance/.gitkeep
echo "   ✅ public/uploads/attendance/"

mkdir -p public/uploads/news
touch public/uploads/news/.gitkeep
echo "   ✅ public/uploads/news/"

# ── Static assets ────────────────────────────
mkdir -p public/css
echo "   ✅ public/css/"

mkdir -p public/js
echo "   ✅ public/js/"

mkdir -p public/images
echo "   ✅ public/images/"

# ── Backend structure ─────────────────────────
mkdir -p routes
echo "   ✅ routes/"

mkdir -p middleware
echo "   ✅ middleware/"

mkdir -p logs
touch logs/.gitkeep
echo "   ✅ logs/"

echo ""
echo "✅ Semua folder berhasil dibuat"
echo ""

# ---- STEP 6: Configure NPM ----
echo "⚙️  [6/8] Configuring NPM for Termux..."
npm config set python $(which python3 2>/dev/null || which python 2>/dev/null) 2>/dev/null
npm config set legacy-peer-deps true 2>/dev/null
export CXX=$(which g++ 2>/dev/null || which clang++ 2>/dev/null)
export CC=$(which gcc 2>/dev/null || which clang 2>/dev/null)
echo "✅ NPM configured"
echo ""

# ---- STEP 7: Install Node Dependencies ----
echo "📦 [7/8] Installing Node.js dependencies..."
echo "   (Ini mungkin memakan waktu 3-10 menit)"
echo ""

# Install semua dependencies (sql.js — tidak perlu build native!)
npm install \
  express \
  socket.io \
  sql.js \
  bcryptjs \
  jsonwebtoken \
  multer \
  dotenv \
  cors \
  qrcode \
  exceljs \
  pdfkit \
  cookie-parser \
  uuid \
  --save 2>&1 | tail -5

echo ""

# Install dev dependency
npm install nodemon --save-dev 2>/dev/null

echo ""
echo "✅ Dependencies installed"
echo ""

# ---- STEP 8: Setup .env ----
echo "⚙️  Checking .env file..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "   ✅ .env dibuat dari .env.example"
    echo "   ⚠️  Jangan lupa isi nilai di file .env!"
  else
    # Buat .env minimal jika tidak ada .env.example
    cat > .env << 'ENVEOF'
PORT=3000
JWT_SECRET=pramuka_smpn1_leuwigoong_secret_key_ganti_ini
ADMIN_EMAIL=admin@pramuka.com
ADMIN_PASSWORD=admin123
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
ENVEOF
    echo "   ✅ .env dibuat dengan nilai default"
    echo "   ⚠️  Segera ganti JWT_SECRET dan kredensial admin!"
  fi
else
  echo "   ✅ .env sudah ada, tidak diubah"
fi
echo ""

# ---- STEP 9: Verify Installation ----
echo "🔍 [8/8] Verifying installation..."
echo ""

ERRORS=0

# Cek Node.js
if command -v node &> /dev/null; then
  echo "   ✅ Node.js   : $(node -v)"
else
  echo "   ❌ Node.js   : TIDAK DITEMUKAN"
  ERRORS=$((ERRORS + 1))
fi

# Cek NPM
if command -v npm &> /dev/null; then
  echo "   ✅ NPM       : $(npm -v)"
else
  echo "   ❌ NPM       : TIDAK DITEMUKAN"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Cek modul penting
for MODULE in express socket.io sql.js bcryptjs jsonwebtoken multer dotenv cors qrcode exceljs pdfkit cookie-parser uuid; do
  if node -e "require('$MODULE')" 2>/dev/null; then
    echo "   ✅ $MODULE"
  else
    echo "   ❌ $MODULE : GAGAL"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""

# Cek folder penting
echo "   Mengecek folder..."
for DIR in data public/uploads/fotoprofil public/uploads/posts public/css public/js routes middleware; do
  if [ -d "$DIR" ]; then
    echo "   ✅ $DIR/"
  else
    echo "   ❌ $DIR/ : TIDAK ADA — membuat ulang..."
    mkdir -p "$DIR"
    echo "      ↳ Berhasil dibuat"
  fi
done

echo ""

# Cek file utama
if [ -f "server.js" ]; then
  echo "   ✅ server.js        : Ada"
else
  echo "   ⚠️  server.js        : Belum ada (buat dulu pakai Acode)"
fi

if [ -f ".env" ]; then
  echo "   ✅ .env             : Ada"
else
  echo "   ❌ .env             : TIDAK ADA"
  ERRORS=$((ERRORS + 1))
fi

if [ -f "database.js" ]; then
  echo "   ✅ database.js      : Ada"
else
  echo "   ⚠️  database.js      : Belum ada"
fi

if [ -f "game-database.js" ]; then
  echo "   ✅ game-database.js : Ada"
else
  echo "   ⚠️  game-database.js : Belum ada"
fi

echo ""
echo "============================================="

if [ $ERRORS -eq 0 ]; then
  echo "🎉 SETUP BERHASIL! Semua siap dijalankan!"
else
  echo "⚠️  Ada $ERRORS masalah yang perlu diperbaiki."
  echo "   Coba jalankan ulang: bash setup.sh"
fi

echo "============================================="
echo ""
echo "🚀 CARA MENJALANKAN:"
echo "   node server.js"
echo ""
echo "   Atau mode auto-restart saat edit file:"
echo "   npm run dev"
echo ""
echo "🌐 BUKA DI BROWSER:"
echo "   http://localhost:3000"
echo ""
echo "👤 LOGIN ADMIN:"
echo "   Email   : (lihat file .env — ADMIN_EMAIL)"
echo "   Password: (lihat file .env — ADMIN_PASSWORD)"
echo ""
echo "📱 AKSES DARI HP LAIN (satu WiFi):"
echo "   1. Jalankan perintah ini untuk lihat IP:"
echo "      ifconfig | grep 'inet ' | grep -v 127.0.0.1"
echo "   2. Buka http://[IP_KAMU]:3000 di browser HP lain"
echo ""
echo "💡 TIPS:"
echo "   - Jangan tutup Termux saat server jalan"
echo "   - Tekan Ctrl+C untuk stop server"
echo "   - Edit file pakai Acode Editor"
echo "   - Jika error module: npm install"
echo "   - Database tersimpan di folder: data/"
echo ""
