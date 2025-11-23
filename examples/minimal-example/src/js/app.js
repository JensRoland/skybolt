/**
 * Main Application JavaScript
 *
 * Loaded asynchronously via Skybolt
 */

console.log('🚀 Skybolt v2 + Vite - Application loaded!');

// Add fade-in animation to cards on scroll
const observeCards = () => {
  const cards = document.querySelectorAll('.card');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  cards.forEach((card) => observer.observe(card));
};

// Smooth scroll for anchor links
const setupSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
};

// Display cache stats (for demo purposes)
const displayCacheStats = () => {
  const stats = {
    localStorage: !!window.localStorage.getItem('sb_cache'),
    entries: 0,
  };

  if (stats.localStorage) {
    try {
      const cache = JSON.parse(window.localStorage.getItem('sb_cache'));
      stats.entries = Object.keys(cache).length;
    } catch (e) {
      // Ignore
    }
  }

  console.log('📦 Skybolt Cache Stats:', stats);

  // Add stats to page
  const statsEl = document.getElementById('cache-stats');
  if (statsEl) {
    statsEl.textContent = stats.localStorage
      ? `✅ ${stats.entries} assets cached in localStorage`
      : '⏳ Building cache... (reload to see cached assets)';
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observeCards();
    setupSmoothScroll();
    displayCacheStats();
  });
} else {
  observeCards();
  setupSmoothScroll();
  displayCacheStats();
}

// Log performance metrics
window.addEventListener('load', () => {
  if (performance.getEntriesByType) {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      console.log('⚡ Performance Metrics:', {
        'DOM Content Loaded': `${Math.round(perfData.domContentLoadedEventEnd)}ms`,
        'Page Load': `${Math.round(perfData.loadEventEnd)}ms`,
        'Transfer Size': `${Math.round(perfData.transferSize / 1024)}KB`,
      });
    }
  }
});
