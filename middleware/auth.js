const jwt = require('jsonwebtoken');
const { dbGet } = require('../database');

function authenticateToken(req, res, next) {
  var token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    var user = dbGet(
      'SELECT id, uid, email, display_name, photo_url, role, regu, kelas FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    req.user = user || null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  var token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Login diperlukan untuk mengakses fitur ini' });
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    var user = dbGet(
      'SELECT id, uid, email, display_name, photo_url, role, regu, kelas FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid, silakan login ulang' });
  }
}

function requireAdmin(req, res, next) {
  var token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Login diperlukan' });
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    var user = dbGet(
      'SELECT id, uid, email, display_name, photo_url, role FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang bisa mengakses.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

module.exports = { authenticateToken, requireAuth, requireAdmin };