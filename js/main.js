// Hero mask reveal — ink panels peel off the hero image once the splash clears
const heroBg = document.getElementById('hero-bg');
const revealHero = () => {
  if (!heroBg) return;
  heroBg.classList.add('is-revealed');
  const mask = heroBg.querySelector('.hero-mask');
  if (mask) setTimeout(() => mask.remove(), 1300);
};

// Launch splash — plays once per browser session
const splash = document.getElementById('splash');
if (splash) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadyShown = sessionStorage.getItem('splashShown');

  if (alreadyShown || reduceMotion) {
    splash.remove();
    requestAnimationFrame(() => requestAnimationFrame(revealHero));
  } else {
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => splash.classList.add('splash-in'));
    setTimeout(() => {
      splash.classList.add('splash-out');
      document.documentElement.style.overflow = '';
      sessionStorage.setItem('splashShown', '1');
      revealHero();
      setTimeout(() => splash.remove(), 650);
    }, 1300);
  }
}

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('flex');
    mobileMenu.classList.toggle('hidden');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Sticky nav shadow state
const nav = document.getElementById('site-nav');
if (nav) {
  const onScroll = () => {
    if (window.scrollY > 8) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Before/After sliders
document.querySelectorAll('.ba-slider').forEach((slider) => {
  const after = slider.querySelector('.ba-overlay');
  const handle = slider.querySelector('.ba-handle');

  const setPosition = (percent) => {
    const clamped = Math.min(100, Math.max(0, percent));
    after.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    handle.style.left = `${clamped}%`;
  };

  const handleMove = (clientX) => {
    const rect = slider.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(percent);
  };

  let dragging = false;
  slider.addEventListener('pointerdown', (e) => {
    dragging = true;
    handleMove(e.clientX);
  });
  window.addEventListener('pointermove', (e) => {
    if (dragging) handleMove(e.clientX);
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  // Keyboard accessibility
  slider.setAttribute('tabindex', '0');
  slider.setAttribute('role', 'slider');
  slider.setAttribute('aria-label', 'Before and after comparison, drag to reveal');
  slider.setAttribute('aria-valuemin', '0');
  slider.setAttribute('aria-valuemax', '100');
  slider.addEventListener('keydown', (e) => {
    const current = parseFloat(handle.style.left) || 50;
    if (e.key === 'ArrowLeft') setPosition(current - 5);
    if (e.key === 'ArrowRight') setPosition(current + 5);
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Contact form → relay to the Novallem inbox via the shared Cloudflare Worker
const CONTACT_RELAY_URL = 'https://novallem-contact-relay.nealechristian4.workers.dev';
const estimateForm = document.getElementById('estimate-form');
if (estimateForm) {
  estimateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(estimateForm);
    const name = (data.get('name') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const service = (data.get('service') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    const note = document.getElementById('form-note');
    const button = estimateForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    if (note) { note.textContent = 'Sending…'; note.className = 'text-xs text-stone text-center'; }

    try {
      const res = await fetch(CONTACT_RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: 'brightline',
          name,
          email,
          business: service,
          message: `Phone: ${phone || '—'}\nService: ${service}\n\n${message || 'No additional details.'}`,
        }),
      });
      if (!res.ok) throw new Error('relay error');
      estimateForm.innerHTML =
        '<div class="text-center py-8"><p class="font-display text-2xl text-ink mb-2">Estimate request sent</p>' +
        '<p class="text-sm text-stone">Thanks — we\'ll be in touch within one business day about your free estimate.</p></div>';
    } catch {
      if (button) button.disabled = false;
      if (note) { note.textContent = 'Something went wrong — please call (555) 010-1234 or try again.'; note.className = 'text-xs text-red-600 text-center'; }
    }
  });
}
