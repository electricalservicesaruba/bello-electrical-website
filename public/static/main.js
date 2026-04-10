// ===========================
// BELLO ELECTRICAL SERVICES
// Main JavaScript
// ===========================

(function () {
  'use strict';

  // ---- NAVBAR SCROLL BEHAVIOR ----
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  let isMenuOpen = false;

  // Create overlay for mobile menu
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  function handleScroll() {
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (navMenu) navMenu.classList.toggle('open', isMenuOpen);
    overlay.classList.toggle('open', isMenuOpen);
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    // Animate hamburger
    if (navToggle) {
      const spans = navToggle.querySelectorAll('span');
      if (isMenuOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    }
  }

  function closeMenu() {
    if (isMenuOpen) toggleMenu();
  }

  if (navToggle) navToggle.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);

  // Close menu on nav link click
  if (navMenu) {
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Run on load

  // ---- CONTACT FORM HANDLER ----
  const form = document.getElementById('contactForm');
  const statusDiv = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        service: formData.get('service'),
        message: formData.get('message'),
      };

      // Update button state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Sending...</span>';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        statusDiv.style.display = 'block';
        if (result.success) {
          statusDiv.className = 'form-status success';
          statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.message;
          form.reset();
          // Scroll to status
          statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          statusDiv.className = 'form-status error';
          statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (result.error || 'Something went wrong. Please try again.');
        }
      } catch (err) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'form-status error';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Unable to send message. Please call us directly.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Send Message</span>';
      }
    });
  }

  // ---- SMOOTH SCROLL FOR ANCHOR LINKS ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ---- INTERSECTION OBSERVER FOR ANIMATIONS ----
  const animateOnScroll = (selector, className = 'animate-visible', threshold = 0.1) => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });

    elements.forEach(el => observer.observe(el));
  };

  animateOnScroll('.service-card', 'visible');
  animateOnScroll('.client-card', 'visible');
  animateOnScroll('.value-card', 'visible');
  animateOnScroll('.why-feature', 'visible');
  animateOnScroll('.stat-card', 'visible');
  animateOnScroll('.team-photo-item', 'visible');

  // ---- SERVICE CARDS STAGGER ANIMATION ----
  const style = document.createElement('style');
  style.textContent = `
    .service-card, .client-card, .value-card, .why-feature, .stat-card, .team-photo-item {
      opacity: 0;
      transform: translateY(25px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .service-card.visible, .client-card.visible, .value-card.visible,
    .why-feature.visible, .stat-card.visible, .team-photo-item.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .service-card:nth-child(1), .client-card:nth-child(1), .value-card:nth-child(1), .stat-card:nth-child(1) { transition-delay: 0s; }
    .service-card:nth-child(2), .client-card:nth-child(2), .value-card:nth-child(2), .stat-card:nth-child(2) { transition-delay: 0.08s; }
    .service-card:nth-child(3), .client-card:nth-child(3), .value-card:nth-child(3), .stat-card:nth-child(3) { transition-delay: 0.16s; }
    .service-card:nth-child(4), .client-card:nth-child(4), .value-card:nth-child(4), .stat-card:nth-child(4) { transition-delay: 0.24s; }
    .service-card:nth-child(5), .client-card:nth-child(5), .value-card:nth-child(5) { transition-delay: 0.32s; }
    .service-card:nth-child(6), .client-card:nth-child(6), .value-card:nth-child(6) { transition-delay: 0.4s; }
    .service-card:nth-child(7) { transition-delay: 0.48s; }
    .service-card:nth-child(8) { transition-delay: 0.56s; }
  `;
  document.head.appendChild(style);

  // ---- STAT COUNTER ANIMATION ----
  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const range = target - start;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      element.textContent = current + (element.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // Observe stat numbers for counter animation
  const statNumbers = document.querySelectorAll('.stat-number, .stat-number-lg');
  if (statNumbers.length) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent.trim();
          const num = parseInt(text.replace(/\D/g, ''));
          const suffix = text.replace(/[\d,]/g, '');
          if (num && !isNaN(num)) {
            el.dataset.suffix = suffix;
            animateCounter(el, num);
            statObserver.unobserve(el);
          }
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));
  }

  // ---- ACTIVE NAV LINK ----
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath !== '/' && href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

})();
