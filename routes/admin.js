var express = require('express');
var router = express.Router();
var { dbRun, dbGet, dbAll, saveDatabase } = require('../database');
var { requireAdmin } = require('../middleware/auth');
var ExcelJS = require('exceljs');
var PDFDocument = require('pdfkit');

router.get('/dashboard', requireAdmin, function (req, res) {
  try {
    var totalUsers = (dbGet('SELECT COUNT(*) as c FROM users WHERE is_active = 1', []) || {}).c || 0;
    var totalPosts = (dbGet('SELECT COUNT(*) as c FROM posts', []) || {}).c || 0;
    var totalSessions = (dbGet('SELECT COUNT(*) as c FROM attendance_sessions', []) || {}).c || 0;
    var totalMessages = (dbGet('SELECT COUNT(*) as c FROM messages', []) || {}).c || 0;
    var activeSessions = (dbGet('SELECT COUNT(*) as c FROM attendance_sessions WHERE is_active = 1', []) || {}).c || 0;

    var recentUsers = dbAll('SELECT id, display_name, email, role, regu, kelas, created_at FROM users ORDER BY created_at DESC LIMIT 10', []);
    var recentPosts = dbAll('SELECT p.*, u.display_name as author_name FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 10', []);
    var reguStats = dbAll("SELECT regu, COUNT(*) as count FROM users WHERE regu != '' AND is_active = 1 GROUP BY regu ORDER BY count DESC", []);
    var kelasStats = dbAll("SELECT kelas, COUNT(*) as count FROM users WHERE kelas != '' AND is_active = 1 GROUP BY kelas ORDER BY kelas ASC", []);

    res.json({ stats: { totalUsers: totalUsers, totalPosts: totalPosts, totalSessions: totalSessions, totalMessages: totalMessages, activeSessions: activeSessions }, recentUsers: recentUsers, recentPosts: recentPosts, reguStats: reguStats, kelasStats: kelasStats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/users', requireAdmin, function (req, res) {
  try {
    var search = req.query.search || '';
    var query = 'SELECT id, uid, email, display_name, photo_url, role, regu, kelas, no_hp, is_active, created_at FROM users WHERE 1=1';
    var params = [];
    if (search) { query += ' AND (display_name LIKE ? OR email LIKE ?)'; params.push('%' + search + '%', '%' + search + '%'); }
    query += ' ORDER BY created_at DESC LIMIT 50';
    var users = dbAll(query, params);
    res.json({ users: users, total: users.length });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/users/:id/role', requireAdmin, function (req, res) {
  try {
    if (!['admin', 'pembina', 'member'].includes(req.body.role)) return res.status(400).json({ error: 'Role tidak valid' });
    dbRun('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id]);
    res.json({ message: 'Role berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/users/:id/toggle', requireAdmin, function (req, res) {
  try {
    var user = dbGet('SELECT is_active FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    dbRun('UPDATE users SET is_active = ? WHERE id = ?', [user.is_active ? 0 : 1, req.params.id]);
    res.json({ message: user.is_active ? 'User dinonaktifkan' : 'User diaktifkan' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.delete('/users/:id', requireAdmin, function (req, res) {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    dbRun('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [req.params.id, req.params.id]);
    dbRun('DELETE FROM notifications WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM attendance WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM comments WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM posts WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/posts', requireAdmin, function (req, res) {
  try {
    var posts = dbAll('SELECT p.*, u.display_name as author_name FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC', []);
    res.json({ posts: posts });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/posts/:id/toggle', requireAdmin, function (req, res) {
  try {
    var post = dbGet('SELECT is_published FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });
    dbRun('UPDATE posts SET is_published = ? WHERE id = ?', [post.is_published ? 0 : 1, req.params.id]);
    res.json({ message: 'Status berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.delete('/posts/:id', requireAdmin, function (req, res) {
  try {
    dbRun('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
    dbRun('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/export/attendance/:sessionId', requireAdmin, async function (req, res) {
  try {
    var session = dbGet('SELECT * FROM attendance_sessions WHERE id = ?', [req.params.sessionId]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    var attendances = dbAll('SELECT a.*, u.display_name, u.regu, u.kelas, u.email FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.session_id = ? ORDER BY u.display_name ASC', [req.params.sessionId]);
    var allUsers = dbAll("SELECT id, display_name, regu, kelas, email FROM users WHERE role != 'admin' AND is_active = 1 ORDER BY display_name ASC", []);

    var workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pramuka SMPN 1 Leuwigoong';
    var sheet = workbook.addWorksheet('Absensi');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'DAFTAR HADIR PRAMUKA SMPN 1 LEUWIGOONG';
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1B5E20' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = session.name + ' - ' + session.date;
    sheet.getCell('A2').font = { size: 12, bold: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.addRow([]);

    var headerRow = sheet.addRow(['No', 'Nama', 'Email', 'Regu', 'Kelas', 'Status', 'Waktu']);
    headerRow.eachCell(function (cell) {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    var no = 1;
    allUsers.forEach(function (user) {
      var att = attendances.find(function (a) { return a.user_id === user.id; });
      var row = sheet.addRow([no++, user.display_name, user.email, user.regu || '-', user.kelas || '-', att ? 'HADIR' : 'TIDAK HADIR', att ? att.check_in_time : '-']);
      row.eachCell(function (cell, colNumber) {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (colNumber === 6) { cell.font = { color: { argb: att ? 'FF228B22' : 'FFFF0000' }, bold: true }; }
      });
    });

    sheet.addRow([]);
    sheet.addRow(['', 'Total Anggota:', allUsers.length]);
    sheet.addRow(['', 'Total Hadir:', attendances.length]);
    sheet.addRow(['', 'Total Tidak Hadir:', allUsers.length - attendances.length]);

    [5, 25, 30, 15, 12, 15, 22].forEach(function (w, i) { sheet.getColumn(i + 1).width = w; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Absensi_' + session.name.replace(/\s/g, '_') + '.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Gagal export' });
  }
});

router.get('/export/attendance-pdf/:sessionId', requireAdmin, function (req, res) {
  try {
    var session = dbGet('SELECT * FROM attendance_sessions WHERE id = ?', [req.params.sessionId]);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    var attendances = dbAll('SELECT a.*, u.display_name, u.regu, u.kelas FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.session_id = ? ORDER BY u.display_name ASC', [req.params.sessionId]);
    var allUsers = dbAll("SELECT id, display_name, regu, kelas FROM users WHERE role != 'admin' AND is_active = 1 ORDER BY display_name ASC", []);

    var doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Absensi_' + session.name.replace(/\s/g, '_') + '.pdf');
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('DAFTAR HADIR', { align: 'center' });
    doc.fontSize(14).text('PRAMUKA SMPN 1 LEUWIGOONG', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('Kegiatan: ' + session.name, { align: 'center' });
    doc.text('Tanggal: ' + session.date, { align: 'center' });
    doc.moveDown(1);

    var tableTop = doc.y;
    var colWidths = [30, 150, 80, 80, 80];
    var headers = ['No', 'Nama', 'Regu', 'Kelas', 'Status'];
    var xPos = 50;

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach(function (h, i) {
      doc.rect(xPos, tableTop, colWidths[i], 25).fillAndStroke('#1b5e20', '#1b5e20');
      doc.fillColor('#FFFFFF').text(h, xPos + 5, tableTop + 7, { width: colWidths[i] - 10, align: 'center' });
      xPos += colWidths[i];
    });

    doc.fillColor('#000000');
    var yPos = tableTop + 25;
    var no = 1;
    doc.font('Helvetica').fontSize(9);

    allUsers.forEach(function (user) {
      if (yPos > 750) { doc.addPage(); yPos = 50; }
      var att = attendances.find(function (a) { return a.user_id === user.id; });
      var rowData = [no++, user.display_name, user.regu || '-', user.kelas || '-', att ? 'HADIR' : 'TIDAK HADIR'];
      xPos = 50;
      var bg = no % 2 === 0 ? '#f5f5f5' : '#ffffff';
      rowData.forEach(function (data, i) {
        doc.rect(xPos, yPos, colWidths[i], 20).fillAndStroke(bg, '#cccccc');
        var tc = (i === 4 && !att) ? '#FF0000' : (i === 4 && att) ? '#228B22' : '#000000';
        doc.fillColor(tc).text(String(data), xPos + 3, yPos + 5, { width: colWidths[i] - 6, align: i === 0 ? 'center' : 'left' });
        xPos += colWidths[i];
      });
      yPos += 20;
    });

    doc.fillColor('#000000');
    yPos += 20;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Total Anggota: ' + allUsers.length, 50, yPos);
    doc.text('Total Hadir: ' + attendances.length, 50, yPos + 18);
    doc.text('Total Tidak Hadir: ' + (allUsers.length - attendances.length), 50, yPos + 36);

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Gagal export PDF' });
  }
});

router.get('/export/members', requireAdmin, async function (req, res) {
  try {
    var users = dbAll('SELECT id, display_name, email, role, regu, kelas, no_hp, alamat, created_at FROM users WHERE is_active = 1 ORDER BY display_name ASC', []);
    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet('Anggota');

    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = 'DATA ANGGOTA PRAMUKA SMPN 1 LEUWIGOONG';
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1B5E20' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.addRow([]);

    var hdr = sheet.addRow(['No', 'Nama', 'Email', 'Role', 'Regu', 'Kelas', 'No HP', 'Alamat']);
    hdr.eachCell(function (cell) {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    users.forEach(function (u, i) {
      var row = sheet.addRow([i + 1, u.display_name, u.email, u.role, u.regu || '-', u.kelas || '-', u.no_hp || '-', u.alamat || '-']);
      row.eachCell(function (cell) { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
    });

    [5, 25, 30, 12, 15, 12, 15, 30].forEach(function (w, i) { sheet.getColumn(i + 1).width = w; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Anggota_Pramuka.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Gagal export' });
  }
});

router.get('/settings', requireAdmin, function (req, res) {
  try {
    var settings = dbAll('SELECT * FROM settings', []);
    var obj = {};
    settings.forEach(function (s) { obj[s.key] = s.value; });
    res.json({ settings: obj });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/settings', requireAdmin, function (req, res) {
  try {
    var items = req.body.settings;
    Object.keys(items).forEach(function (key) {
      dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, items[key]]);
    });
    res.json({ message: 'Pengaturan disimpan' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.post('/broadcast', requireAdmin, function (req, res) {
  try {
    var title = req.body.title;
    var message = req.body.message;
    var type = req.body.type || 'info';
    if (!title || !message) return res.status(400).json({ error: 'Judul dan pesan harus diisi' });

    var users = dbAll('SELECT id FROM users WHERE is_active = 1', []);
    users.forEach(function (user) {
      dbRun('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', [user.id, title, message, type]);
    });

    var io = req.app.get('io');
    if (io) io.emit('notification', { title: title, message: message, type: type });

    res.json({ message: 'Broadcast dikirim ke ' + users.length + ' user' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

module.exports = router;