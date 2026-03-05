var express = require('express');
var router = express.Router();
var { dbRun, dbGet, dbAll } = require('../database');
var https = require('https');
var http = require('http');

// ============================================
// SIMPLE HTTP FETCHER WITH TIMEOUT
// ============================================

function fetchUrl(url) {
  return new Promise(function (resolve) {
    var timeout = setTimeout(function () {
      resolve(null);
    }, 6000);

    try {
      var mod = url.startsWith('https') ? https : http;
      var options = {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
        }
      };

      var req = mod.get(url, options, function (res) {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timeout);
          fetchUrl(res.headers.location).then(resolve);
          return;
        }

        if (res.statusCode !== 200) {
          clearTimeout(timeout);
          resolve(null);
          return;
        }

        var chunks = [];
        res.on('data', function (chunk) {
          chunks.push(chunk);
        });
        res.on('end', function () {
          clearTimeout(timeout);
          try {
            resolve(Buffer.concat(chunks).toString('utf8'));
          } catch (e) {
            resolve(null);
          }
        });
        res.on('error', function () {
          clearTimeout(timeout);
          resolve(null);
        });
      });

      req.on('error', function () {
        clearTimeout(timeout);
        resolve(null);
      });

      req.on('timeout', function () {
        req.destroy();
        clearTimeout(timeout);
        resolve(null);
      });

    } catch (e) {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

// ============================================
// RSS PARSER
// ============================================

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagContent(xml, tag) {
  var r = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i');
  var m = xml.match(r);
  return m ? m[1].trim() : '';
}

function getImage(block) {
  var patterns = [
    /url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i,
    /<img[^>]*src="(https?:\/\/[^"]+)"/i,
    /<media:content[^>]*url="([^"]+)"/i,
    /<enclosure[^>]*url="([^"]+)"/i,
    /<media:thumbnail[^>]*url="([^"]+)"/i,
    /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var m = block.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return '';
}

function parseRSS(xml, sourceName) {
  var items = [];
  if (!xml) return items;

  // Try RSS items
  var itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  var match;

  while ((match = itemRegex.exec(xml)) !== null) {
    var block = match[1];
    var title = cleanText(getTagContent(block, 'title'));
    var desc = cleanText(getTagContent(block, 'description') || getTagContent(block, 'content:encoded'));
    var link = cleanText(getTagContent(block, 'link'));
    var pubDate = getTagContent(block, 'pubDate') || getTagContent(block, 'dc:date');
    var image = getImage(block);

    if (!link) {
      var linkMatch = block.match(/<link[^>]*href="([^"]+)"/i);
      if (linkMatch) link = linkMatch[1];
    }

    if (title && title.length > 5) {
      var dateStr = '';
      try {
        dateStr = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
      } catch (e) {
        dateStr = new Date().toISOString();
      }

      items.push({
        title: title.substring(0, 300),
        description: desc.substring(0, 500),
        url: link || '#',
        image_url: image,
        source: sourceName,
        published_at: dateStr
      });
    }
  }

  // Try Atom entries if no RSS items
  if (items.length === 0) {
    var entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      var block2 = match[1];
      var title2 = cleanText(getTagContent(block2, 'title'));
      var desc2 = cleanText(getTagContent(block2, 'summary') || getTagContent(block2, 'content'));
      var linkMatch2 = block2.match(/<link[^>]*href="([^"]+)"/i);
      var link2 = linkMatch2 ? linkMatch2[1] : '';
      var pubDate2 = getTagContent(block2, 'published') || getTagContent(block2, 'updated');

      if (title2 && title2.length > 5) {
        items.push({
          title: title2.substring(0, 300),
          description: desc2.substring(0, 500),
          url: link2 || '#',
          image_url: getImage(block2),
          source: sourceName,
          published_at: pubDate2 ? new Date(pubDate2).toISOString() : new Date().toISOString()
        });
      }
    }
  }

  return items;
}

// ============================================
// NEWS SOURCES
// ============================================

var SOURCES = [
  { name: 'Kompas.com', url: 'https://rss.kompas.com/edukasi' },
  { name: 'Detik Edukasi', url: 'https://rss.detik.com/index.php/edukasi' },
  { name: 'Liputan6', url: 'https://rss.liputan6.com/rss/0/0/1' },
  { name: 'Tribunnews', url: 'https://www.tribunnews.com/rss' },
  { name: 'Sindonews', url: 'https://edukasi.sindonews.com/rss' },
  { name: 'Republika', url: 'https://republika.co.id/rss' },
  { name: 'JPNN', url: 'https://www.jpnn.com/index.php?mib=rss' },
  { name: 'Suara.com', url: 'https://www.suara.com/rss/news' }
];

// ============================================
// BUILT-IN NEWS (Fallback - selalu tersedia)
// ============================================

