/* =========================================
   CHROME — Main JavaScript v3.1
   Updates: theme-color sync, dismissible
            announcement, lightbox focus trap
   ========================================= */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth >= 1024;

  /* ---------- Theme ---------- */
  function applyTheme(theme, persist) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (persist) localStorage.setItem('chrome-theme', theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#F5F4F0' : '#0F1115';

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', String(theme === 'light'));
    });
  }

  function initTheme() {
    const stored = localStorage.getItem('chrome-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = stored || (prefersLight ? 'light' : 'dark');
    applyTheme(theme, false);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        applyTheme(isLight ? 'dark' : 'light', true);
      });
    });
  }

  /* ---------- Announcement bar ---------- */
  function initAnnouncementBar() {
    const bar = document.getElementById('announcement-bar');
    if (!bar) return;
    if (localStorage.getItem('chrome-announcement-dismissed') === 'true') {
      bar.classList.add('hidden');
      return;
    }
    const btn = bar.querySelector('.announcement-dismiss');
    if (!btn) return;
    btn.addEventListener('click', () => {
      bar.classList.add('hidden');
      localStorage.setItem('chrome-announcement-dismissed', 'true');
    });
  }

  /* ---------- Sticky header ---------- */
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (!hamburger || !navMenu) return;

    const closeMenu = () => {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      navMenu.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (isDesktop() && navMenu.classList.contains('active')) closeMenu();
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item, i) => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!question || !answer) return;
      const id = answer.id || `faq-${i}-${Math.random().toString(36).slice(2, 7)}`;
      answer.id = id;
      question.setAttribute('aria-expanded', 'false');
      question.setAttribute('aria-controls', id);
      question.addEventListener('click', () => {
        const willOpen = !item.classList.contains('active');
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            const q = other.querySelector('.faq-question');
            if (q) q.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('active', willOpen);
        question.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }

  /* ---------- Gallery filter ---------- */
  function initGalleryFilter() {
    const filterChips = document.querySelectorAll('.filter-chip');
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (!filterChips.length || !galleryItems.length) return;
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        const filter = chip.dataset.filter;
        galleryItems.forEach(item => {
          item.hidden = !(filter === 'all' || item.dataset.category === filter);
        });
      });
    });
  }

  /* ---------- Before/After sliders ---------- */
  function initBeforeAfter() {
    document.querySelectorAll('.before-after').forEach(slider => {
      const range = slider.querySelector('input[type="range"]');
      const afterImg = slider.querySelector('.after-img');
      const divider = slider.querySelector('.divider');
      if (!range || !afterImg || !divider) return;
      const update = () => {
        const val = range.value;
        afterImg.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
        divider.style.left = `${val}%`;
        range.setAttribute('aria-valuetext', `${val}% after`);
      };
      range.addEventListener('input', update);
      update();

      slider.addEventListener('click', (e) => {
        if (e.target === range) return;
        const src = afterImg.src || slider.querySelector('.before-img')?.src;
        if (src) openLightbox(src, slider);
      });

      range.addEventListener('input', () => slider.classList.add('dragged'));
    });
  }

  /* ---------- Lightbox (with focus trap + restore) ---------- */
  let lightboxEl;
  let lightboxTrigger = null;

  function openLightbox(src, trigger) {
    if (!lightboxEl) {
      lightboxEl = document.createElement('div');
      lightboxEl.className = 'lightbox';
      lightboxEl.setAttribute('role', 'dialog');
      lightboxEl.setAttribute('aria-modal', 'true');
      lightboxEl.setAttribute('aria-label', 'Image preview');
      lightboxEl.innerHTML = `
        <button class="lightbox-close" aria-label="Close image">×</button>
        <img alt="">
      `;
      document.body.appendChild(lightboxEl);
      lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
      lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'Tab' && lightboxEl.classList.contains('open')) {
          const focusables = lightboxEl.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      });
    }
    lightboxTrigger = trigger || document.activeElement;
    lightboxEl.querySelector('img').src = src;
    requestAnimationFrame(() => lightboxEl.classList.add('open'));
    document.body.style.overflow = 'hidden';
    lightboxEl.querySelector('.lightbox-close').focus();
  }

  function closeLightbox() {
    if (!lightboxEl || !lightboxEl.classList.contains('open')) return;
    lightboxEl.classList.remove('open');
    document.body.style.overflow = '';
    if (lightboxTrigger && document.contains(lightboxTrigger)) lightboxTrigger.focus();
    lightboxTrigger = null;
  }

  /* ---------- Scroll reveal ---------- */
  function initScrollReveal() {
    const animatedEls = document.querySelectorAll(
      '.section-title, .service-card, .pricing-card, .testimonial-card, .step, .feature-item, .contact-info-card, .service-detail, .benefit, .addon-item, .sg-section, .dash-card'
    );
    const staggers = document.querySelectorAll('.stagger-children');

    if (prefersReduced || !('IntersectionObserver' in window)) {
      animatedEls.forEach(el => el.classList.add('animate-on-scroll-visible'));
      staggers.forEach(el => el.classList.add('revealed'));
      return;
    }

    animatedEls.forEach(el => el.classList.add('animate-on-scroll'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    animatedEls.forEach(el => observer.observe(el));

    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    staggers.forEach(el => staggerObserver.observe(el));
  }

  /* ---------- Hero title reveal ---------- */
  function initHeroReveal() {
    document.querySelectorAll('.hero-reveal').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      const words = text.split(/\s+/);
      el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
    });
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    const callbackForm = document.getElementById('callback-form');
    if (!callbackForm) return;
    const statusDiv = document.getElementById('form-status');
    callbackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = callbackForm.querySelector('#cb-name')?.value.trim() || '';
      const phone = callbackForm.querySelector('#cb-phone')?.value.trim() || '';
      const time = callbackForm.querySelector('#cb-time')?.value.trim() || '';
      const message = callbackForm.querySelector('#cb-message')?.value.trim() || '';
      if (!name || !phone) {
        statusDiv.textContent = 'Please enter your name and phone number.';
        statusDiv.className = 'form-status error';
        return;
      }
      const text = encodeURIComponent(
        `Hello CHROME, I'd like a callback.\n\nName: ${name}\nPhone: ${phone}\n` +
        (time ? `Preferred time: ${time}\n` : '') +
        (message ? `Message: ${message}` : '')
      );
      window.open(`https://wa.me/254702555093?text=${text}`, '_blank', 'noopener');
      statusDiv.textContent = 'Opening WhatsApp… If nothing happens, please call 0702 555 093.';
      statusDiv.className = 'form-status success';
      callbackForm.reset();
    });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    const toggle = () => btn.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Current year ---------- */
  function initYear() {
    document.querySelectorAll('#current-year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Web Components ---------- */
  function initWebComponents() {
    if (!customElements.get('chrome-faq')) {
      customElements.define('chrome-faq', class extends HTMLElement {
        connectedCallback() {
          if (this.dataset.upgraded) return;
          this.dataset.upgraded = '1';
          this.querySelectorAll('.faq-question').forEach((q, i) => {
            const answer = q.nextElementSibling;
            if (!answer) return;
            const id = `cf-${i}-${Math.random().toString(36).slice(2, 7)}`;
            answer.id = id;
            q.setAttribute('aria-expanded', 'false');
            q.setAttribute('aria-controls', id);
            q.addEventListener('click', () => {
              const isOpen = q.getAttribute('aria-expanded') === 'true';
              this.querySelectorAll('.faq-question').forEach(other => {
                if (other !== q) other.setAttribute('aria-expanded', 'false');
                other.parentElement.classList.remove('active');
              });
              q.parentElement.classList.toggle('active', !isOpen);
              q.setAttribute('aria-expanded', String(!isOpen));
            });
          });
        }
      });
    }

    if (!customElements.get('chrome-compare')) {
      customElements.define('chrome-compare', class extends HTMLElement {
        connectedCallback() {
          if (this.dataset.upgraded) return;
          this.dataset.upgraded = '1';
          const before = this.getAttribute('before');
          const after = this.getAttribute('after');
          const label = this.getAttribute('label') || 'Before / After';
          this.innerHTML = `
            <div class="before-after">
              <img src="${before}" alt="Before" class="before-img" loading="lazy" decoding="async">
              <img src="${after}" alt="After" class="after-img" loading="lazy" decoding="async">
              <div class="divider"></div>
              <span class="hint">Drag to compare</span>
              <input type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after">
            </div>
            <p class="text-center mt-1">${label}</p>
          `;
          const slider = this.querySelector('.before-after');
          const range = slider.querySelector('input[type="range"]');
          const afterImg = slider.querySelector('.after-img');
          const divider = slider.querySelector('.divider');
          const update = () => {
            const v = range.value;
            afterImg.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
            divider.style.left = `${v}%`;
            range.setAttribute('aria-valuetext', `${v}% after`);
          };
          range.addEventListener('input', () => { update(); slider.classList.add('dragged'); });
          update();
        }
      });
    }
  }

  /* ---------- PWA ---------- */
  function initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
    let deferredPrompt = null;
    const dismissed = localStorage.getItem('chrome-pwa-dismissed');
    if (dismissed) return;

    const showPrompt = () => {
      if (deferredPrompt && !document.querySelector('.pwa-prompt')) {
        const el = document.createElement('div');
        el.className = 'pwa-prompt';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', 'Install CHROME app');
        el.innerHTML = `
          <div class="pwa-prompt-text">
            <strong>Install CHROME</strong>
            Add to your home screen for faster booking.
          </div>
          <div class="pwa-prompt-actions">
            <button type="button" class="pwa-dismiss">Not now</button>
            <button type="button" class="pwa-install-btn">Install</button>
          </div>
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        el.querySelector('.pwa-dismiss').addEventListener('click', () => {
          localStorage.setItem('chrome-pwa-dismissed', '1');
          el.classList.remove('visible');
          setTimeout(() => el.remove(), 400);
        });
        el.querySelector('.pwa-install-btn').addEventListener('click', async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
          el.classList.remove('visible');
          setTimeout(() => el.remove(), 400);
        });
      }
    };

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(showPrompt, 4000);
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    initAnnouncementBar();
    initHeader();
    initMobileMenu();
    initFaq();
    initGalleryFilter();
    initBeforeAfter();
    initScrollReveal();
    initHeroReveal();
    initContactForm();
    initBackToTop();
    initYear();
    initWebComponents();
    initPWA();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();