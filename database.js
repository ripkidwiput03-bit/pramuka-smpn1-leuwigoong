var initSqlJs = require('sql.js');
var path = require('path');
var fs = require('fs');
var bcrypt = require('bcryptjs');

var dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

var DB_PATH = path.join(dataDir, 'pramuka.db');
var db = null;
var isReady = false;

function saveDatabase() {
  if (db) {
    try {
      var data = db.export();
      var buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (e) {
      console.error('Save DB error:', e.message);
    }
  }
}

setInterval(saveDatabase, 15000);

process.on('exit', saveDatabase);
process.on('SIGINT', function () { saveDatabase(); process.exit(0); });
process.on('SIGTERM', function () { saveDatabase(); process.exit(0); });

async function initializeDatabase() {
  var SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      var fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('✅ Database loaded from file');
    } catch (e) {
      console.log('⚠️ DB file corrupt, creating new');
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('✅ New database created');
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT UNIQUE, email TEXT UNIQUE NOT NULL, password TEXT, display_name TEXT NOT NULL, photo_url TEXT DEFAULT '', role TEXT DEFAULT 'member', regu TEXT DEFAULT '', kelas TEXT DEFAULT '', no_hp TEXT DEFAULT '', alamat TEXT DEFAULT '', auth_provider TEXT DEFAULT 'local', is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')))");

  db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, image_url TEXT DEFAULT '', category TEXT DEFAULT 'blog', is_published INTEGER DEFAULT 1, likes INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')))");

  db.run("CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now','localtime')))");

  db.run("CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, session_id TEXT NOT NULL, session_name TEXT NOT NULL, status TEXT DEFAULT 'hadir', check_in_time TEXT DEFAULT (datetime('now','localtime')), method TEXT DEFAULT 'manual', note TEXT DEFAULT '')");

  db.run("CREATE TABLE IF NOT EXISTS attendance_sessions (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', qr_code TEXT DEFAULT '', created_by INTEGER NOT NULL, is_active INTEGER DEFAULT 1, date TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now','localtime')), expires_at TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL, content TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')))");

  db.run("CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0, link TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now','localtime')))");

  db.run("CREATE TABLE IF NOT EXISTS news_cache (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '', url TEXT NOT NULL, image_url TEXT DEFAULT '', source TEXT DEFAULT '', published_at TEXT DEFAULT '', cached_at TEXT DEFAULT (datetime('now','localtime')))");

  db.run("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");

  var adminEmail = process.env.ADMIN_EMAIL || 'ripkidwiput03@gmail.com';
  var adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  var adminCheck = dbGet('SELECT id FROM users WHERE email = ?', [adminEmail]);

  if (!adminCheck) {
    var hashed = bcrypt.hashSync(adminPassword, 10);
    dbRun('INSERT INTO users (uid, email, password, display_name, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin-' + Date.now(), adminEmail, hashed, 'Admin Pramuka', 'admin', 'local']);
    console.log('✅ Admin account created');
  }

  var defaults = [
    ['site_name', 'Pramuka SMPN 1 Leuwigoong'],
    ['site_description', 'Website Resmi Gudep Pramuka SMPN 1 Leuwigoong']
  ];
  defaults.forEach(function (d) {
    dbRun('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [d[0], d[1]]);
  });

  saveDatabase();
  isReady = true;
  console.log('✅ Database initialized successfully');
}

function dbRun(sql, params) {
  if (!db) throw new Error('Database not initialized');
  try {
    if (params && params.length > 0) {
      db.run(sql, params);
    } else {
      db.run(sql);
    }
    var lastId = 0;
    var changes = 0;
    try {
      var r = db.exec('SELECT last_insert_rowid() as id');
      if (r.length > 0 && r[0].values.length > 0) {
        lastId = r[0].values[0][0];
      }
    } catch (e) {}
    try {
      changes = db.getRowsModified();
    } catch (e) {}
    return { lastInsertRowid: lastId, changes: changes };
  } catch (err) {
    console.error('DB Run Error:', err.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
}

function dbGet(sql, params) {
  if (!db) return null;
  try {
    var results;
    if (params && params.length > 0) {
      results = db.exec(sql, params);
    } else {
      results = db.exec(sql);
    }
    if (results.length === 0) return null;
    var columns = results[0].columns;
    var values = results[0].values;
    if (values.length === 0) return null;
    var row = {};
    for (var i = 0; i < columns.length; i++) {
      row[columns[i]] = values[0][i];
    }
    return row;
  } catch (err) {
    console.error('DB Get Error:', err.message);
    console.error('SQL:', sql);
    return null;
  }
}

function dbAll(sql, params) {
  if (!db) return [];
  try {
    var results;
    if (params && params.length > 0) {
      results = db.exec(sql, params);
    } else {
      results = db.exec(sql);
    }
    if (results.length === 0) return [];
    var columns = results[0].columns;
    var values = results[0].values;
    var rows = [];
    for (var v = 0; v < values.length; v++) {
      var row = {};
      for (var c = 0; c < columns.length; c++) {
        row[columns[c]] = values[v][c];
      }
      rows.push(row);
    }
    return rows;
  } catch (err) {
    console.error('DB All Error:', err.message);
    console.error('SQL:', sql);
    return [];
  }
}

function getIsReady() {
  return isReady;
}

module.exports = { initializeDatabase, dbRun, dbGet, dbAll, saveDatabase, getIsReady };