function getBuiltInNews() {
  var d = Date.now();
  return [
    {
      title: 'Jambore Nasional Pramuka 2026: Membangun Karakter Generasi Emas',
      description: 'Jambore Nasional Pramuka 2026 sukses digelar dengan diikuti lebih dari 15.000 peserta dari seluruh Indonesia. Tema tahun ini adalah "Membangun Karakter Generasi Emas Indonesia 2045" yang menekankan pentingnya kepemimpinan dan kemandirian generasi muda.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Kwarnas Pramuka',
      published_at: new Date(d).toISOString()
    },
    {
      title: 'World Scout Jamboree 2026: Indonesia Kirim 500 Kontingen',
      description: 'Indonesia mengirimkan 500 kontingen pramuka terbaik untuk mengikuti World Scout Jamboree 2026. Para peserta telah melalui seleksi ketat di tingkat kwartir daerah dan nasional.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Scout International',
      published_at: new Date(d - 3600000).toISOString()
    },
    {
      title: 'Program Pramuka Digital 2026: Absensi QR Code dan E-Learning',
      description: 'Kwarnas Pramuka resmi meluncurkan program digitalisasi yang mencakup sistem absensi berbasis QR Code, platform e-learning untuk materi kepramukaan, dan aplikasi komunitas pramuka se-Indonesia.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Kwarnas Pramuka',
      published_at: new Date(d - 7200000).toISOString()
    },
    {
      title: 'Panduan Lengkap SKU Penggalang Terbaru 2026',
      description: 'Syarat Kecakapan Umum (SKU) Pramuka Penggalang telah diperbarui untuk tahun 2026. Beberapa perubahan meliputi penambahan kompetensi digital, literasi lingkungan, dan keterampilan pertolongan pertama modern.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Materi Pramuka',
      published_at: new Date(d - 86400000).toISOString()
    },
    {
      title: 'Perkemahan Sabtu Minggu (Persami): Tips dan Trik Sukses',
      description: 'Panduan lengkap untuk mengadakan Persami yang berkesan. Mulai dari perencanaan, pemilihan lokasi, kegiatan api unggun, hingga evaluasi kegiatan untuk pembina dan anggota pramuka.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Tips Pramuka',
      published_at: new Date(d - 172800000).toISOString()
    },
    {
      title: 'Teknik Tali Temali: 15 Simpul Wajib Dikuasai Pramuka',
      description: 'Menguasai tali temali adalah keterampilan dasar pramuka. Artikel ini membahas 15 simpul yang wajib dikuasai: simpul mati, pangkal, jangkar, anyam, palang, kursi, tarik, dan lainnya.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Keterampilan Pramuka',
      published_at: new Date(d - 259200000).toISOString()
    },
    {
      title: 'Pramuka Garuda 2026: Syarat dan Cara Mendapatkannya',
      description: 'Pramuka Garuda adalah penghargaan tertinggi yang diberikan kepada anggota pramuka yang telah menyelesaikan seluruh SKU dan SKK. Simak syarat lengkap dan tips untuk meraihnya.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Info Pramuka',
      published_at: new Date(d - 345600000).toISOString()
    },
    {
      title: 'Lomba Tingkat Nasional 2026: Jadwal Lengkap',
      description: 'Lomba Tingkat (LT) Nasional Pramuka Penggalang akan digelar pada semester kedua 2026. Seleksi dimulai dari tingkat ranting, cabang, daerah, hingga nasional.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Kegiatan Pramuka',
      published_at: new Date(d - 432000000).toISOString()
    },
    {
      title: 'Sandi Morse dan Semaphore: Panduan Belajar Lengkap',
      description: 'Panduan lengkap belajar sandi Morse menggunakan peluit dan senter, serta sandi Semaphore menggunakan bendera. Dilengkapi dengan tabel kode dan latihan soal.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Materi Pramuka',
      published_at: new Date(d - 518400000).toISOString()
    },
    {
      title: 'Dasa Darma Pramuka: Makna dan Implementasi di Era Modern',
      description: 'Sepuluh butir Dasa Darma tetap relevan di era digital. Artikel ini membahas makna mendalam setiap butir dan bagaimana mengimplementasikannya dalam kehidupan sehari-hari generasi Z.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Materi Pramuka',
      published_at: new Date(d - 604800000).toISOString()
    },
    {
      title: 'Sejarah Pramuka: Dari Baden Powell hingga Indonesia',
      description: 'Mengenal sejarah gerakan pramuka dari didirikannya oleh Lord Baden Powell di Inggris tahun 1907 hingga lahirnya Gerakan Pramuka Indonesia pada 14 Agustus 1961.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Sejarah Pramuka',
      published_at: new Date(d - 691200000).toISOString()
    },
    {
      title: 'Tri Satya Pramuka: Janji Setia Anggota Pramuka',
      description: 'Tri Satya adalah janji yang diucapkan oleh setiap anggota pramuka saat dilantik. Ketiga satya ini menjadi landasan moral dan spiritual dalam berkegiatan.',
      url: 'https://www.pramuka.or.id',
      image_url: '',
      source: 'Materi Pramuka',
      published_at: new Date(d - 777600000).toISOString()
    }
  ];
}

