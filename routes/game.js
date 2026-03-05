var express = require('express');
var router = express.Router();
var { requireAuth } = require('../middleware/auth');
var { gRun, gGet, gAll, saveGameDB, getLevelInfo } = require('../game-database');

// ══════════════════════════════════════════════
//  BANK SOAL KEPRAMUKAAN
// ══════════════════════════════════════════════
var QUIZ_QUESTIONS = [
  // Sejarah
  { q: 'Siapa pendiri Gerakan Pramuka dunia?', opts: ['Robert Baden-Powell','Lord Kitchener','John Smith','Duke Wellington'], a: 0, cat: 'Sejarah' },
  { q: 'Kapan Gerakan Pramuka Indonesia didirikan?', opts: ['14 Agustus 1961','17 Agustus 1945','1 Januari 1960','20 Mei 1908'], a: 0, cat: 'Sejarah' },
  { q: 'Buku panduan Pramuka pertama karya Baden-Powell berjudul?', opts: ['Scouting for Boys','Boy Scout Manual','Guide to Scouting','Scout Handbook'], a: 0, cat: 'Sejarah' },
  { q: 'Tahun berapa Pramuka dunia (WOSM) didirikan?', opts: ['1920','1910','1930','1945'], a: 0, cat: 'Sejarah' },
  { q: 'Presiden yang menandatangani Keputusan Presiden pendirian Pramuka Indonesia?', opts: ['Ir. Soekarno','Soeharto','Habibie','Megawati'], a: 0, cat: 'Sejarah' },
  { q: 'Negara asal Robert Baden-Powell?', opts: ['Inggris','Amerika Serikat','Australia','Kanada'], a: 0, cat: 'Sejarah' },
  { q: 'Jambore Pramuka dunia pertama diadakan di?', opts: ['Olympia, London','New York, AS','Paris, Prancis','Berlin, Jerman'], a: 0, cat: 'Sejarah' },
  // Tingkatan & Golongan
  { q: 'Usia anggota Pramuka Siaga adalah?', opts: ['7-10 tahun','11-15 tahun','16-20 tahun','21-25 tahun'], a: 0, cat: 'Golongan' },
  { q: 'Usia anggota Pramuka Penggalang adalah?', opts: ['11-15 tahun','7-10 tahun','16-20 tahun','21-25 tahun'], a: 0, cat: 'Golongan' },
  { q: 'Usia anggota Pramuka Penegak adalah?', opts: ['16-20 tahun','11-15 tahun','7-10 tahun','21-25 tahun'], a: 0, cat: 'Golongan' },
  { q: 'Usia anggota Pramuka Pandega adalah?', opts: ['21-25 tahun','16-20 tahun','11-15 tahun','26-30 tahun'], a: 0, cat: 'Golongan' },
  { q: 'Kelompok kecil Pramuka Siaga disebut?', opts: ['Barung','Regu','Sangga','Racana'], a: 0, cat: 'Golongan' },
  { q: 'Kelompok kecil Pramuka Penggalang disebut?', opts: ['Regu','Barung','Sangga','Racana'], a: 0, cat: 'Golongan' },
  { q: 'Kelompok Pramuka Penegak disebut?', opts: ['Sangga','Regu','Barung','Racana'], a: 0, cat: 'Golongan' },
  { q: 'Satuan terkecil Pramuka Pandega disebut?', opts: ['Racana','Sangga','Regu','Barung'], a: 0, cat: 'Golongan' },
  // Kode Kehormatan
  { q: 'Kode kehormatan Pramuka Siaga disebut?', opts: ['Dwisatya & Dwidarma','Trisatya & Dasadarma','Trisatya & Tridarma','Panca Prasetya'], a: 0, cat: 'Kode' },
  { q: 'Kode kehormatan Pramuka Penggalang, Penegak, Pandega disebut?', opts: ['Trisatya & Dasadarma','Dwisatya & Dwidarma','Panca Prasetya','Sapta Marga'], a: 0, cat: 'Kode' },
  { q: 'Jumlah butir Dasadarma Pramuka adalah?', opts: ['10','5','7','12'], a: 0, cat: 'Kode' },
  { q: 'Dasadarma Pramuka poin pertama berbunyi?', opts: ['Takwa kepada Tuhan Yang Maha Esa','Cinta alam dan kasih sayang sesama manusia','Patriot yang sopan dan ksatria','Rela menolong dan tabah'], a: 0, cat: 'Kode' },
  { q: 'Motto Gerakan Pramuka Indonesia adalah?', opts: ['Satyaku Kudarmakan, Darmaku Kubaktikan','Siap Sedia Selalu','Be Prepared','Satu Pramuka untuk Satu Indonesia'], a: 0, cat: 'Kode' },
  // Sandi & Teknik
  { q: 'Sandi yang menggunakan titik dan garis disebut?', opts: ['Sandi Morse','Sandi Semaphore','Sandi Braille','Sandi Rumput'], a: 0, cat: 'Teknik' },
  { q: 'Semaphore menggunakan alat berupa?', opts: ['Bendera','Peluit','Lampu','Asap'], a: 0, cat: 'Teknik' },
  { q: 'Simpul yang digunakan untuk menyambung dua tali sama besar disebut?', opts: ['Simpul mati','Simpul hidup','Simpul pangkal','Simpul jangkar'], a: 0, cat: 'Teknik' },
  { q: 'Pionering adalah kegiatan membuat?', opts: ['Konstruksi dari tali dan tongkat','Tandu darurat','Api unggun','Peta lapangan'], a: 0, cat: 'Teknik' },
  { q: 'Kompas digunakan untuk menentukan?', opts: ['Arah mata angin','Ketinggian tempat','Jarak tempuh','Cuaca'], a: 0, cat: 'Teknik' },
  { q: 'Navigasi darat menggunakan peta dan kompas disebut?', opts: ['Orienteering','Pioneering','Scouting','Hiking'], a: 0, cat: 'Teknik' },
  { q: 'Warna topi Pramuka Siaga adalah?', opts: ['Kuning','Merah','Hijau','Biru'], a: 0, cat: 'Seragam' },
  { q: 'Warna topi Pramuka Penggalang adalah?', opts: ['Merah','Kuning','Hijau','Hitam'], a: 0, cat: 'Seragam' },
  // Kegiatan
  { q: 'Jambore Nasional Pramuka diadakan setiap?', opts: ['5 tahun sekali','1 tahun sekali','2 tahun sekali','10 tahun sekali'], a: 0, cat: 'Kegiatan' },
  { q: 'Kegiatan berkemah bagi Pramuka Penggalang disebut?', opts: ['Jambore','Raimuna','Rover Moot','Moot'], a: 0, cat: 'Kegiatan' },
  { q: 'Raimuna adalah kegiatan perkemahan untuk tingkat?', opts: ['Penegak & Pandega','Siaga','Penggalang','Semua golongan'], a: 0, cat: 'Kegiatan' },
  { q: 'SKU kepanjangan dari?', opts: ['Syarat Kecakapan Umum','Sertifikat Kepramukaan Utama','Syarat Keterampilan Utama','Sandi Kepramukaan Umum'], a: 0, cat: 'Umum' },
  { q: 'TKK kepanjangan dari?', opts: ['Tanda Kecakapan Khusus','Tanda Kehormatan Kwartir','Tanda Keanggotaan Kelas','Tanda Keterampilan Khusus'], a: 0, cat: 'Umum' },
  { q: 'Lambang Gerakan Pramuka Indonesia berbentuk?', opts: ['Tunas Kelapa','Bintang','Elang','Pohon Beringin'], a: 0, cat: 'Umum' },
  { q: 'Kwartir Nasional Pramuka berkedudukan di?', opts: ['Jakarta','Bandung','Surabaya','Yogyakarta'], a: 0, cat: 'Umum' },
  { q: 'WOSM adalah singkatan dari?', opts: ['World Organization of the Scout Movement','World Organization of Scout Members','World Open Scout Meeting','Wide Organization of Scout Movement'], a: 0, cat: 'Umum' },
  { q: 'Hari Pramuka diperingati setiap tanggal?', opts: ['14 Agustus','17 Agustus','21 April','28 Oktober'], a: 0, cat: 'Sejarah' },
  { q: 'Tanda pengenal Kwartir Ranting dipakai oleh?', opts: ['Pembina & Pelatih di tingkat kecamatan','Anggota Siaga','Pramuka Penegak','Majelis Pembimbing'], a: 0, cat: 'Umum' },
];

