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
echo "   NPM version: $(npm -v 2>/dev/null || echo 'not found')"
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

# ---- STEP 4: Install Git (optional) ----
echo "📦 [4/8] Installing Git..."
pkg install git -y 2>/dev/null
echo "✅ Git installed"
echo ""

# ---- STEP 5: Create Directories ----
echo "📁 [5/8] Creating project directories..."
mkdir -p data
mkdir -p public/uploads/posts
mkdir -p public/uploads/profiles
mkdir -p public/uploads/attendance
mkdir -p public/css
mkdir -p public/js
mkdir -p public/images
mkdir -p routes
mkdir -p middleware
echo "✅ Directories created"
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

# Install non-native deps first
npm install express socket.io bcryptjs jsonwebtoken multer dotenv cors qrcode exceljs pdfkit node-fetch@2 cookie-parser uuid --save 2>&1 | tail -3
echo ""

# Install better-sqlite3 with build flags
echo "   Installing better-sqlite3 (native module)..."
npm install better-sqlite3 --build-from-source 2>&1 | tail -5

# If better-sqlite3 fails, try alternative
if [ $? -ne 0 ]; then
  echo "⚠️  better-sqlite3 failed, trying alternative install..."
  CFLAGS="-I$PREFIX/include" CXXFLAGS="-I$PREFIX/include" LDFLAGS="-L$PREFIX/lib" npm install better-sqlite3 --build-from-source 2>&1 | tail -5

  if [ $? -ne 0 ]; then
    echo "⚠️  Trying older compatible version..."
    npm install better-sqlite3@9.0.0 --build-from-source 2>&1 | tail -5

    if [ $? -ne 0 ]; then
      echo "⚠️  Trying with prebuild..."
      npm install better-sqlite3@9.4.3 2>&1 | tail -5
    fi
  fi
fi

# Install dev dependency
npm install nodemon --save-dev 2>/dev/null

echo ""
echo "✅ Dependencies installed"
echo ""

# ---- STEP 8: Verify Installation ----
echo "🔍 [8/8] Verifying installation..."
echo ""

ERRORS=0

# Check node
if command -v node &> /dev/null; then
  echo "   ✅ Node.js: $(node -v)"
else
  echo "   ❌ Node.js: NOT FOUND"
  ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
  echo "   ✅ NPM: $(npm -v)"
else
  echo "   ❌ NPM: NOT FOUND"
  ERRORS=$((ERRORS + 1))
fi

# Check critical modules
for MODULE in express socket.io better-sqlite3 bcryptjs jsonwebtoken qrcode exceljs pdfkit; do
  if node -e "require('$MODULE')" 2>/dev/null; then
    echo "   ✅ $MODULE: OK"
  else
    echo "   ❌ $MODULE: FAILED"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""

# Check if server.js exists
if [ -f "server.js" ]; then
  echo "   ✅ server.js: Found"
else
  echo "   ⚠️  server.js: Not found (buat dulu pakai Acode)"
fi

echo ""
echo "============================================="

if [ $ERRORS -eq 0 ]; then
  echo "🎉 SETUP BERHASIL! Semua OK!"
else
  echo "⚠️  Ada $ERRORS module yang gagal."
  echo "   Coba jalankan ulang: bash setup.sh"
fi

echo "============================================="
echo ""
echo "🚀 CARA MENJALANKAN:"
echo "   node server.js"
echo ""
echo "🌐 BUKA DI BROWSER:"
echo "   http://localhost:3000"
echo ""
echo "👤 LOGIN ADMIN:"
echo "   Email   : ripkidwiput03@gmail.com"
echo "   Password: admin123"
echo ""
echo "📱 AKSES DARI HP LAIN (satu WiFi):"
echo "   1. Install Termux:API lalu jalankan:"
echo "      pkg install termux-api -y"
echo "      ifconfig | grep inet"
echo "   2. Buka http://[IP_KAMU]:3000"
echo ""
echo "💡 TIPS:"
echo "   - Jangan tutup Termux saat server jalan"
echo "   - Tekan Ctrl+C untuk stop server"
echo "   - Edit file pakai Acode Editor"
echo "   - Jika error, jalankan: npm install"
echo ""