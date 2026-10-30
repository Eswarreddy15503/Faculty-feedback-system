/**
 * Main Application Coordinator: SPA router, navigation, toast notifications,
 * and page lifecycle management.
 */

let currentPage = 'home';

function initApp() {
  // Navigation Links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.dataset.page;
      if (targetPage) {
        navigateTo(targetPage);
        closeMobileNav();
      }
    });
  });

  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navMenuWrapper = document.getElementById('nav-menu-wrapper');
  if (mobileToggle && navMenuWrapper) {
    mobileToggle.addEventListener('click', () => {
      navMenuWrapper.classList.toggle('mobile-open');
    });
  }

  // Nav CTA Button
  const navCtaBtn = document.getElementById('nav-cta-detect-btn');
  if (navCtaBtn) {
    navCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('detect');
      closeMobileNav();
    });
  }

  // Home CTA Buttons
  const startDetectBtn = document.getElementById('home-start-detect-btn');
  const howItWorksBtn = document.getElementById('home-how-it-works-btn');

  if (startDetectBtn) {
    startDetectBtn.addEventListener('click', () => navigateTo('detect'));
  }
  if (howItWorksBtn) {
    howItWorksBtn.addEventListener('click', () => {
      const processSection = document.getElementById('how-it-works-section');
      if (processSection) {
        processSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Home Quick Action Cards (Upload Image, Upload Video, Use Camera)
  const homeActionImage = document.getElementById('home-action-image');
  const homeActionVideo = document.getElementById('home-action-video');
  const homeActionCamera = document.getElementById('home-action-camera');

  if (homeActionImage) {
    homeActionImage.addEventListener('click', () => {
      if (window.DetectModule) window.DetectModule.setMediaType('image');
      navigateTo('detect');
    });
  }
  if (homeActionVideo) {
    homeActionVideo.addEventListener('click', () => {
      if (window.DetectModule) window.DetectModule.setMediaType('video');
      navigateTo('detect');
    });
  }
  if (homeActionCamera) {
    homeActionCamera.addEventListener('click', () => {
      navigateTo('detect');
      if (window.DetectModule) window.DetectModule.openCameraModal();
    });
  }

  // Sub-modules initialization
  if (window.DetectModule) window.DetectModule.init();
  if (window.ResultModule) window.ResultModule.init();
  if (window.HistoryModule) window.HistoryModule.init();
  if (window.PerformanceModule) window.PerformanceModule.init();
  if (window.ReportModule) window.ReportModule.init();

  // Load initial page from URL hash or default to home
  const initialHash = window.location.hash.replace('#', '');
  if (['home', 'detect', 'history', 'performance', 'about'].includes(initialHash)) {
    navigateTo(initialHash);
  } else {
    navigateTo('home');
  }

  // Fetch quick database stats for Home page
  fetchDatabaseStats();
}

function navigateTo(pageId) {
  currentPage = pageId;
  window.location.hash = pageId;

  // Hide all pages
  const pages = document.querySelectorAll('.page-view');
  pages.forEach(p => p.classList.add('hidden'));

  // Show target page
  const targetEl = document.getElementById(`page-${pageId}`);
  if (targetEl) {
    targetEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav active class
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.dataset.page === pageId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Page-specific lifecycle triggers
  if (pageId === 'history' && window.HistoryModule) {
    window.HistoryModule.load();
  } else if (pageId === 'performance' && window.PerformanceModule) {
    window.PerformanceModule.load();
  } else if (pageId === 'home') {
    fetchDatabaseStats();
  }
}

function closeMobileNav() {
  const navMenuWrapper = document.getElementById('nav-menu-wrapper');
  if (navMenuWrapper) navMenuWrapper.classList.remove('mobile-open');
}

/**
 * Fetch actual database statistics for Home page.
 * If 0 analyses exist, keeps dynamic stats clean and avoids fake numbers.
 */
async function fetchDatabaseStats() {
  const statsContainer = document.getElementById('home-stats-banner');
  const totalCountEl = document.getElementById('home-stat-total');
  const realCountEl = document.getElementById('home-stat-real');
  const fakeCountEl = document.getElementById('home-stat-fake');
  const inconclCountEl = document.getElementById('home-stat-inconcl');

  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const stats = await res.json();

    if (stats.total_analyses > 0 && statsContainer) {
      statsContainer.classList.remove('hidden');
      if (totalCountEl) totalCountEl.textContent = stats.total_analyses;
      if (realCountEl) realCountEl.textContent = stats.real_media;
      if (fakeCountEl) fakeCountEl.textContent = stats.potential_deepfakes;
      if (inconclCountEl) inconclCountEl.textContent = stats.inconclusive || 0;
    } else if (statsContainer) {
      statsContainer.classList.add('hidden');
    }
  } catch (err) {
    console.error('Stats fetch error:', err);
  }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${type === 'error' ? '!' : '✓'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

window.App = {
  init: initApp,
  navigateTo: navigateTo,
  showToast: showToast
};

document.addEventListener('DOMContentLoaded', initApp);
