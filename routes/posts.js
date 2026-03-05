var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var { dbRun, dbGet, dbAll } = require('../database');
var { authenticateToken, requireAuth } = require('../middleware/auth');
var { v4: uuidv4 } = require('uuid');

var storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, path.join(__dirname, '..', 'public', 'uploads', 'posts')); },
  filename: function (req, file, cb) { cb(null, uuidv4() + path.extname(file.originalname)); }
});

var upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    var allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    var ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

router.get('/', authenticateToken, function (req, res) {
  try {
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 10;
    var category = req.query.category || '';
    var offset = (page - 1) * limit;

    var query = 'SELECT p.*, u.display_name as author_name, u.photo_url as author_photo, (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count FROM posts p JOIN users u ON p.user_id = u.id WHERE p.is_published = 1';
    var params = [];

    if (category) { query += ' AND p.category = ?'; params.push(category); }
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    var posts = dbAll(query, params);

    var countQuery = 'SELECT COUNT(*) as total FROM posts WHERE is_published = 1';
    var countParams = [];
    if (category) { countQuery += ' AND category = ?'; countParams.push(category); }
    var totalRow = dbGet(countQuery, countParams);
    var total = totalRow ? totalRow.total : 0;

    res.json({ posts: posts, pagination: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.get('/:id', authenticateToken, function (req, res) {
  try {
    var post = dbGet('SELECT p.*, u.display_name as author_name, u.photo_url as author_photo FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND p.is_published = 1', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

    var comments = dbAll('SELECT c.*, u.display_name, u.photo_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC', [req.params.id]);
    res.json({ post: post, comments: comments });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.post('/', requireAuth, upload.single('image'), function (req, res) {
  try {
    var title = req.body.title;
    var content = req.body.content;
    var category = req.body.category || 'blog';
    if (!title || !content) return res.status(400).json({ error: 'Judul dan konten harus diisi' });

    var imageUrl = req.file ? '/uploads/posts/' + req.file.filename : '';
    var result = dbRun('INSERT INTO posts (user_id, title, content, image_url, category) VALUES (?, ?, ?, ?, ?)', [req.user.id, title, content, imageUrl, category]);
    var post = dbGet('SELECT * FROM posts WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ message: 'Post berhasil dibuat', post: post });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.put('/:id', requireAuth, upload.single('image'), function (req, res) {
  try {
    var post = dbGet('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak memiliki akses' });

    var imageUrl = req.file ? '/uploads/posts/' + req.file.filename : post.image_url;
    dbRun('UPDATE posts SET title = ?, content = ?, image_url = ?, category = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
      [req.body.title || post.title, req.body.content || post.content, imageUrl, req.body.category || post.category, req.params.id]);

    var updated = dbGet('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post berhasil diupdate', post: updated });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.delete('/:id', requireAuth, function (req, res) {
  try {
    var post = dbGet('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak memiliki akses' });

    dbRun('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
    dbRun('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.post('/:id/comments', requireAuth, function (req, res) {
  try {
    if (!req.body.content) return res.status(400).json({ error: 'Komentar tidak boleh kosong' });
    var post = dbGet('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

    var result = dbRun('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [req.params.id, req.user.id, req.body.content]);

    if (post.user_id !== req.user.id) {
      dbRun('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
        [post.user_id, 'Komentar Baru', req.user.display_name + ' mengomentari postingan Anda', 'comment', '/posts.html?id=' + req.params.id]);
    }

    var comment = dbGet('SELECT c.*, u.display_name, u.photo_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Komentar ditambahkan', comment: comment });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

router.post('/:id/like', requireAuth, function (req, res) {
  try {
    dbRun('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    var post = dbGet('SELECT likes FROM posts WHERE id = ?', [req.params.id]);
    res.json({ likes: post ? post.likes : 0 });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

module.exports = router;