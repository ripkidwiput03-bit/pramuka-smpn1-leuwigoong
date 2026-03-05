// ============================================
// Firebase Configuration & Auth Management
// ============================================

// Firebase config diambil dari server (bukan hardcode di sini)
// Server membaca dari .env — jauh lebih aman
let firebaseApp  = null;
let firebaseAuth = null;

async function initFirebase() {
  try {
    const res = await fetch('/api/firebase-config');
    const cfg = await res.json();

    if (!cfg.apiKey || cfg.apiKey === '') {
      console.log('ℹ️ Firebase tidak dikonfigurasi, pakai local auth saja');
      return;
    }

    if (typeof firebase !== 'undefined') {
      // Cegah double-init jika halaman load ulang
      if (!firebase.apps || firebase.apps.length === 0) {
        firebaseApp  = firebase.initializeApp(cfg);
      } else {
        firebaseApp  = firebase.apps[0];
      }
      firebaseAuth = firebase.auth();
      console.log('✅ Firebase initialized');
    }
  } catch (e) {
    console.log('ℹ️ Firebase init skipped:', e.message);
  }
}

// Jalankan saat script dimuat
initFirebase();

// ============================================
// Token & User Management
// ============================================

const AuthManager = {
  getToken() {
    return localStorage.getItem('token') || this.getCookie('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  getUser() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + this.getToken() }
      });
    } catch (e) {
      // ignore
    }

    if (firebaseAuth) {
      try {
        await firebaseAuth.signOut();
      } catch (e) {
        // ignore
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    window.location.href = '/';
  },

  getHeaders() {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
  },

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.getToken()
    };
  },

  async fetchWithAuth(url, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    const token = this.getToken();
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    return fetch(url, options);
  },

  // Google Sign-In
  async googleSignIn() {
    if (!firebaseAuth) {
      showToast('Google Sign-In belum dikonfigurasi. Silakan login dengan email.', 'warning');
      return null;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebaseAuth.signInWithPopup(provider);
      const user = result.user;

      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
      } else {
        showToast(data.error || 'Login gagal', 'error');
        return null;
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToast('Login dibatalkan', 'warning');
      } else if (err.code === 'auth/popup-blocked') {
        showToast('Popup diblokir. Izinkan popup untuk login dengan Google.', 'warning');
      } else {
        showToast('Gagal login dengan Google: ' + err.message, 'error');
      }
      return null;
    }
  },

  updateUI() {
    const isLoggedIn = this.isLoggedIn();
    const isAdmin = this.isAdmin();
    const user = this.getUser();

    // Show/hide elements based on auth state
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = isLoggedIn ? '' : 'none';
    });

    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = isLoggedIn ? 'none' : '';
    });

    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });

    // Update avatar
    if (isLoggedIn && user) {
      const avatar = document.getElementById('navAvatar');
      if (avatar) {
        if (user.photo_url) {
          avatar.src = user.photo_url;
          avatar.alt = user.display_name;
        } else {
          avatar.src = generateAvatarUrl(user.display_name);
          avatar.alt = user.display_name;
        }
      }
    }
  }
};

// ============================================
// Avatar Generator
// ============================================

function generateAvatarUrl(name) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const colors = ['#2d5016', '#1565C0', '#C62828', '#6A1B9A', '#E65100', '#2E7D32', '#AD1457', '#00838F'];
  const color = colors[Math.abs(hashCode(name || '')) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="${color}"/>
    <text x="50" y="55" text-anchor="middle" dy=".1em" fill="white" font-size="38" font-weight="bold" font-family="Arial">${initials}</text>
  </svg>`;

  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  const titles = {
    success: 'Berhasil',
    error: 'Error',
    warning: 'Peringatan',
    info: 'Info'
  };

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `
    <i class="${icons[type] || icons.info} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title || titles[type] || titles.info}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================
// Initialize Auth UI on page load
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  AuthManager.updateUI();
});

