// ══════════════════════════════════════════════════════════════
//  GAME DATABASE — game.db (terpisah dari pramuka.db)
// ══════════════════════════════════════════════════════════════
var initSqlJs = require('sql.js');
var path = require('path');
var fs = require('fs');

var dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

var DB_PATH = path.join(dataDir, 'game.db');
var gdb = null;
var isReady = false;

// ── Save ke file ────────────────────────────────────────────
function saveGameDB() {
  if (!gdb) return;
  try {
    var data = gdb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) { console.error('[GameDB] Save error:', e.message); }
}

setInterval(saveGameDB, 10000);
process.on('exit', saveGameDB);
process.on('SIGINT', function() { saveGameDB(); process.exit(0); });
process.on('SIGTERM', function() { saveGameDB(); process.exit(0); });

// ── Level config ────────────────────────────────────────────
var LEVELS = [
  { level: 1,  name: '🪵 Kayu',        minXP: 0     },
  { level: 2,  name: '🪨 Batu',         minXP: 150   },
  { level: 3,  name: '🥉 Perunggu',     minXP: 400   },
  { level: 4,  name: '⚔️ Besi',         minXP: 800   },
  { level: 5,  name: '🥈 Perak',        minXP: 1500  },
  { level: 6,  name: '🏅 Emas',         minXP: 2500  },
  { level: 7,  name: '💎 Safir',        minXP: 4000  },
  { level: 8,  name: '🔮 Zamrud',       minXP: 6000  },
  { level: 9,  name: '💠 Berlian',      minXP: 9000  },
  { level: 10, name: '👑 Grand Master', minXP: 13000 }
];

function getLevelInfo(xp) {
  var current = LEVELS[0];
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) { current = LEVELS[i]; break; }
  }
  var nextLevel = LEVELS.find(function(l) { return l.level === current.level + 1; });
  var progress = nextLevel
    ? Math.round(((xp - current.minXP) / (nextLevel.minXP - current.minXP)) * 100)
    : 100;
  return {
    level: current.level, name: current.name, xp: xp,
    nextXP: nextLevel ? nextLevel.minXP : null,
    nextName: nextLevel ? nextLevel.name : null,
    progress: Math.min(progress, 100),
    xpToNext: nextLevel ? nextLevel.minXP - xp : 0
  };
}

// ── Init ────────────────────────────────────────────────────
async function initGameDatabase() {
  var SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      var buf = fs.readFileSync(DB_PATH);
      gdb = new SQL.Database(buf);
      console.log('🎮 Game DB loaded from file');
    } catch (e) {
      console.log('⚠️  Game DB corrupt, creating new');
      gdb = new SQL.Database();
    }
  } else {
    gdb = new SQL.Database();
    console.log('🎮 New Game DB created');
  }

  gdb.run('PRAGMA foreign_keys = ON');

  // Players — satu row per user
  gdb.run(`CREATE TABLE IF NOT EXISTS players (
    user_id    INTEGER PRIMARY KEY,
    username   TEXT NOT NULL,
    total_xp   INTEGER DEFAULT 0,
    level      INTEGER DEFAULT 1,
    level_name TEXT DEFAULT 'Siaga',
    coins      INTEGER DEFAULT 0,
    streak     INTEGER DEFAULT 0,
    last_played TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // Riwayat tiap sesi game
  gdb.run(`CREATE TABLE IF NOT EXISTS game_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    game_type  TEXT NOT NULL,
    score      INTEGER DEFAULT 0,
    xp_earned  INTEGER DEFAULT 0,
    correct    INTEGER DEFAULT 0,
    total      INTEGER DEFAULT 0,
    duration   INTEGER DEFAULT 0,
    played_at  TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // Rekap best score per game per user
  gdb.run(`CREATE TABLE IF NOT EXISTS best_scores (
    user_id   INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    best_score INTEGER DEFAULT 0,
    best_xp    INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, game_type)
  )`);

  // Achievements
  gdb.run(`CREATE TABLE IF NOT EXISTS achievements (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    code        TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    earned_at   TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, code)
  )`);

  saveGameDB();
  isReady = true;
  console.log('✅ Game DB initialized');
}

// ── Query helpers ───────────────────────────────────────────
function gRun(sql, params) {
  if (!gdb) throw new Error('Game DB not ready');
  try {
    if (params && params.length) gdb.run(sql, params); else gdb.run(sql);
    var lastId = 0, changes = 0;
    try { var r = gdb.exec('SELECT last_insert_rowid() as id'); if (r.length) lastId = r[0].values[0][0]; } catch(e){}
    try { changes = gdb.getRowsModified(); } catch(e){}
    return { lastInsertRowid: lastId, changes };
  } catch (err) {
    console.error('[GameDB] Run Error:', err.message, '\nSQL:', sql);
    throw err;
  }
}

function gGet(sql, params) {
  if (!gdb) return null;
  try {
    var r = params && params.length ? gdb.exec(sql, params) : gdb.exec(sql);
    if (!r.length || !r[0].values.length) return null;
    var row = {}; r[0].columns.forEach(function(c, i) { row[c] = r[0].values[0][i]; }); return row;
  } catch (err) { console.error('[GameDB] Get Error:', err.message); return null; }
}

function gAll(sql, params) {
  if (!gdb) return [];
  try {
    var r = params && params.length ? gdb.exec(sql, params) : gdb.exec(sql);
    if (!r.length) return [];
    return r[0].values.map(function(v) { var row = {}; r[0].columns.forEach(function(c, i) { row[c] = v[i]; }); return row; });
  } catch (err) { console.error('[GameDB] All Error:', err.message); return []; }
}

module.exports = { initGameDatabase, gRun, gGet, gAll, saveGameDB, getLevelInfo, LEVELS, getIsReady: function() { return isReady; } };
