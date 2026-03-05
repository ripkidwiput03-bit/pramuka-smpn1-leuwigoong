var express = require('express');
var router = express.Router();
var QRCode = require('qrcode');
var { dbRun, dbGet, dbAll } = require('../database');
var { requireAuth, requireAdmin } = require('../middleware/auth');
var { v4: uuidv4 } = require('uuid');

/* ─────────────────────────────────────────────
   SESSIONS
───────────────────────────────────────────── */

router.post('/sessions', requireAdmin, async function (req, res) {
  try {
    var name = req.body.name;
    var description = req.body.description || '';
    var date = req.body.date;
    var expiresInHours = req.body.expiresInHours || 24;
    if (!name || !date) return res.status(400).json({ error: 'Nama sesi dan tanggal harus diisi' });
    var sessionId = uuidv4();
    var expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
    var qrData = JSON.stringify({ sessionId, name, date });
    var qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 400, margin: 2, color: { dark: '#1b5e20', light: '#FFFFFF' } });
    dbRun('INSERT INTO attendance_sessions (id, name, description, qr_code, created_by, date, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sessionId, name, description, qrCodeDataUrl, req.user.id, date, expiresAt]);
    res.status(201).json({ message: 'Sesi absensi berhasil dibuat', session: { id: sessionId, name, description, date, qr_code: qrCodeDataUrl, expires_at: expiresAt } });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/sessions', requireAuth, function (req, res) {
  try {
    var sessions = dbAll(
      `SELECT s.*, u.display_name as created_by_name,
        (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status='hadir') as total_hadir,
        (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status='izin') as total_izin,
        (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status='sakit') as total_sakit,
        (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status='alpha') as total_alpha
      FROM attendance_sessions s JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC`, []);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/sessions/:id', requireAuth, function (req, res) {
  try {
    var session = dbGet('SELECT s.*, u.display_name as created_by_name FROM attendance_sessions s JOIN users u ON s.created_by = u.id WHERE s.id = ?', [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    var attendances = dbAll('SELECT a.*, u.display_name, u.regu, u.kelas, u.photo_url FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.session_id = ? ORDER BY a.check_in_time ASC', [req.params.id]);
    var totalAnggota = (dbGet("SELECT COUNT(*) as c FROM users WHERE is_active = 1 AND role != 'admin'", []) || {}).c || 0;
    res.json({ session, attendances, totalAnggota });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/sessions/:id', requireAdmin, function (req, res) {
  try {
    var session = dbGet('SELECT * FROM attendance_sessions WHERE id = ?', [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    dbRun('UPDATE attendance_sessions SET name=?, description=?, date=? WHERE id=?',
      [req.body.name || session.name, req.body.description !== undefined ? req.body.description : session.description, req.body.date || session.date, req.params.id]);
    res.json({ message: 'Sesi berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/sessions/:id/close', requireAdmin, function (req, res) {
  try {
    dbRun('UPDATE attendance_sessions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sesi absensi berhasil ditutup' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/sessions/:id/reopen', requireAdmin, function (req, res) {
  try {
    var expiresAt = new Date(Date.now() + ((req.body.expiresInHours || 24) * 60 * 60 * 1000)).toISOString();
    dbRun('UPDATE attendance_sessions SET is_active = 1, expires_at = ? WHERE id = ?', [expiresAt, req.params.id]);
    res.json({ message: 'Sesi absensi dibuka kembali' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.delete('/sessions/:id', requireAdmin, function (req, res) {
  try {
    if (!dbGet('SELECT id FROM attendance_sessions WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    dbRun('DELETE FROM attendance WHERE session_id = ?', [req.params.id]);
    dbRun('DELETE FROM attendance_sessions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sesi dan data absensi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/* ─────────────────────────────────────────────
   CHECK-IN
───────────────────────────────────────────── */

router.post('/check-in', requireAuth, function (req, res) {
  try {
    var sessionId = req.body.sessionId;
    if (!sessionId) return res.status(400).json({ error: 'Session ID diperlukan' });
    var session = dbGet('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) return res.status(404).json({ error: 'Sesi absensi tidak ditemukan' });
    if (!session.is_active) return res.status(400).json({ error: 'Sesi absensi sudah ditutup' });
    if (session.expires_at && new Date(session.expires_at) < new Date()) return res.status(400).json({ error: 'Sesi absensi sudah kadaluarsa' });
    if (dbGet('SELECT id FROM attendance WHERE user_id = ? AND session_id = ?', [req.user.id, sessionId])) return res.status(400).json({ error: 'Anda sudah absen di sesi ini' });
    dbRun('INSERT INTO attendance (user_id, session_id, session_name, status, method, note) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, sessionId, session.name, 'hadir', req.body.method || 'qr', req.body.note || '']);
    res.json({ message: 'Absensi berhasil! Terima kasih sudah hadir. 🏕️' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Input manual 1 anggota oleh admin (hadir/izin/sakit/alpha)
router.post('/manual', requireAdmin, function (req, res) {
  try {
    var b = req.body;
    var validStatus = ['hadir', 'izin', 'sakit', 'alpha'];
    if (!b.sessionId || !b.userId) return res.status(400).json({ error: 'sessionId dan userId diperlukan' });
    if (b.status && !validStatus.includes(b.status)) return res.status(400).json({ error: 'Status tidak valid' });
    var session = dbGet('SELECT * FROM attendance_sessions WHERE id = ?', [b.sessionId]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    var user = dbGet('SELECT id, display_name FROM users WHERE id = ?', [b.userId]);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    var existing = dbGet('SELECT id FROM attendance WHERE user_id = ? AND session_id = ?', [b.userId, b.sessionId]);
    if (existing) {
      dbRun('UPDATE attendance SET status=?, note=?, method=? WHERE id=?', [b.status || 'hadir', b.note || '', 'admin', existing.id]);
    } else {
      dbRun('INSERT INTO attendance (user_id, session_id, session_name, status, method, note) VALUES (?, ?, ?, ?, ?, ?)',
        [b.userId, b.sessionId, session.name, b.status || 'hadir', 'admin', b.note || '']);
    }
    res.json({ message: 'Absensi ' + user.display_name + ' berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Input massal semua anggota sekaligus (admin)
router.post('/manual/bulk', requireAdmin, function (req, res) {
  try {
    var sessionId = req.body.sessionId;
    var entries = req.body.entries;
    if (!sessionId || !Array.isArray(entries)) return res.status(400).json({ error: 'sessionId dan entries diperlukan' });
    var session = dbGet('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    var validStatus = ['hadir', 'izin', 'sakit', 'alpha'];
    var count = 0;
    entries.forEach(function (entry) {
      if (!entry.userId) return;
      var status = validStatus.includes(entry.status) ? entry.status : 'hadir';
      var existing = dbGet('SELECT id FROM attendance WHERE user_id = ? AND session_id = ?', [entry.userId, sessionId]);
      if (existing) {
        dbRun('UPDATE attendance SET status=?, note=?, method=? WHERE id=?', [status, entry.note || '', 'admin', existing.id]);
      } else {
        dbRun('INSERT INTO attendance (user_id, session_id, session_name, status, method, note) VALUES (?, ?, ?, ?, ?, ?)',
          [entry.userId, sessionId, session.name, status, 'admin', entry.note || '']);
      }
      count++;
    });
    res.json({ message: count + ' data absensi berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Update 1 record absensi (admin)
router.put('/record/:id', requireAdmin, function (req, res) {
  try {
    var validStatus = ['hadir', 'izin', 'sakit', 'alpha'];
    if (!dbGet('SELECT id FROM attendance WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Data tidak ditemukan' });
    if (req.body.status && !validStatus.includes(req.body.status)) return res.status(400).json({ error: 'Status tidak valid' });
    dbRun('UPDATE attendance SET status=COALESCE(?,status), note=COALESCE(?,note) WHERE id=?',
      [req.body.status || null, req.body.note !== undefined ? req.body.note : null, req.params.id]);
    res.json({ message: 'Data absensi berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Hapus 1 record absensi (admin)
router.delete('/record/:id', requireAdmin, function (req, res) {
  try {
    if (!dbGet('SELECT id FROM attendance WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Data tidak ditemukan' });
    dbRun('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Data absensi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/* ─────────────────────────────────────────────
   STATISTIK & RIWAYAT
───────────────────────────────────────────── */

router.get('/my-history', requireAuth, function (req, res) {
  try {
    var history = dbAll(
      `SELECT a.*, s.description as session_description
       FROM attendance a LEFT JOIN attendance_sessions s ON a.session_id = s.id
       WHERE a.user_id = ? ORDER BY a.check_in_time DESC`, [req.user.id]);
    var totalSesi = (dbGet('SELECT COUNT(*) as c FROM attendance_sessions', []) || {}).c || 0;
    var totalHadir = history.filter(function(a) { return a.status === 'hadir'; }).length;
    var totalIzin  = history.filter(function(a) { return a.status === 'izin';  }).length;
    var totalSakit = history.filter(function(a) { return a.status === 'sakit'; }).length;
    var totalAlpha = history.filter(function(a) { return a.status === 'alpha'; }).length;
    res.json({ history, stats: { totalSesi, totalHadir, totalIzin, totalSakit, totalAlpha,
      persentase: totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 0 } });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Rekap semua anggota (admin)
router.get('/stats/all', requireAdmin, function (req, res) {
  try {
    var totalSesi = (dbGet('SELECT COUNT(*) as c FROM attendance_sessions', []) || {}).c || 0;
    var members = dbAll(
      `SELECT u.id, u.display_name, u.regu, u.kelas, u.photo_url,
        (SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id AND a.status='hadir') as hadir,
        (SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id AND a.status='izin')  as izin,
        (SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id AND a.status='sakit') as sakit,
        (SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id AND a.status='alpha') as alpha
      FROM users u WHERE u.is_active=1 ORDER BY u.regu ASC, u.display_name ASC`, []);
    res.json({ members: members.map(function(m) {
      return Object.assign({}, m, { totalSesi, persentase: totalSesi > 0 ? Math.round((m.hadir / totalSesi) * 100) : 0 });
    }), totalSesi });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Rekap per regu (admin)
router.get('/stats/regu', requireAdmin, function (req, res) {
  try {
    var reguStats = dbAll(
      `SELECT u.regu,
        COUNT(DISTINCT u.id) as total_anggota,
        COUNT(CASE WHEN a.status='hadir' THEN 1 END) as total_hadir,
        COUNT(CASE WHEN a.status='izin'  THEN 1 END) as total_izin,
        COUNT(CASE WHEN a.status='sakit' THEN 1 END) as total_sakit,
        COUNT(CASE WHEN a.status='alpha' THEN 1 END) as total_alpha
      FROM users u LEFT JOIN attendance a ON u.id=a.user_id
      WHERE u.is_active=1 AND u.regu!='' GROUP BY u.regu ORDER BY u.regu ASC`, []);
    res.json({ reguStats });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// Anggota yang belum absen di sesi tertentu (admin)
router.get('/sessions/:id/absent', requireAdmin, function (req, res) {
  try {
    var session = dbGet('SELECT id, name FROM attendance_sessions WHERE id = ?', [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    var absentMembers = dbAll(
      `SELECT u.id, u.display_name, u.regu, u.kelas FROM users u
       WHERE u.is_active=1 AND u.id NOT IN (SELECT user_id FROM attendance WHERE session_id=?)
       ORDER BY u.regu ASC, u.display_name ASC`, [req.params.id]);
    res.json({ session, absentMembers });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

module.exports = router;
