var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var { dbRun, dbGet, dbAll } = require('../database');
var { authenticateToken, requireAuth } = require('../middleware/auth');
var { v4: uuidv4 } = require('uuid');

// Multer config untuk upload foto profil
var profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    var dir = path.join(__dirname, '../public/uploads/profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'profile-' + req.user.id + '-' + Date.now() + ext);
  }
});

var uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // max 3MB
  fileFilter: function (req, file, cb) {
    var allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    var ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan (jpg, png, webp)'));
    }
  }
});

router.post('/register', function (req, res) {
  try {
    var body = req.body;
    var email = body.email;
    var password = body.password;
    var displayName = body.displayName;
    var regu = body.regu || '';
    var kelas = body.kelas || '';

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, dan nama harus diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    var existing = dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    var hashed = bcrypt.hashSync(password, 10);
    var uid = 'local-' + uuidv4();

    var result = dbRun(
      'INSERT INTO users (uid, email, password, display_name, regu, kelas, auth_provider) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uid, email, hashed, displayName, regu, kelas, 'local']
    );

    var token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    var user = dbGet('SELECT id, uid, email, display_name, photo_url, role, regu, kelas FROM users WHERE id = ?', [result.lastInsertRowid]);

    res.cookie('token', token, { httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ message: 'Registrasi berhasil!', token: token, user: user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
  }
});

router.post('/login', function (req, res) {
  try {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    var user = dbGet('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    if (!user.password) {
      return res.status(401).json({ error: 'Akun ini menggunakan Google login.' });
    }

    var valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    var token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({
      message: 'Login berhasil!',
      token: token,
      user: {
        id: user.id, uid: user.uid, email: user.email,
        display_name: user.display_name, photo_url: user.photo_url,
        role: user.role, regu: user.regu, kelas: user.kelas
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
});

router.post('/firebase-login', function (req, res) {
  try {
    var body = req.body;
    var uid = body.uid;
    var email = body.email;
    var displayName = body.displayName;
    var photoURL = body.photoURL;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Data Firebase tidak lengkap' });
    }

    var user = dbGet('SELECT * FROM users WHERE email = ? OR uid = ?', [email, uid]);

    if (!user) {
      var result = dbRun(
        'INSERT INTO users (uid, email, display_name, photo_url, auth_provider) VALUES (?, ?, ?, ?, ?)',
        [uid, email, displayName || email.split('@')[0], photoURL || '', 'google']
      );
      user = dbGet('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
    } else {
      dbRun(
        'UPDATE users SET uid = ?, photo_url = COALESCE(NULLIF(?, \'\'), photo_url), updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
        [uid, photoURL || '', user.id]
      );
      user = dbGet('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    var token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({
      message: 'Login berhasil!',
      token: token,
      user: {
        id: user.id, uid: user.uid, email: user.email,
        display_name: user.display_name, photo_url: user.photo_url,
        role: user.role, regu: user.regu, kelas: user.kelas
      }
    });
  } catch (err) {
    console.error('Firebase login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/me', requireAuth, function (req, res) {
  try {
    var user = dbGet(
      'SELECT id, uid, email, display_name, photo_url, role, regu, kelas, no_hp, alamat, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: user });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/profile', requireAuth, function (req, res) {
  try {
    var b = req.body;
    dbRun(
      "UPDATE users SET display_name = COALESCE(?,display_name), regu = COALESCE(?,regu), kelas = COALESCE(?,kelas), no_hp = COALESCE(?,no_hp), alamat = COALESCE(?,alamat), updated_at = datetime('now','localtime') WHERE id = ?",
      [b.displayName || null, b.regu || null, b.kelas || null, b.noHp || null, b.alamat || null, req.user.id]
    );
    var user = dbGet('SELECT id, uid, email, display_name, photo_url, role, regu, kelas, no_hp, alamat FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profil berhasil diupdate', user: user });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/change-password', requireAuth, function (req, res) {
  try {
    var user = dbGet('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (user && user.password) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ error: 'Password lama harus diisi' });
      }
      if (!bcrypt.compareSync(req.body.currentPassword, user.password)) {
        return res.status(401).json({ error: 'Password lama salah' });
      }
    }
    if (!req.body.newPassword || req.body.newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }
    var hashed = bcrypt.hashSync(req.body.newPassword, 10);
    dbRun('UPDATE users SET password = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.post('/logout', function (req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil' });
});

// Upload foto profil
router.post('/upload-photo', requireAuth, function (req, res) {
  uploadProfile.single('photo')(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Ukuran file maksimal 3MB' });
      return res.status(400).json({ error: err.message || 'Upload gagal' });
    }
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diupload' });

    var photoUrl = '/uploads/profiles/' + req.file.filename;

    // Hapus foto lama jika bukan dari Google/URL eksternal
    try {
      var oldUser = dbGet('SELECT photo_url FROM users WHERE id = ?', [req.user.id]);
      if (oldUser && oldUser.photo_url && oldUser.photo_url.startsWith('/uploads/')) {
        var oldPath = path.join(__dirname, '../public', oldUser.photo_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } catch (e) { /* ignore */ }

    dbRun("UPDATE users SET photo_url = ?, updated_at = datetime('now','localtime') WHERE id = ?", [photoUrl, req.user.id]);
    var user = dbGet('SELECT id, uid, email, display_name, photo_url, role, regu, kelas FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Foto profil berhasil diupload', photoUrl, user });
  });
});

// Hapus foto profil (kembali ke avatar default)
router.delete('/photo', requireAuth, function (req, res) {
  try {
    var user = dbGet('SELECT photo_url FROM users WHERE id = ?', [req.user.id]);
    if (user && user.photo_url && user.photo_url.startsWith('/uploads/')) {
      var filePath = path.join(__dirname, '../public', user.photo_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    dbRun("UPDATE users SET photo_url = '', updated_at = datetime('now','localtime') WHERE id = ?", [req.user.id]);
    res.json({ message: 'Foto profil berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

module.exports = router;