// Bank kata untuk Word Scramble
var SCRAMBLE_WORDS = [
  { word: 'PRAMUKA',   hint: 'Nama organisasi kepanduan Indonesia' },
  { word: 'DASADARMA', hint: 'Kode moral Pramuka, 10 butir' },
  { word: 'TRISATYA',  hint: 'Janji Pramuka Penggalang/Penegak/Pandega' },
  { word: 'JAMBORE',   hint: 'Kegiatan perkemahan besar Penggalang' },
  { word: 'SEMAPHORE', hint: 'Teknik komunikasi menggunakan bendera' },
  { word: 'PIONEERING',hint: 'Membuat konstruksi dari tali dan tongkat' },
  { word: 'KOMPAS',    hint: 'Alat navigasi penunjuk arah' },
  { word: 'RAIMUNA',   hint: 'Perkemahan Penegak dan Pandega' },
  { word: 'KWARTIR',   hint: 'Badan pengelola Gerakan Pramuka' },
  { word: 'SANGGA',    hint: 'Satuan kecil Pramuka Penegak' },
  { word: 'BARUNG',    hint: 'Satuan kecil Pramuka Siaga' },
  { word: 'PENGGALANG',hint: 'Golongan Pramuka usia 11-15 tahun' },
  { word: 'SIAGA',     hint: 'Golongan Pramuka usia 7-10 tahun' },
  { word: 'PENEGAK',   hint: 'Golongan Pramuka usia 16-20 tahun' },
  { word: 'PANDEGA',   hint: 'Golongan Pramuka usia 21-25 tahun' },
  { word: 'MORSE',     hint: 'Sandi menggunakan titik dan garis' },
  { word: 'ORIENTEERING',hint:'Navigasi menggunakan peta dan kompas' },
  { word: 'BIVAK',     hint: 'Tenda darurat saat survival' },
  { word: 'SCOUTING',  hint: 'Kegiatan kepanduan dalam bahasa Inggris' },
  { word: 'TUNAS',     hint: 'Lambang Pramuka Indonesia berbentuk ... kelapa' },
];

