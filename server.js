require('dotenv').config();
var express = require('express');
var http = require('http');
var { Server } = require('socket.io');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var path = require('path');
var fs = require('fs');
var { initializeDatabase } = require('./database');
var { initGameDatabase } = require('./game-database');

var app = express();
var server = http.createServer(app);
var io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var uploadDirs = ['public/uploads', 'public/uploads/posts', 'public/uploads/fotoprofil', 'public/uploads/attendance'];
uploadDirs.forEach(function (dir) {
  var fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

app.set('io', io);

var onlineUsers = new Map();

io.on('connection', function (socket) {
  socket.on('user_online', function (userId) {
    onlineUsers.set(userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
  socket.on('join_chat', function (data) {
    var roomId = [data.senderId, data.receiverId].sort().join('_');
    socket.join(roomId);
  });
  socket.on('send_message', function (data) {
    var roomId = [data.senderId, data.receiverId].sort().join('_');
    io.to(roomId).emit('new_message', data);
    var receiverSocket = onlineUsers.get(String(data.receiverId));
    if (receiverSocket) {
      io.to(receiverSocket).emit('notification', { title: 'Pesan Baru', message: data.senderName + ': ' + data.content, type: 'chat' });
    }
  });
  socket.on('typing', function (data) {
    var roomId = [data.senderId, data.receiverId].sort().join('_');
    socket.to(roomId).emit('user_typing', data);
  });
  socket.on('stop_typing', function (data) {
    var roomId = [data.senderId, data.receiverId].sort().join('_');
    socket.to(roomId).emit('user_stop_typing', data);
  });
  socket.on('disconnect', function () {
    for (var entry of onlineUsers.entries()) {
      if (entry[1] === socket.id) { onlineUsers.delete(entry[0]); break; }
    }
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

async function startServer() {
  try {
    console.log('⏳ Initializing database...');
    await initializeDatabase();
    await initGameDatabase();

    // Load routes AFTER database is ready
    // Sajikan Firebase config ke frontend (ambil dari .env, bukan hardcode di JS)
    app.get('/api/firebase-config', function(req, res) {
      res.json({
        apiKey:            process.env.FIREBASE_API_KEY            || '',
        authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || '',
        projectId:         process.env.FIREBASE_PROJECT_ID         || '',
        storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId:             process.env.FIREBASE_APP_ID             || ''
      });
    });

    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/posts', require('./routes/posts'));
    app.use('/api/attendance', require('./routes/attendance'));
    app.use('/api/chat', require('./routes/chat'));
    app.use('/api/news', require('./routes/news'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/game', require('./routes/game'));

    // SPA fallback - MUST be after API routes
    app.get('*', function (req, res) {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      var requestedFile = path.join(__dirname, 'public', req.path);
      if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
        return res.sendFile(requestedFile);
      }
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    var PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', function () {
      console.log('');
      console.log('🏕️  ═══════════════════════════════════════');
      console.log('🏕️   Pramuka SMPN 1 Leuwigoong');
      console.log('🏕️   http://localhost:' + PORT);
      console.log('🏕️   Node ' + process.version);
      console.log('🏕️  ═══════════════════════════════════════');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Start failed:', err);
    process.exit(1);
  }
}

startServer();