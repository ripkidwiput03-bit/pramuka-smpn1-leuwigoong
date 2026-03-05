document.addEventListener('DOMContentLoaded', function () {
  initNavbar();
  AuthManager.updateUI();

  if (AuthManager.isLoggedIn()) {
    initNotifications();
  }

  // Only load home content if on home page
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loadHomeStats();
    loadHomePosts();
  }
});

function initNavbar() {
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var navbar = document.getElementById('navbar');
  var userArea = document.getElementById('navUser');
  var dropdown = document.getElementById('userDropdown');
  var logoutBtn = document.getElementById('logoutBtn');

  if (toggle && menu) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle.classList.toggle('active');
      menu.classList.toggle('show');
    });

    // Close on link click
    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('active');
        menu.classList.remove('show');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        toggle.classList.remove('active');
        menu.classList.remove('show');
      }
    });
  }

  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  if (userArea && dropdown) {
    userArea.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      AuthManager.logout();
    });
  }
}

function initNotifications() {
  var notifBtn = document.getElementById('notifBtn');
  var notifPanel = document.getElementById('notifPanel');
  var markAllRead = document.getElementById('markAllRead');

  if (!notifBtn || !notifPanel) return;

  notifBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    notifPanel.classList.toggle('show');
    if (notifPanel.classList.contains('show')) {
      loadNotifications();
    }
  });

  document.addEventListener('click', function (e) {
    if (!notifPanel.contains(e.target) && e.target !== notifBtn && !notifBtn.contains(e.target)) {
      notifPanel.classList.remove('show');
    }
  });

  if (markAllRead) {
    markAllRead.addEventListener('click', markNotificationsRead);
  }

  loadUnreadCount();
  setInterval(loadUnreadCount, 30000);
  initSocketNotifications();
}

function initSocketNotifications() {
  if (!AuthManager.isLoggedIn()) return;
  try {
    var socket = io();
    var user = AuthManager.getUser();
    if (user) {
      socket.emit('user_online', String(user.id));
    }
    socket.on('notification', function (data) {
      showToast(data.message, data.type || 'info', data.title);
      loadUnreadCount();
    });
    window.appSocket = socket;
  } catch (e) {
    console.log('Socket skipped');
  }
}

async function loadUnreadCount() {
  if (!AuthManager.isLoggedIn()) return;
  try {
    var res1 = await AuthManager.fetchWithAuth('/api/chat/unread');
    if (res1.ok) {
      var d1 = await res1.json();
      var chatBadge = document.getElementById('chatBadge');
      if (chatBadge) {
        if (d1.unread > 0) { chatBadge.textContent = d1.unread; chatBadge.style.display = 'flex'; }
        else { chatBadge.style.display = 'none'; }
      }
    }

    var res2 = await AuthManager.fetchWithAuth('/api/chat/notifications');
    if (res2.ok) {
      var d2 = await res2.json();
      var notifBadge = document.getElementById('notifBadge');
      if (notifBadge) {
        if (d2.unreadCount > 0) { notifBadge.textContent = d2.unreadCount; notifBadge.style.display = 'flex'; }
        else { notifBadge.style.display = 'none'; }
      }
    }
  } catch (e) {}
}

async function loadNotifications() {
  var notifList = document.getElementById('notifList');
  if (!notifList || !AuthManager.isLoggedIn()) return;

  try {
    var response = await AuthManager.fetchWithAuth('/api/chat/notifications');
    if (!response.ok) throw new Error('fail');
    var data = await response.json();

    if (!data.notifications || data.notifications.length === 0) {
      notifList.innerHTML = '<div class="notif-empty">Tidak ada notifikasi</div>';
      return;
    }

    notifList.innerHTML = data.notifications.map(function (n) {
      var ic = 'fas fa-bell';
      if (n.type === 'chat') ic = 'fas fa-comment';
      if (n.type === 'comment') ic = 'fas fa-reply';

      return '<div class="notif-item ' + (n.is_read ? '' : 'unread') + '"' +
        (n.link ? ' onclick="window.location.href=\'' + n.link + '\'"' : '') + '>' +
        '<div class="notif-icon"><i class="' + ic + '"></i></div>' +
        '<div class="notif-content">' +
        '<h4>' + escapeHtml(n.title) + '</h4>' +
        '<p>' + escapeHtml(n.message) + '</p>' +
        '<span class="notif-time">' + formatTimeAgo(n.created_at) + '</span>' +
        '</div></div>';
    }).join('');
  } catch (e) {
    notifList.innerHTML = '<div class="notif-empty">Gagal memuat</div>';
  }
}