// Emoji Quiz
var EMOJI_QUIZ = [
  { emoji: '🏕️🔥', q: 'Kegiatan apa ini?', opts: ['Api Unggun','Memasak','Barbeque','Upacara'], a: 0 },
  { emoji: '🧭🗺️', q: 'Kegiatan navigasi apa?', opts: ['Orienteering','Hiking','Mountaineering','Trekking'], a: 0 },
  { emoji: '🪢🪵', q: 'Teknik Pramuka apa?', opts: ['Pioneering','Scouting','Camping','Hiking'], a: 0 },
  { emoji: '🚩📡', q: 'Teknik komunikasi apa?', opts: ['Semaphore','Morse','Radio','Telegraf'], a: 0 },
  { emoji: '⛺🌲', q: 'Kegiatan apa ini?', opts: ['Berkemah','Hiking','Climbing','Orienteering'], a: 0 },
  { emoji: '🤝🌍', q: 'Ini melambangkan?', opts: ['Persaudaraan Pramuka','Olimpiade','Piala Dunia','KTT Dunia'], a: 0 },
  { emoji: '🌿🌰', q: 'Lambang Pramuka Indonesia berupa?', opts: ['Tunas Kelapa','Bintang','Pohon','Padi'], a: 0 },
  { emoji: '📻·-·', q: 'Sandi komunikasi apa?', opts: ['Morse','Semaphore','Braille','Enigma'], a: 0 },
  { emoji: '🏅📜', q: 'Syarat kecakapan umum Pramuka disingkat?', opts: ['SKU','TKK','SKK','TKU'], a: 0 },
  { emoji: '🎪🏆', q: 'Perkemahan besar tingkat Penggalang disebut?', opts: ['Jambore','Raimuna','Rover Moot','Pertinas'], a: 0 },
  { emoji: '🔦🌙', q: 'Kegiatan malam hari di alam disebut?', opts: ['Night Hike','Survival','Bivak','Orienteering'], a: 0 },
  { emoji: '🩹🆘', q: 'Pertolongan Pertama pada Kecelakaan disingkat?', opts: ['P3K','PKK','PPPK','PKP'], a: 0 },
];

