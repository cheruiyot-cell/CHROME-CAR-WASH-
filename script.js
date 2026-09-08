/* =========================================
   CHROME – Main JavaScript (with scroll reveal)
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
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
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
        // Remove active from all chips
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
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
        // initial set
        update();
      }
    });
  }

  // Scroll reveal animations (premium subtle movements)
  const animatedElements = document.querySelectorAll(
    '.section-title, .service-card, .pricing-card, .testimonial-card, .step, .feature-item, .contact-info-card'
  );

  if (animatedElements.length > 0) {
    // add the initial hidden state via CSS class
    animatedElements.forEach(el => el.classList.add('animate-on-scroll'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll-visible');
          observer.unobserve(entry.target); // only animate once
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(el => observer.observe(el));
  }

  // Automatic current year in footer
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});