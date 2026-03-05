var express = require('express');
var router = express.Router();
var { dbRun, dbGet, dbAll } = require('../database');
var { requireAuth } = require('../middleware/auth');

router.get('/conversations', requireAuth, function (req, res) {
  try {
    var id = req.user.id;

    // Simpler query that works with sql.js
    var sent = dbAll('SELECT DISTINCT receiver_id as other_id FROM messages WHERE sender_id = ?', [id]);
    var received = dbAll('SELECT DISTINCT sender_id as other_id FROM messages WHERE receiver_id = ?', [id]);

    var userIds = {};
    (sent || []).forEach(function (r) { userIds[r.other_id] = true; });
    (received || []).forEach(function (r) { userIds[r.other_id] = true; });

    var conversations = [];
    Object.keys(userIds).forEach(function (otherId) {
      var oid = parseInt(otherId);
      var user = dbGet('SELECT id, display_name, photo_url, role FROM users WHERE id = ?', [oid]);
      if (!user) return;

      var lastMsg = dbGet(
        'SELECT content, created_at FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1',
        [id, oid, oid, id]
      );

      var unread = dbGet('SELECT COUNT(*) as c FROM messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [oid, id]);

      conversations.push({
        other_user_id: oid,
        display_name: user.display_name,
        photo_url: user.photo_url,
        role: user.role,
        last_message: lastMsg ? lastMsg.content : '',
        last_message_time: lastMsg ? lastMsg.created_at : '',
        unread_count: unread ? unread.c : 0
      });
    });

    // Sort by last message time
    conversations.sort(function (a, b) {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time) - new Date(a.last_message_time);
    });

    res.json({ conversations: conversations });
  } catch (err) {
    console.error('Conversations error:', err);
    res.json({ conversations: [] });
  }
});

router.get('/messages/:userId', requireAuth, function (req, res) {
  try {
    var otherId = parseInt(req.params.userId);
    var messages = dbAll(
      'SELECT m.*, s.display_name as sender_name, s.photo_url as sender_photo FROM messages m JOIN users s ON m.sender_id = s.id WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) ORDER BY m.created_at ASC LIMIT 200',
      [req.user.id, otherId, otherId, req.user.id]
    );

    dbRun('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [otherId, req.user.id]);

    var otherUser = dbGet('SELECT id, display_name, photo_url, role FROM users WHERE id = ?', [otherId]);

    res.json({ messages: messages || [], otherUser: otherUser });
  } catch (err) {
    console.error('Messages error:', err);
    res.json({ messages: [], otherUser: null });
  }
});

router.post('/messages', requireAuth, function (req, res) {
  try {
    var receiverId = req.body.receiverId;
    var content = req.body.content;
    if (!receiverId || !content) return res.status(400).json({ error: 'Data tidak lengkap' });

    var receiver = dbGet('SELECT id, display_name FROM users WHERE id = ? AND is_active = 1', [receiverId]);
    if (!receiver) return res.status(404).json({ error: 'User tidak ditemukan' });

    var result = dbRun('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [req.user.id, receiverId, content]);

    dbRun('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
      [receiverId, 'Pesan Baru', (req.user.display_name || 'User') + ': ' + content.substring(0, 50), 'chat', '/chat.html?user=' + req.user.id]);

    var message = dbGet('SELECT m.*, s.display_name as sender_name, s.photo_url as sender_photo FROM messages m JOIN users s ON m.sender_id = s.id WHERE m.id = ?', [result.lastInsertRowid]);

    var io = req.app.get('io');
    if (io) {
      var roomId = [req.user.id, receiverId].sort().join('_');
      io.to(roomId).emit('new_message', message);
    }

    res.status(201).json({ message: 'Pesan terkirim', data: message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Gagal mengirim pesan' });
  }
});

router.get('/users', requireAuth, function (req, res) {
  try {
    var users = dbAll('SELECT id, display_name, photo_url, role, regu, kelas FROM users WHERE id != ? AND is_active = 1 ORDER BY display_name ASC', [req.user.id]);
    res.json({ users: users || [] });
  } catch (err) {
    res.json({ users: [] });
  }
});

router.get('/unread', requireAuth, function (req, res) {
  try {
    var r = dbGet('SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND is_read = 0', [req.user.id]);
    res.json({ unread: r ? r.c : 0 });
  } catch (err) {
    res.json({ unread: 0 });
  }
});

router.get('/notifications', requireAuth, function (req, res) {
  try {
    var notifs = dbAll('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    var unread = dbGet('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ notifications: notifs || [], unreadCount: unread ? unread.c : 0 });
  } catch (err) {
    res.json({ notifications: [], unreadCount: 0 });
  }
});

router.put('/notifications/read', requireAuth, function (req, res) {
  try {
    dbRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'OK' });
  } catch (err) {
    res.json({ message: 'OK' });
  }
});

module.exports = router;