// True/False
var TF_QUESTIONS = [
  { q: 'Pramuka Indonesia didirikan pada 14 Agustus 1961.', a: true },
  { q: 'Baden-Powell berasal dari Amerika Serikat.', a: false },
  { q: 'Pramuka Siaga berusia 7-10 tahun.', a: true },
  { q: 'Dasadarma berisi 5 poin kewajiban.', a: false },
  { q: 'Satuan terkecil Pramuka Penggalang disebut Regu.', a: true },
  { q: 'Topi Pramuka Siaga berwarna merah.', a: false },
  { q: 'WOSM adalah organisasi Pramuka sedunia.', a: true },
  { q: 'Jambore Nasional diadakan setiap 2 tahun sekali.', a: false },
  { q: 'Lambang Pramuka Indonesia adalah Tunas Kelapa.', a: true },
  { q: 'Semaphore menggunakan peluit sebagai alat komunikasi.', a: false },
  { q: 'Raimuna adalah perkemahan untuk Penegak dan Pandega.', a: true },
  { q: 'SKU singkatan dari Syarat Kecakapan Umum.', a: true },
  { q: 'Hari Pramuka diperingati setiap 17 Agustus.', a: false },
  { q: 'Barung adalah satuan kecil Pramuka Siaga.', a: true },
  { q: 'Sandi Morse menggunakan warna untuk komunikasi.', a: false },
  { q: 'Pandega adalah golongan Pramuka usia 21-25 tahun.', a: true },
  { q: 'Kwartir Nasional Pramuka berkedudukan di Bandung.', a: false },
  { q: 'Motto Pramuka adalah "Satyaku Kudarmakan, Darmaku Kubaktikan".', a: true },
  { q: 'Trisatya adalah kode kehormatan Pramuka Siaga.', a: false },
  { q: 'Pioneering adalah kegiatan membuat konstruksi dari tali dan tongkat.', a: true },
];

// Memory Card pairs
var MEMORY_CARDS = [
  { id: 'a1', label: 'Siaga',      match: 'b1' }, { id: 'b1', label: '7-10 Tahun',   match: 'a1' },
  { id: 'a2', label: 'Penggalang', match: 'b2' }, { id: 'b2', label: '11-15 Tahun',  match: 'a2' },
  { id: 'a3', label: 'Penegak',    match: 'b3' }, { id: 'b3', label: '16-20 Tahun',  match: 'a3' },
  { id: 'a4', label: 'Pandega',    match: 'b4' }, { id: 'b4', label: '21-25 Tahun',  match: 'a4' },
  { id: 'a5', label: 'Barung',     match: 'b5' }, { id: 'b5', label: 'Satuan Siaga', match: 'a5' },
  { id: 'a6', label: 'Regu',       match: 'b6' }, { id: 'b6', label: 'Satuan Penggalang', match: 'a6' },
  { id: 'a7', label: 'Sangga',     match: 'b7' }, { id: 'b7', label: 'Satuan Penegak',    match: 'a7' },
  { id: 'a8', label: 'Racana',     match: 'b8' }, { id: 'b8', label: 'Satuan Pandega',    match: 'a8' },
];