// ============================================
// FETCH ALL NEWS
// ============================================

async function fetchAllNews() {
  var allNews = [];
  var successCount = 0;

  console.log('📰 Fetching from ' + SOURCES.length + ' sources...');

  // Fetch all sources in parallel with individual timeout
  var promises = SOURCES.map(function (source) {
    return fetchUrl(source.url).then(function (xml) {
      if (xml && xml.length > 100) {
        var items = parseRSS(xml, source.name);
        if (items.length > 0) {
          successCount++;
          console.log('   ✅ ' + source.name + ': ' + items.length + ' articles');
          return items;
        }
      }
      console.log('   ❌ ' + source.name + ': no data');
      return [];
    }).catch(function () {
      console.log('   ❌ ' + source.name + ': error');
      return [];
    });
  });

  // Wait max 10 seconds total
  var timeout = new Promise(function (resolve) {
    setTimeout(function () {
      console.log('   ⏱️ Global timeout reached');
      resolve('timeout');
    }, 10000);
  });

  var raceResult = await Promise.race([
    Promise.all(promises),
    timeout
  ]);

  if (raceResult === 'timeout') {
    // Get whatever we have so far
    for (var i = 0; i < promises.length; i++) {
      try {
        var result = await Promise.race([promises[i], new Promise(function (r) { setTimeout(function () { r([]); }, 100); })]);
        if (Array.isArray(result)) allNews = allNews.concat(result);
      } catch (e) {}
    }
  } else if (Array.isArray(raceResult)) {
    raceResult.forEach(function (items) {
      if (Array.isArray(items)) allNews = allNews.concat(items);
    });
  }

  // Sort by date
  allNews.sort(function (a, b) {
    return new Date(b.published_at) - new Date(a.published_at);
  });

  // Remove duplicates
  var seen = {};
  var unique = [];
  allNews.forEach(function (item) {
    var key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
    if (!seen[key] && key.length > 5) {
      seen[key] = true;
      unique.push(item);
    }
  });

  console.log('📰 Sources OK: ' + successCount + '/' + SOURCES.length + ', Articles: ' + unique.length);
  return unique;
}

// ============================================
// ROUTES
// ============================================

router.get('/', async function (req, res) {
  try {
    var forceRefresh = req.query.refresh === '1';

    // Try cache first (valid 20 minutes)
    if (!forceRefresh) {
      try {
        var cached = dbAll("SELECT * FROM news_cache WHERE cached_at > datetime('now','-20 minutes') ORDER BY published_at DESC LIMIT 30", []);
        if (cached && cached.length >= 3) {
          return res.json({ news: cached, total: cached.length, source: 'cache' });
        }
      } catch (e) {}
    }

    // Try fetching online
    var online = [];
    try {
      online = await fetchAllNews();
    } catch (e) {
      console.log('Online fetch failed:', e.message);
    }

    if (online.length > 0) {
      // Save to cache
      try {
        dbRun("DELETE FROM news_cache", []);
        online.slice(0, 50).forEach(function (item) {
          try {
            dbRun(
              'INSERT INTO news_cache (title, description, url, image_url, source, published_at) VALUES (?, ?, ?, ?, ?, ?)',
              [item.title || '', item.description || '', item.url || '', item.image_url || '', item.source || '', item.published_at || '']
            );
          } catch (e) {}
        });
      } catch (e) {}

      return res.json({ news: online.slice(0, 30), total: online.length, source: 'live' });
    }

    // Try old cache
    try {
      var oldCache = dbAll("SELECT * FROM news_cache ORDER BY published_at DESC LIMIT 30", []);
      if (oldCache && oldCache.length > 0) {
        return res.json({ news: oldCache, total: oldCache.length, source: 'old_cache' });
      }
    } catch (e) {}

    // Final fallback
    var builtin = getBuiltInNews();
    res.json({ news: builtin, total: builtin.length, source: 'builtin' });

  } catch (err) {
    console.error('News error:', err.message);
    var fallback = getBuiltInNews();
    res.json({ news: fallback, total: fallback.length, source: 'fallback' });
  }
});

router.get('/refresh', async function (req, res) {
  try {
    var news = await fetchAllNews();
    if (news.length > 0) {
      try {
        dbRun("DELETE FROM news_cache", []);
        news.slice(0, 50).forEach(function (item) {
          try {
            dbRun(
              'INSERT INTO news_cache (title, description, url, image_url, source, published_at) VALUES (?, ?, ?, ?, ?, ?)',
              [item.title, item.description, item.url, item.image_url || '', item.source, item.published_at]
            );
          } catch (e) {}
        });
      } catch (e) {}
      res.json({ message: 'Berhasil memuat ' + news.length + ' berita', count: news.length });
    } else {
      res.json({ message: 'Gagal memuat berita online, gunakan data tersimpan', count: 0 });
    }
  } catch (e) {
    res.json({ message: 'Error: ' + e.message, count: 0 });
  }
});

module.exports = router;