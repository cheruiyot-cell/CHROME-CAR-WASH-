/* =========================================
   CHROME – Main JavaScript (with accessibility)
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

  // Sticky header shadow
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile hamburger menu
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
      navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('active');
      });
    });
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length > 0) {
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        // Close all others
        faqItems.forEach(other => {
          if (other !== item) other.classList.remove('active');
        });
        item.classList.toggle('active');
      });
    });
  }

  // Gallery filter chips
  const filterChips = document.querySelectorAll('.filter-chip');
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (filterChips.length > 0 && galleryItems.length > 0) {
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        const filter = chip.dataset.filter;

        galleryItems.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // Before/After Sliders
  const sliders = document.querySelectorAll('.before-after');
  if (sliders.length > 0) {
    sliders.forEach(slider => {
      const range = slider.querySelector('input[type="range"]');
      const afterImg = slider.querySelector('.after-img');
      const divider = slider.querySelector('.divider');
      if (range && afterImg && divider) {
        const update = () => {
          const val = range.value;
          afterImg.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
          divider.style.left = `${val}%`;
        };
        range.addEventListener('input', update);
        update();
      }
    });
  }

  // Scroll reveal animations (premium subtle movements)
  const animatedElements = document.querySelectorAll(
    '.section-title, .service-card, .pricing-card, .testimonial-card, .step, .feature-item, .contact-info-card'
  );

  if (animatedElements.length > 0) {
    animatedElements.forEach(el => el.classList.add('animate-on-scroll'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(el => observer.observe(el));
  }

  // Contact form handler (callback form)
  const callbackForm = document.getElementById('callback-form');
  if (callbackForm) {
    callbackForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const statusDiv = document.getElementById('form-status');
      const nameInput = callbackForm.querySelector('input[type="text"]');
      const phoneInput = callbackForm.querySelector('input[type="tel"]');

      if (!nameInput.value.trim() || !phoneInput.value.trim()) {
        statusDiv.textContent = 'Please fill in your name and phone number.';
        statusDiv.style.color = 'red';
        return;
      }

      // Simulate submission (replace with actual AJAX or WhatsApp link if needed)
      statusDiv.textContent = 'Thank you! We will call you back within 30 minutes.';
      statusDiv.style.color = 'green';
      callbackForm.reset();
    });
  }

  // Automatic current year in footer
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});