// ══════════════════════════════════════════════
//  HELPER
// ══════════════════════════════════════════════
function shuffle(arr) { return arr.slice().sort(function() { return Math.random() - 0.5; }); }

function upsertPlayer(userId, username) {
  var existing = gGet('SELECT user_id FROM players WHERE user_id = ?', [userId]);
  if (!existing) {
    gRun('INSERT INTO players (user_id, username) VALUES (?, ?)', [userId, username]);
  }
}

function checkAchievements(userId, totalXP, playCount, gameType) {
  var badges = [
    { code: 'first_play',   title: '🎮 Pemula',        desc: 'Bermain game pertama kali',          cond: playCount >= 1 },
    { code: 'play_10',      title: '🔟 Aktif',          desc: 'Sudah bermain 10 kali',              cond: playCount >= 10 },
    { code: 'play_50',      title: '🌟 Berpengalaman',  desc: 'Sudah bermain 50 kali',              cond: playCount >= 50 },
    { code: 'xp_500',       title: '⚡ Berenergi',       desc: 'Kumpulkan 500 XP',                  cond: totalXP >= 500 },
    { code: 'xp_2000',      title: '💎 Veteran',         desc: 'Kumpulkan 2000 XP',                 cond: totalXP >= 2000 },
    { code: 'xp_5000',      title: '🏆 Master Pramuka', desc: 'Kumpulkan 5000 XP',                 cond: totalXP >= 5000 },
  ];
  var earned = [];
  badges.forEach(function(b) {
    if (!b.cond) return;
    try {
      gRun('INSERT OR IGNORE INTO achievements (user_id, code, title, description) VALUES (?,?,?,?)',
        [userId, b.code, b.title, b.desc]);
      if (gdb && gdb.getRowsModified && gdb.getRowsModified() > 0) earned.push(b);
    } catch(e) {}
  });
  return earned;
}

// ══════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════

// Profil game player
router.get('/profile', requireAuth, function(req, res) {
  try {
    upsertPlayer(req.user.id, req.user.display_name);
    var player = gGet('SELECT * FROM players WHERE user_id = ?', [req.user.id]);
    var bestScores = gAll('SELECT * FROM best_scores WHERE user_id = ?', [req.user.id]);
    var achievements = gAll('SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC', [req.user.id]);
    var totalGames = gAll('SELECT game_type, COUNT(*) as c FROM game_sessions WHERE user_id = ? GROUP BY game_type', [req.user.id]);
    var levelInfo = getLevelInfo(player ? player.total_xp : 0);
    res.json({ player, levelInfo, bestScores, achievements, totalGames });
  } catch(e) { res.status(500).json({ error: 'Gagal memuat profil game' }); }
});

// Submit skor setelah game selesai
router.post('/score', requireAuth, function(req, res) {
  try {
    var b = req.body;
    var userId = req.user.id;
    var gameType  = b.gameType;
    var score     = parseInt(b.score) || 0;
    var correct   = parseInt(b.correct) || 0;
    var total     = parseInt(b.total) || 0;
    var duration  = parseInt(b.duration) || 0;

    // Hitung XP
    var baseXP = { quiz: 12, scramble: 15, memory: 20, emoji: 10, truefalse: 6 };
    var xpPerCorrect = baseXP[gameType] || 10;
    var bonusXP = duration > 0 && duration < 30 ? 20 : 0; // bonus jawab cepat
    var xpEarned = (correct * xpPerCorrect) + bonusXP;

    upsertPlayer(userId, req.user.display_name);

    // Simpan sesi
    gRun('INSERT INTO game_sessions (user_id, game_type, score, xp_earned, correct, total, duration) VALUES (?,?,?,?,?,?,?)',
      [userId, gameType, score, xpEarned, correct, total, duration]);

    // Update best score
    var best = gGet('SELECT * FROM best_scores WHERE user_id=? AND game_type=?', [userId, gameType]);
    if (!best) {
      gRun('INSERT INTO best_scores (user_id, game_type, best_score, best_xp, play_count) VALUES (?,?,?,?,1)',
        [userId, gameType, score, xpEarned]);
    } else {
      gRun('UPDATE best_scores SET best_score=MAX(best_score,?), best_xp=MAX(best_xp,?), play_count=play_count+1 WHERE user_id=? AND game_type=?',
        [score, xpEarned, userId, gameType]);
    }

    // Update total XP & level
    var player = gGet('SELECT total_xp FROM players WHERE user_id=?', [userId]);
    var newXP = (player ? player.total_xp : 0) + xpEarned;
    var lvl = getLevelInfo(newXP);
    gRun("UPDATE players SET total_xp=?, level=?, level_name=?, updated_at=datetime('now','localtime') WHERE user_id=?",
      [newXP, lvl.level, lvl.name, userId]);

    // Cek achievements
    var totalPlayCount = (gGet('SELECT COUNT(*) as c FROM game_sessions WHERE user_id=?', [userId]) || {}).c || 0;
    var newAchievements = checkAchievements(userId, newXP, totalPlayCount, gameType);

    saveGameDB();
    res.json({ xpEarned, newXP, levelInfo: lvl, newAchievements });
  } catch(e) {
    console.error('Score submit error:', e);
    res.status(500).json({ error: 'Gagal menyimpan skor' });
  }
});