async function markNotificationsRead() {
  try {
    await AuthManager.fetchWithAuth('/api/chat/notifications/read', { method: 'PUT' });
    var b = document.getElementById('notifBadge');
    if (b) b.style.display = 'none';
    loadNotifications();
  } catch (e) {}
}

async function loadHomeStats() {
  try {
    var res = await fetch('/api/posts?limit=1');
    if (res.ok) {
      var data = await res.json();
      var el = document.getElementById('statPosts');
      if (el) animateNumber(el, data.pagination ? data.pagination.total : 0);
    }
  } catch (e) {}

  var sm = document.getElementById('statMembers');
  var ss = document.getElementById('statSessions');
  if (sm) animateNumber(sm, 50);
  if (ss) animateNumber(ss, 12);
}

function animateNumber(el, target) {
  var current = 0;
  var step = Math.max(1, Math.floor(target / 25));
  var timer = setInterval(function () {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 50);
}

async function loadHomePosts() {
  var grid = document.getElementById('homePostsGrid');
  if (!grid) return;

  try {
    var response = await fetch('/api/posts?limit=6');
    if (!response.ok) throw new Error('fail');
    var data = await response.json();

    if (!data.posts || data.posts.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">' +
        '<svg viewBox="0 0 80 80"><rect x="10" y="10" width="60" height="60" rx="5" fill="#e8f5e9"/>' +
        '<rect x="20" y="20" width="40" height="5" rx="2" fill="#1b5e20" opacity="0.2"/>' +
        '<rect x="20" y="30" width="30" height="4" rx="2" fill="#1b5e20" opacity="0.15"/></svg>' +
        '<h3>Belum Ada Postingan</h3>' +
        '<p>Jadilah yang pertama membuat postingan!</p></div>';
      return;
    }

    grid.innerHTML = data.posts.map(function (post) {
      return createPostCardHTML(post);
    }).join('');
  } catch (e) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Tidak dapat memuat postingan</p></div>';
  }
}

function createPostCardHTML(post) {
  var imgHTML = '';
  if (post.image_url) {
    imgHTML = '<div class="post-image"><img src="' + escapeHtml(post.image_url) + '" alt="" loading="lazy"></div>';
  } else {
    imgHTML = '<div class="post-image-placeholder"><svg viewBox="0 0 80 80"><rect x="5" y="5" width="70" height="70" rx="5" fill="#c8e6c9"/><polygon points="40,15 50,35 62,35 52,45 56,60 40,50 24,60 28,45 18,35 30,35" fill="#1b5e20" opacity="0.25"/></svg></div>';
  }

  var avatar = post.author_photo || generateAvatarUrl(post.author_name || 'U');

  return '<a href="/posts.html?id=' + post.id + '" class="post-card">' +
    imgHTML +
    '<div class="post-body">' +
    '<span class="post-category">' + escapeHtml(post.category || 'blog') + '</span>' +
    '<h3 class="post-title">' + escapeHtml(post.title) + '</h3>' +
    '<p class="post-excerpt">' + escapeHtml(stripHtml(post.content || '').substring(0, 100)) + '</p>' +
    '<div class="post-footer">' +
    '<div class="post-author">' +
    '<img src="' + avatar + '" class="post-author-avatar" alt="">' +
    '<span class="post-author-name">' + escapeHtml(post.author_name || 'Anonim') + '</span>' +
    '</div>' +
    '<div class="post-stats">' +
    '<span><i class="fas fa-heart"></i> ' + (post.likes || 0) + '</span>' +
    '<span><i class="fas fa-comment"></i> ' + (post.comment_count || 0) + '</span>' +
    '</div></div></div></a>';
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function stripHtml(html) {
  if (!html) return '';
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  var date = new Date(dateStr);
  var now = new Date();
  var diff = Math.floor((now - date) / 1000);
  if (isNaN(diff) || diff < 0) return '';
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  var date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  var date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}