// Leaderboard
router.get('/leaderboard', requireAuth, function(req, res) {
  try {
    var top = gAll('SELECT user_id, username, total_xp, level, level_name, updated_at FROM players ORDER BY total_xp DESC LIMIT 20');
    var myRank = null;
    top.forEach(function(p, i) {
      if (p.user_id === req.user.id) myRank = i + 1;
      p.rank = i + 1;
    });
    // Jika user tidak masuk top 20, hitung ranknya
    if (!myRank) {
      var above = (gGet('SELECT COUNT(*) as c FROM players WHERE total_xp > (SELECT total_xp FROM players WHERE user_id=?)', [req.user.id]) || {}).c || 0;
      myRank = above + 1;
    }
    res.json({ leaderboard: top, myRank });
  } catch(e) { res.status(500).json({ error: 'Gagal memuat leaderboard' }); }
});

// Soal Quiz (acak 10)
router.get('/questions/quiz', requireAuth, function(req, res) {
  var shuffled = shuffle(QUIZ_QUESTIONS).slice(0, 10);
  res.json({ questions: shuffled.map(function(q) {
    // acak urutan jawaban
    var opts = q.opts.slice();
    var correctText = opts[q.a];
    var shuffledOpts = shuffle(opts);
    return { q: q.q, opts: shuffledOpts, a: shuffledOpts.indexOf(correctText), cat: q.cat };
  })});
});

// Kata Scramble (acak 8 kata)
router.get('/questions/scramble', requireAuth, function(req, res) {
  var words = shuffle(SCRAMBLE_WORDS).slice(0, 8);
  res.json({ words: words.map(function(w) {
    return { word: w.word, hint: w.hint, scrambled: shuffle(w.word.split('')).join('') };
  })});
});

// Memory cards (acak set)
router.get('/questions/memory', requireAuth, function(req, res) {
  var cards = shuffle(MEMORY_CARDS.slice(0, 12)); // 6 pasang
  res.json({ cards: shuffle(cards) });
});

// Emoji Quiz (acak 8)
router.get('/questions/emoji', requireAuth, function(req, res) {
  var qs = shuffle(EMOJI_QUIZ).slice(0, 8);
  res.json({ questions: qs.map(function(q) {
    var correctText = q.opts[q.a];
    var shuffledOpts = shuffle(q.opts);
    return { emoji: q.emoji, q: q.q, opts: shuffledOpts, a: shuffledOpts.indexOf(correctText) };
  })});
});

// True/False (acak 15)
router.get('/questions/truefalse', requireAuth, function(req, res) {
  var qs = shuffle(TF_QUESTIONS).slice(0, 15);
  res.json({ questions: qs });
});

module.exports = router;
