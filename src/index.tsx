import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Redirect non-www to www (canonical domain)
app.use('*', async (c, next) => {
  const host = c.req.header('host') || ''
  if (host === 'electricalservicesaruba.com') {
    const url = new URL(c.req.url)
    url.host = 'www.electricalservicesaruba.com'
    return c.redirect(url.toString(), 301)
  }
  await next()
})

app.use('/static/*', serveStatic({ root: './' }))

// Contact form API — sends via Web3Forms
const WEB3FORMS_KEY = 'cf54359d-1332-4b22-b060-c3c8e16f750d'

app.post('/api/contact', async (c) => {
  const body = await c.req.json()
  const { name, email, phone, company, service, message } = body

  if (!name || !email || !message) {
    return c.json({ success: false, error: 'Please fill in all required fields.' }, 400)
  }

  // Build email subject and body
  const subject = service
    ? `New BES Inquiry — ${service} — ${name}`
    : `New BES Inquiry from ${name}`

  const emailBody = `
New contact form submission from the BES website:

Name:     ${name}
Email:    ${email}
Phone:    ${phone || 'Not provided'}
Company:  ${company || 'Not provided'}
Service:  ${service || 'Not specified'}

Message:
${message}

---
Sent from electricalservicesaruba.com
  `.trim()

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject,
        from_name: name,
        email: email,
        message: emailBody,
        botcheck: ''
      })
    })

    const result = await response.json() as { success: boolean; message?: string }

    if (result.success) {
      return c.json({
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.'
      })
    } else {
      return c.json({
        success: false,
        error: 'Failed to send message. Please call our office at +297 594 1089.'
      }, 500)
    }
  } catch (err) {
    return c.json({
      success: false,
      error: 'Unable to send message. Please call our office at +297 594 1089.'
    }, 500)
  }
})

app.get('/',        (c) => c.html(homePage()))
app.get('/services',(c) => c.html(servicesPage()))
app.get('/about',   (c) => c.html(aboutPage()))
app.get('/contact', (c) => c.html(contactPage()))
app.get('/case-studies', (c) => c.html(caseStudiesPage()))
app.get('/industries/restaurants',       (c) => c.html(industryRestaurantsPage()))
app.get('/industries/property-managers', (c) => c.html(industryPropertyManagersPage()))
app.get('/industries/developers',        (c) => c.html(industryDevelopersPage()))
app.get('/industries/emergency',         (c) => c.html(industryEmergencyPage()))

// ── 301 REDIRECTS — old Wix pages → correct new pages ──────────────────────
// Old service pages → /services
const serviceRedirects = [
  '/service-page/home-repair-service',
  '/service-page/electrician',
  '/service-page/solar-panel-installation',
  '/service-page/ev-charging',
  '/service-page/electrical-maintenance',
  '/service-page/energy-audit',
  '/service-page/emergency-power',
  '/service-page/battery-storage',
  '/services-1',
  '/services-2',
  '/our-services',
]
serviceRedirects.forEach(path => {
  app.get(path, (c) => c.redirect('/services', 301))
})

// Old contact/booking pages → /contact
const contactRedirects = [
  '/book-online',
  '/booking',
  '/book',
  '/quote',
  '/get-a-quote',
  '/free-quote',
  '/request-quote',
]
contactRedirects.forEach(path => {
  app.get(path, (c) => c.redirect('/contact', 301))
})

// Old about/team/careers pages → /about
const aboutRedirects = [
  '/about-us',
  '/about-1',
  '/team',
  '/our-team',
  '/careers',
  '/jobs',
  '/vacancies',
]
aboutRedirects.forEach(path => {
  app.get(path, (c) => c.redirect('/about', 301))
})

// Old project/portfolio pages → home
const homeRedirects = [
  '/projects',
  '/projects-1',
  '/projects-8',
  '/portfolio',
  '/gallery',
  '/blank-1',
  '/blank-2',
  '/blog',
  '/news',
  '/faq',
]
homeRedirects.forEach(path => {
  app.get(path, (c) => c.redirect('/', 301))
})

// SEO: serve sitemap and robots at root
app.get('/sitemap.xml', async (c) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.electricalservicesaruba.com/</loc><lastmod>2026-04-25</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/services</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/about</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/contact</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/case-studies</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.85</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/industries/restaurants</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/industries/property-managers</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/industries/developers</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/industries/emergency</loc><lastmod>2026-04-25</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`
  return c.text(sitemap, 200, { 'Content-Type': 'application/xml; charset=UTF-8' })
})

app.get('/robots.txt', (c) => {
  const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://www.electricalservicesaruba.com/sitemap.xml`
  return c.text(robots, 200, { 'Content-Type': 'text/plain; charset=UTF-8' })
})

// Branded 404 — noindex so Google drops old cached pages fast
app.notFound((c) => c.html(notFoundPage(), 404))

/* ==============================
   SHARED HELPERS
============================== */
const PHONE                = '+297 594 1089'
const PHONE_LINK           = 'tel:+2975941089'
const PHONE_EMERGENCY      = '+297 594 0104'
const PHONE_EMERGENCY_LINK = 'tel:+2975940104'
const WHATSAPP             = 'https://wa.me/2975941089'
const EMAIL       = 'info@electricalservicesaruba.com'
const WEBSITE     = 'www.electricalservicesaruba.com'
const FACEBOOK    = 'https://www.facebook.com/belloelectricalaruba'
const INSTAGRAM   = 'https://www.instagram.com/electricalservicesaruba'
const GOOGLE_BIZ  = 'https://share.google/acyUf0XCSQZBAJiIp'

function head(title: string, desc: string, path: string = '', keywords: string = '', ogType: string = 'website') {
  const canonical = `https://www.electricalservicesaruba.com${path}`
  const ogImage   = 'https://www.electricalservicesaruba.com/static/images/hero-electrician-panel.jpg'
  const kw = keywords ||
    'electrician Aruba, electrical services Aruba, commercial electrician Aruba, residential electrician Aruba, solar panel installation Aruba, NEN 1010 certified, EV charging station Aruba, Bello Electrical Services, BES Aruba, licensed electrician Aruba'

  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} — Bello Electrical Services | Aruba</title>
    <meta name="description" content="${desc}">
    <meta name="keywords" content="${kw}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="Bello Electrical Services">
    <meta name="geo.region" content="AW">
    <meta name="geo.placename" content="Aruba">
    <link rel="canonical" href="${canonical}">

    <!-- Open Graph / Facebook -->
    <meta property="fb:app_id" content="966242223397117">
    <meta property="og:type" content="${ogType}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${title} — Bello Electrical Services | Aruba">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="en_US">
    <meta property="og:site_name" content="Bello Electrical Services">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title} — Bello Electrical Services | Aruba">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${ogImage}">

    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-WYHXCJX8E7"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-WYHXCJX8E7');
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="/static/style.css">
    <link rel="icon" type="image/png" href="/static/logo-transparent.png">
  `
}

function navbar(active: string) {
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/static/logo-transparent.png" alt="Bello Electrical Services" class="logo-img">
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-menu" id="navMenu">
        <li><a href="/" class="nav-link${active === '/' ? ' active' : ''}">Home</a></li>
        <li><a href="/services" class="nav-link${active === '/services' ? ' active' : ''}">Services</a></li>
        <li class="nav-dropdown">
          <a href="#" class="nav-link nav-link-dropdown${active.startsWith('/industries') ? ' active' : ''}">Industries <i class="fas fa-chevron-down nav-arrow"></i></a>
          <ul class="nav-dropdown-menu">
            <li><a href="/industries/restaurants"><i class="fas fa-utensils"></i> Restaurants &amp; Hospitality</a></li>
            <li><a href="/industries/property-managers"><i class="fas fa-building"></i> Property Managers</a></li>
            <li><a href="/industries/developers"><i class="fas fa-hard-hat"></i> Developers &amp; Builders</a></li>
            <li><a href="/industries/emergency"><i class="fas fa-bolt"></i> Emergency &amp; 24/7</a></li>
          </ul>
        </li>
        <li><a href="/case-studies" class="nav-link${active === '/case-studies' ? ' active' : ''}">Case Studies</a></li>
        <li><a href="/about" class="nav-link${active === '/about' ? ' active' : ''}">About Us</a></li>
        <li><a href="/contact" class="nav-link${active === '/contact' ? ' active' : ''}">Contact</a></li>
        <li><a href="/contact#quote" class="nav-cta">Get a Quote</a></li>
      </ul>
    </div>
  </nav>`
}

function footer() {
  return `
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="/static/logo-transparent.png" alt="Bello Electrical Services" class="footer-logo">
          <p class="footer-tagline"><i class="fas fa-bolt"></i> Shockingly Good. Watt-Ever You Need.</p>
          <p class="footer-description">Licensed, certified &amp; insured electrical contractor serving Aruba since 2019. NEN 1010 compliant work on every project.</p>
          <div class="footer-social">
            <a href="${FACEBOOK}"   target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="${INSTAGRAM}"  target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="${WHATSAPP}"   target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            <a href="${GOOGLE_BIZ}" target="_blank" rel="noopener" aria-label="Google Business"><i class="fab fa-google"></i></a>
          </div>
        </div>
        <div class="footer-links">
          <h4>Services</h4>
          <ul>
            <li><a href="/services#installation">Electrical Installation</a></li>
            <li><a href="/services#solar">Solar Panel Installation</a></li>
            <li><a href="/services#maintenance">Preventive Maintenance</a></li>
            <li><a href="/services#ev">EV Charging Stations</a></li>
            <li><a href="/services#battery">Battery Storage Systems</a></li>
            <li><a href="/services#emergency">Emergency Power Systems</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/about#founder">Our Founder</a></li>
            <li><a href="/about#team">Our Team</a></li>
            <li><a href="/case-studies">Case Studies</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/contact#quote">Request a Quote</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Industries</h4>
          <ul>
            <li><a href="/industries/restaurants">Restaurants &amp; Hospitality</a></li>
            <li><a href="/industries/property-managers">Property Managers</a></li>
            <li><a href="/industries/developers">Developers &amp; Builders</a></li>
            <li><a href="/industries/emergency">Emergency &amp; 24/7</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contact</h4>
          <ul class="footer-contact-list">
            <li><i class="fas fa-map-marker-alt"></i><span>Aruba, ABC Islands</span></li>
            <li><i class="fas fa-phone"></i><a href="${PHONE_LINK}">${PHONE} (Office)</a></li>
            <li><i class="fas fa-phone-alt"></i><a href="${PHONE_EMERGENCY_LINK}">${PHONE_EMERGENCY} (Emergency)</a></li>
            <li><i class="fab fa-whatsapp"></i><a href="${WHATSAPP}" target="_blank">WhatsApp Us</a></li>
            <li><i class="fas fa-envelope"></i><a href="mailto:${EMAIL}">${EMAIL}</a></li>
            <li><i class="fas fa-globe"></i><a href="https://${WEBSITE}" target="_blank">${WEBSITE}</a></li>
          </ul>
          <div class="footer-hours">
            <h5>Business Hours</h5>
            <p>Mon – Fri: 8:00 AM – 5:00 PM</p>
            <p>Emergency Support: 24/7</p>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Bello Electrical Services and More. All rights reserved.</p>
        <p>Licensed &amp; Insured &bull; NEN 1010 Compliant &bull; Serving Aruba &amp; Bonaire</p>
      </div>
    </div>
  </footer>

  <!-- WhatsApp Float Button -->
  <a href="${WHATSAPP}" target="_blank" rel="noopener" class="whatsapp-float" aria-label="Chat on WhatsApp">
    <i class="fab fa-whatsapp"></i>
    <span class="whatsapp-float-tooltip">Chat on WhatsApp</span>
  </a>

  <script src="/static/main.js"></script>`
}

/* ==============================
   HOME PAGE
============================== */
function homePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Commercial Electrician Aruba', 'Bello Electrical Services – Certified commercial & residential electrician in Aruba. Trusted by restaurants, hotels, developers & property managers. Solar, EV charging, NEN 1010 compliant.', '/', 'commercial electrician Aruba, electrical contractor Aruba, electrician Aruba, electrical services Aruba, solar panel Aruba, EV charging Aruba, NEN 1010, Bello Electrical Services')}
<link rel="preload" as="image" href="/static/images/hero-electrician-panel.jpg" fetchpriority="high">
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.electricalservicesaruba.com/#website",
      "url": "https://www.electricalservicesaruba.com",
      "name": "Bello Electrical Services",
      "description": "Certified & insured electrical contractor in Aruba",
      "publisher": { "@id": "https://www.electricalservicesaruba.com/#organization" }
    },
    {
      "@type": ["LocalBusiness", "ElectricalContractor"],
      "@id": "https://www.electricalservicesaruba.com/#organization",
      "name": "Bello Electrical Services",
      "alternateName": "BES Aruba",
      "url": "https://www.electricalservicesaruba.com",
      "logo": "https://www.electricalservicesaruba.com/static/logo-transparent.png",
      "image": "https://www.electricalservicesaruba.com/static/images/hero-electrician-panel.jpg",
      "description": "Certified & insured electrical contractor in Aruba offering residential and commercial electrical services, solar panel installation, EV charging, and more since 2019.",
      "telephone": "+2975941089",
      "email": "info@electricalservicesaruba.com",
      "foundingDate": "2019",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Aruba",
        "addressCountry": "AW"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": 12.5211, "longitude": -69.9683 },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
          "opens": "08:00",
          "closes": "17:00"
        }
      ],
      "legalName": "Power B Electrical Services VBA",
      "numberOfEmployees": { "@type": "QuantitativeValue", "value": 6 },
      "currenciesAccepted": "AWG, USD",
      "paymentAccepted": "Cash, Bank Transfer",
      "sameAs": [
        "https://www.facebook.com/belloelectricalaruba",
        "https://www.instagram.com/electricalservicesaruba"
      ],
      "priceRange": "$$",
      "areaServed": { "@type": "Island", "name": "Aruba" }
    }
  ]
})}</script></head>
<body>
${navbar('/')}

<!-- HERO -->
<section class="hero" id="home">
  <div class="hero-bg">
    <img src="/static/images/hero-electrician-panel.jpg" alt="Bello Electrical Services technician inspecting panel" class="hero-bg-img">
    <div class="hero-overlay"></div>
  </div>
  <div class="hero-content">
    <div class="hero-badge"><i class="fas fa-building"></i>&nbsp; Aruba's Commercial Electrical Partner</div>
    <h1 class="hero-title">
      The Electrician<br>
      <span class="hero-highlight">Aruba Businesses Trust.</span>
    </h1>
    <p class="hero-subtitle">
      Restaurants, hotels, developers, and property managers across Aruba rely on BES for safe, NEN 1010 compliant electrical work. Certified subcontractors. Fast response. Consistent quality. 20+ years of hands-on experience.
    </p>
    <div class="hero-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Quote</a>
      <a href="/case-studies" class="btn btn-outline btn-lg"><i class="fas fa-folder-open"></i> See Our Work</a>
    </div>
    <div class="hero-stats">
      <div class="stat-item">
        <span class="stat-number">20+</span>
        <span class="stat-label">Years Experience</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">500+</span>
        <span class="stat-label">Projects Done</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">NEN</span>
        <span class="stat-label">1010 Compliant</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">24/7</span>
        <span class="stat-label">Emergency Support</span>
      </div>
    </div>
  </div>
  <a href="#trust" class="hero-scroll"><i class="fas fa-chevron-down"></i></a>
</section>

<!-- TRUST BAR -->
<section class="trust-bar" id="trust">
  <div class="trust-container">
    <div class="trust-item"><i class="fas fa-certificate"></i><span>Registered &amp; Licensed</span></div>
    <div class="trust-item"><i class="fas fa-shield-alt"></i><span>NEN 1010 Compliant</span></div>
    <div class="trust-item"><i class="fas fa-clock"></i><span>Fast Response Times</span></div>
    <div class="trust-item"><i class="fas fa-hard-hat"></i><span>Certified Electricians</span></div>
    <div class="trust-item"><i class="fas fa-handshake"></i><span>Long-Term Partnerships</span></div>
  </div>
</section>

<!-- SERVICES OVERVIEW -->
<section class="section" id="services">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Our Services</div>
      <h2 class="section-title">Everything Electrical,<br><span>Done Right.</span></h2>
      <p class="section-subtitle">From installation to maintenance, solar to EV charging, BES handles it all for residential and commercial clients across Aruba.</p>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-plug"></i></div>
        <h3>Electrical Installation</h3>
        <p>Complete wiring, distribution boards, switches, and sockets for new builds and renovations.</p>
        <a href="/services#installation" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card featured">
        <div class="service-badge">Popular</div>
        <div class="service-icon"><i class="fas fa-solar-panel"></i></div>
        <h3>Solar Panel Installation</h3>
        <p>Grid-tied and off-grid PV systems designed and installed for maximum energy savings in Aruba's sun.</p>
        <a href="/services#solar" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-clipboard-check"></i></div>
        <h3>Preventive Maintenance</h3>
        <p>Scheduled inspections, testing, and servicing to keep systems running safely and efficiently.</p>
        <a href="/services#maintenance" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-search"></i></div>
        <h3>Troubleshooting &amp; Repair</h3>
        <p>Systematic diagnosis and fast repair of electrical faults, outages, and equipment failures.</p>
        <a href="/services#troubleshooting" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-car-battery"></i></div>
        <h3>EV Charging Stations</h3>
        <p>Installation of Level 2 and DC fast charging stations for residential, commercial &amp; public sites.</p>
        <a href="/services#ev" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-leaf"></i></div>
        <h3>Energy Efficiency Audits</h3>
        <p>Thorough assessments and practical upgrades to reduce your energy bills and carbon footprint.</p>
        <a href="/services#audit" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-battery-full"></i></div>
        <h3>Battery Storage Systems</h3>
        <p>Design and installation of battery systems for energy independence and backup power.</p>
        <a href="/services#battery" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-bolt"></i></div>
        <h3>Emergency Power Systems</h3>
        <p>UPS systems and backup generators to ensure continuity during outages for critical operations.</p>
        <a href="/services#emergency" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
    <div class="section-cta">
      <a href="/services" class="btn btn-primary">View All Services</a>
    </div>
  </div>
</section>

<!-- WHY CHOOSE BES -->
<section class="section why-us">
  <div class="container">
    <div class="why-us-inner">
      <div class="why-us-images">
        <div class="why-img-main">
          <img src="/static/images/team-solar-thumbsup.jpg" alt="BES team on solar installation in Aruba" loading="lazy">
        </div>
        <div class="why-img-secondary">
          <img src="/static/images/team-solar-install.jpg" alt="BES installing solar panels" loading="lazy">
        </div>
        <div class="why-img-badge">
          <span class="badge-number">2019</span>
          <span class="badge-text">Founded in Aruba</span>
        </div>
      </div>
      <div class="why-us-content">
        <div class="section-tag">Why Choose BES?</div>
        <h2 class="section-title">The Electrical Partner<br><span>Businesses Trust</span></h2>
        <p class="section-subtitle" style="text-align:left;max-width:none;">While others compete on price, BES stands apart through fast response, clean work and clear communication. We don't just complete jobs. We build lasting relationships.</p>
        <div class="why-features">
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-certificate"></i></div>
            <div class="feature-content">
              <h4>Certified &amp; Insured</h4>
              <p>Registered electrical contractor with 20+ years of industry experience. Fully insured on every job.</p>
            </div>
          </div>
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="feature-content">
              <h4>NEN 1010 Compliant</h4>
              <p>All work meets the Dutch NEN 1010 electrical safety standard applied in Aruba. No exceptions.</p>
            </div>
          </div>
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-comments"></i></div>
            <div class="feature-content">
              <h4>Clear Communication</h4>
              <p>We keep you informed from quote to completion. No surprises, no excuses.</p>
            </div>
          </div>
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-clock"></i></div>
            <div class="feature-content">
              <h4>On Time, Every Time</h4>
              <p>We respect your schedule and your operations. Projects are delivered on time, on budget.</p>
            </div>
          </div>
        </div>
        <a href="/about" class="btn btn-primary">Learn More About BES</a>
      </div>
    </div>
  </div>
</section>

<!-- WHO WE SERVE — enhanced with dedicated industry pages -->
<section class="section section-alt" id="industries">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Industries We Serve</div>
      <h2 class="section-title">Built for Aruba's<br><span>Business Community</span></h2>
      <p class="section-subtitle">From kitchens to construction sites, we understand each industry's electrical demands. Explore how BES serves your sector.</p>
    </div>
    <div class="industry-cards-grid">

      <a href="/industries/restaurants" class="industry-card">
        <div class="industry-card-icon"><i class="fas fa-utensils"></i></div>
        <div class="industry-card-body">
          <h3>Restaurants &amp; Hospitality</h3>
          <p>High-demand kitchen circuits, bar power, dining lighting, HVAC, and fire safety systems. We minimize downtime for food &amp; beverage operations.</p>
          <div class="industry-card-clients">Clients: Moomba Beach, Jolly Pirates, Le Petit Chef, Kokoa, Casa Tua &amp; more</div>
        </div>
        <div class="industry-card-arrow"><i class="fas fa-arrow-right"></i></div>
      </a>

      <a href="/industries/property-managers" class="industry-card">
        <div class="industry-card-icon"><i class="fas fa-building"></i></div>
        <div class="industry-card-body">
          <h3>Property Managers</h3>
          <p>Preventive maintenance contracts, multi-unit wiring, compliance inspections, and rapid repair response. Keep every property code-compliant and operational.</p>
          <div class="industry-card-clients">Ideal for: apartment complexes, commercial buildings, resort properties</div>
        </div>
        <div class="industry-card-arrow"><i class="fas fa-arrow-right"></i></div>
      </a>

      <a href="/industries/developers" class="industry-card">
        <div class="industry-card-icon"><i class="fas fa-hard-hat"></i></div>
        <div class="industry-card-body">
          <h3>Developers &amp; Builders</h3>
          <p>Ground-up electrical design and installation for new construction projects. Full coordination from permit drawings through final inspection and handover.</p>
          <div class="industry-card-clients">Ideal for: villas, commercial fit-outs, mixed-use developments</div>
        </div>
        <div class="industry-card-arrow"><i class="fas fa-arrow-right"></i></div>
      </a>

      <a href="/industries/emergency" class="industry-card industry-card-emergency">
        <div class="industry-card-icon"><i class="fas fa-bolt"></i></div>
        <div class="industry-card-body">
          <h3>Emergency &amp; 24/7 Response</h3>
          <p>Power outages, tripped breakers, equipment failures — BES responds fast. Our emergency line is available around the clock to get your operations back online.</p>
          <div class="industry-card-clients">Available: 24 hours a day, 7 days a week across Aruba</div>
        </div>
        <div class="industry-card-arrow"><i class="fas fa-arrow-right"></i></div>
      </a>

    </div>
    <div class="section-cta">
      <a href="/contact#quote" class="btn btn-primary"><i class="fas fa-file-alt"></i> Tell Us About Your Project</a>
    </div>
  </div>
</section>

<!-- CASE STUDIES TEASER -->
<section class="section case-studies-teaser">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Real Projects</div>
      <h2 class="section-title">From the <span>Job Site</span></h2>
      <p class="section-subtitle">Short breakdowns of real BES projects — the problem, our approach, and the result.</p>
    </div>
    <div class="case-teaser-grid">

      <div class="case-teaser-card">
        <div class="case-teaser-tag">Restaurant</div>
        <h3>Moomba Beach — Kitchen Circuit Upgrade</h3>
        <p class="case-teaser-problem"><strong>Problem:</strong> Tripping breakers in a high-volume kitchen causing service interruptions during peak hours.</p>
        <p class="case-teaser-outcome"><strong>Outcome:</strong> New dedicated circuits installed during off-hours. Zero downtime since commissioning.</p>
        <a href="/case-studies#moomba" class="case-teaser-link">Read full case <i class="fas fa-arrow-right"></i></a>
      </div>

      <div class="case-teaser-card">
        <div class="case-teaser-tag">Commercial Build</div>
        <h3>Developer Villa — Full Electrical Build</h3>
        <p class="case-teaser-problem"><strong>Problem:</strong> New 4-unit villa complex needed electrical design, installation, and ELMAR inspection from scratch.</p>
        <p class="case-teaser-outcome"><strong>Outcome:</strong> Delivered on schedule with full NEN 1010 certification and ELMAR sign-off.</p>
        <a href="/case-studies#villa" class="case-teaser-link">Read full case <i class="fas fa-arrow-right"></i></a>
      </div>

      <div class="case-teaser-card">
        <div class="case-teaser-tag">Solar + Storage</div>
        <h3>Business Owner — Solar ROI in 4 Years</h3>
        <p class="case-teaser-problem"><strong>Problem:</strong> High ELMAR bills making operations unsustainable for a mid-size retail business.</p>
        <p class="case-teaser-outcome"><strong>Outcome:</strong> 24-panel rooftop system with battery storage installed. Monthly bill reduced by 70%.</p>
        <a href="/case-studies#solar-retail" class="case-teaser-link">Read full case <i class="fas fa-arrow-right"></i></a>
      </div>

    </div>
    <div class="section-cta">
      <a href="/case-studies" class="btn btn-primary"><i class="fas fa-folder-open"></i> View All Case Studies</a>
    </div>
  </div>
</section>

<!-- TEAM TEASER -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Our People</div>
      <h2 class="section-title">The Team Behind<br><span>Every Project</span></h2>
      <p class="section-subtitle">From management to the field, every BES team member is trained, certified, and committed to delivering quality work on every job in Aruba.</p>
    </div>

    <!-- Group photos -->
    <div class="team-photos-row">
      <div class="team-photo-item">
        <img src="/static/images/team-5-van.jpg" alt="BES technical field team Aruba" loading="lazy">
        <div class="team-photo-label">Field Team</div>
      </div>
      <div class="team-photo-item">
        <img src="/static/images/team-full-van.jpg" alt="BES full team Aruba" loading="lazy">
        <div class="team-photo-label">The Full Team</div>
      </div>
    </div>

    <div class="section-cta" style="margin-top:2.5rem;">
      <a href="/about#team" class="btn btn-primary"><i class="fas fa-users"></i> Meet the Team</a>
    </div>
  </div>
</section>

<!-- MEET THE FOUNDER -->
<section class="section founder-home-section" id="meet-founder">
  <div class="container">
    <div class="founder-home-inner">
      <div class="founder-home-image">
        <img src="/static/images/person-luis-bello.jpg" alt="Luis Bello – Founder & Director of Operations, Bello Electrical Services" loading="lazy">
        <div class="founder-home-badge">
          <i class="fas fa-star"></i>
          <span>Founded 2019</span>
        </div>
      </div>
      <div class="founder-home-content">
        <div class="section-tag">Meet the Founder</div>
        <h2 class="section-title">Built on 20+ Years of<br><span>Hands-On Experience</span></h2>
        <p class="founder-home-lead">"I started BES because I saw businesses struggling to find a reliable, professional electrical contractor. That's what we built and that's what we deliver every single day."</p>
        <p>Luis Bello is a certified electrician and entrepreneur who has been serving Aruba for over 20 years. His expertise spans electrical wiring and repair, professional drafting, and electrical inspection, giving him a full view of every project from design to delivery.</p>
        <div class="founder-home-creds">
          <span><i class="fas fa-certificate"></i> Certified Electrician</span>
          <span><i class="fas fa-plane"></i> Private Pilot</span>
          <span><i class="fas fa-hard-hat"></i> 20+ Yrs Experience</span>
          <span><i class="fas fa-shield-alt"></i> NEN 1010 Specialist</span>
          <span><i class="fas fa-solar-panel"></i> Solar Certified</span>
        </div>
        <div class="founder-home-actions">
          <a href="/about#founder" class="btn btn-primary">Full Story</a>
          <a href="/contact" class="btn btn-outline">Work With Us</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- GOOGLE REVIEWS -->
<section class="section reviews-section">
  <div class="container">
    <div class="reviews-header-row">
      <div class="section-header" style="margin-bottom:0;text-align:left;">
        <div class="section-tag">Google Reviews</div>
        <h2 class="section-title" style="margin-bottom:0;">What Our Clients<br><span>Say About Us</span></h2>
      </div>
      <div class="google-rating-badge">
        <div class="google-logo-text">
          <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
        </div>
        <div class="google-rating-info">
          <span class="google-score">5.0</span>
          <div class="google-stars-row">
            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
          </div>
          <span class="google-review-count">5-star reviews on Google</span>
        </div>
      </div>
    </div>
    <div class="reviews-grid">

      <!-- Review 1 — Christian Sanchez (real) -->
      <div class="review-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-header">
          <div class="reviewer-avatar" style="background:#4285F4;">C</div>
          <div class="reviewer-info">
            <h4>Christian Sanchez</h4>
            <span>2 months ago</span>
          </div>
        </div>
        <div class="review-stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="review-text">Very professional and reliable — fixed our electrical problem the same day. They coordinated directly with ELMAR, making it completely stress-free. Fast, trustworthy, highly recommended!</p>
      </div>

      <!-- Review 2 — Yuraima Wernet (real) -->
      <div class="review-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-header">
          <div class="reviewer-avatar" style="background:#34A853;">Y</div>
          <div class="reviewer-info">
            <h4>Yuraima Wernet</h4>
            <span>a year ago</span>
          </div>
        </div>
        <div class="review-stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="review-text">Exceptional service and professionalism! Outstanding neatness and top-quality results. They took the time to explain everything clearly. My only regret? Not hiring them from the start of my renovation!</p>
      </div>

      <!-- Review 3 — Henriette Bangma (real) -->
      <div class="review-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-header">
          <div class="reviewer-avatar" style="background:#EA4335;">H</div>
          <div class="reviewer-info">
            <h4>Henriette Bangma</h4>
            <span>4 months ago</span>
          </div>
        </div>
        <div class="review-stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="review-text">They hung a huge lamp in a stairwell at 10 meters height — a very challenging task! Excellent job, super nice and professional guys!</p>
      </div>

      <!-- Review 4 — Mitchell Tromp (real) -->
      <div class="review-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-header">
          <div class="reviewer-avatar" style="background:#FBBC05; color:#333;">M</div>
          <div class="reviewer-info">
            <h4>Mitchell Tromp</h4>
            <span>4 months ago</span>
          </div>
        </div>
        <div class="review-stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="review-text">The person who answered the phone was very sweet and attentive — guided me to the right service. Fast service, professional team. Great job!</p>
      </div>

      <!-- Review 5 — Brandon Tromp (real) -->
      <div class="review-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-header">
          <div class="reviewer-avatar" style="background:#0F9D58;">B</div>
          <div class="reviewer-info">
            <h4>Brandon Tromp</h4>
            <span>4 months ago</span>
          </div>
        </div>
        <div class="review-stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="review-text">Outstanding experience from start to finish. Professional, responsive, and genuinely committed to delivering high quality service. Would absolutely recommend!</p>
      </div>

      <!-- Review 6 — Jon Wilde (real) -->
      <div class="review-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-header">
          <div class="reviewer-avatar" style="background:#9C27B0;">J</div>
          <div class="reviewer-info">
            <h4>Jon Wilde</h4>
            <span>6 months ago</span>
          </div>
        </div>
        <div class="review-stars">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="review-text">Highly recommend — fair price, showed up on time, and stuck to their estimate even when the job was bigger than expected. Very knowledgeable and professional crew.</p>
      </div>

      <!-- Review CTA card -->
      <div class="review-card review-cta-card">
        <i class="fab fa-google review-google-icon"></i>
        <div class="review-cta-inner">
          <div class="google-stars-row" style="justify-content:center;margin-bottom:1rem;">
            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
          </div>
          <h4 style="color:var(--navy);font-family:'Montserrat',sans-serif;font-size:1.05rem;margin-bottom:0.5rem;">Happy with our work?</h4>
          <p style="color:#555;font-size:0.875rem;margin-bottom:1.5rem;">Share your experience on Google and help other businesses in Aruba find a reliable electrical partner.</p>
          <a href="${GOOGLE_BIZ}" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:0.875rem;padding:0.65rem 1.5rem;">
            <i class="fab fa-google"></i>&nbsp; Leave a Review
          </a>
        </div>
      </div>

    </div>
    <div class="reviews-cta-row">
      <a href="${GOOGLE_BIZ}" target="_blank" rel="noopener">
        <i class="fab fa-google"></i> View All Our Google Reviews
      </a>
    </div>
  </div>
</section>

<!-- CLIENT LOGOS -->
<section class="section clients-section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Trusted By</div>
      <h2 class="section-title">Businesses That <span>Trust BES</span></h2>
      <p class="section-subtitle">From restaurants and resorts to shops and entertainment venues. Aruba's best businesses rely on Bello Electrical Services.</p>
    </div>
    <div class="clients-marquee-wrapper">
      <div class="clients-marquee">
        <div class="clients-track">
          <div class="client-logo-item"><img src="/static/images/clients/moomba-beach.png" alt="Moomba Beach" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/jolly-pirates.png" alt="Jolly Pirates" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/le-petit-chef.png" alt="Le Petit Chef" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/kokoa-restaurant.png" alt="Kokoa Restaurant" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/casa-tua.png" alt="Casa Tua" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/mambo-jambo.png" alt="Mambo Jambo" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/hadicurari-restaurant.png" alt="Hadicurari Restaurant" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/salt-pepper.png" alt="Salt & Pepper" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/sopranos-piano-bar.png" alt="Soprano's Piano Bar" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/bohemian-bar.png" alt="Bohemian Bar" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/aruba-wine-dine.png" alt="Aruba Wine & Dine" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/cafe-the-plaza.png" alt="Café The Plaza" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/patrizias-aruba.png" alt="Patrizia's Aruba" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/game-over-escape.png" alt="Game Over Escape Room" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/indulge-catering.png" alt="Indulge Catering" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/fishes-more.png" alt="Fishes & More" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/nos-clubhuis.png" alt="Nos Clubhuis" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/bananas-apartments.png" alt="Bananas Apartments" loading="lazy"></div>
          <!-- Duplicate set for seamless loop -->
          <div class="client-logo-item"><img src="/static/images/clients/moomba-beach.png" alt="Moomba Beach" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/jolly-pirates.png" alt="Jolly Pirates" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/le-petit-chef.png" alt="Le Petit Chef" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/kokoa-restaurant.png" alt="Kokoa Restaurant" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/casa-tua.png" alt="Casa Tua" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/mambo-jambo.png" alt="Mambo Jambo" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/hadicurari-restaurant.png" alt="Hadicurari Restaurant" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/salt-pepper.png" alt="Salt & Pepper" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/sopranos-piano-bar.png" alt="Soprano's Piano Bar" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/bohemian-bar.png" alt="Bohemian Bar" loading="lazy"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Ready to Get Started?</h2>
    <p>Send us a message or call now for a site visit and quote. We respond within 24 hours.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Quote</a>
      <a href="${PHONE_LINK}" class="btn btn-white btn-lg"><i class="fas fa-phone"></i> Call ${PHONE}</a>
    </div>
    <p class="cta-note"><i class="fas fa-clock"></i> Typical response within 24 hours &nbsp;|&nbsp; <i class="fab fa-whatsapp"></i> <a href="${WHATSAPP}" target="_blank" style="color:inherit;">WhatsApp available</a></p>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   SERVICES PAGE
============================== */
function servicesPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Electrical Services in Aruba', 'Bello Electrical Services offers 8 expert electrical services in Aruba: new installations, solar panels, preventive maintenance, EV charging stations, battery storage, energy audits, emergency power & troubleshooting. NEN 1010 certified.', '/services', 'electrical services Aruba, solar panel installation Aruba, EV charging station Aruba, battery storage Aruba, electrical maintenance Aruba, emergency electrician Aruba, energy audit Aruba, NEN 1010')}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Service","serviceType":"Electrical Services","provider":{"@type":"ElectricalContractor","name":"Bello Electrical Services","url":"https://www.electricalservicesaruba.com","telephone":"+2975941089"},"areaServed":{"@type":"Island","name":"Aruba"},"hasOfferCatalog":{"@type":"OfferCatalog","name":"BES Electrical Services","itemListElement":[{"@type":"Offer","itemOffered":{"@type":"Service","name":"New Electrical Installations","description":"Complete wiring and panel upgrades for residential and commercial properties in Aruba."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"Solar Panel Installation","description":"Grid-tied and off-grid solar systems for homes and businesses in Aruba."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"EV Charging Stations","description":"Level 2 home and commercial EV charger installation in Aruba."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"Preventive Maintenance","description":"Scheduled electrical inspections and maintenance for homes and businesses."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"Battery Storage Systems","description":"Energy storage installation to maximise solar self-consumption."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"Emergency Electrical Services","description":"24/7 emergency electrician available across Aruba."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"Energy Audits","description":"Identify energy waste and reduce electricity bills with a professional audit."}},{"@type":"Offer","itemOffered":{"@type":"Service","name":"Electrical Troubleshooting","description":"Diagnose and fix any electrical faults fast and safely."}}]}})}</script></head>
<body>
${navbar('/services')}

<section class="page-hero">
  <div class="page-hero-bg">
    <img src="/static/images/tech-panel-testing.jpg" alt="BES electrical panel work" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i>Services</div>
    <h1>Our Services</h1>
    <p>8 core electrical services, all NEN 1010 compliant and all delivered with precision</p>
  </div>
</section>

<!-- SERVICES INTRO -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">BES Services</div>
      <h2 class="section-title">Electrical Solutions<br><span>From Small to Large</span></h2>
      <p class="section-subtitle">Whether you're changing a light fixture or installing a full solar system with battery storage, BES has the certification, tools, and team to get it done right in Aruba.</p>
    </div>
    <div class="trust-container" style="background:var(--navy);border-radius:16px;padding:1.25rem 2rem;justify-content:space-around;">
      <div class="trust-item"><i class="fas fa-certificate"></i><span>NEN 1010 Standard</span></div>
      <div class="trust-item"><i class="fas fa-home"></i><span>Residential</span></div>
      <div class="trust-item"><i class="fas fa-building"></i><span>Commercial</span></div>
      <div class="trust-item"><i class="fas fa-industry"></i><span>Industrial</span></div>
      <div class="trust-item"><i class="fas fa-map-marker-alt"></i><span>Aruba &amp; Bonaire</span></div>
    </div>
  </div>
</section>

<!-- SERVICE 1: ELECTRICAL INSTALLATION -->
<section class="section" id="installation">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="/static/images/tech-walking-tools.jpg" alt="Electrical installation Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">01</div>
        <div class="service-nen-badge"><i class="fas fa-certificate"></i> NEN 1010 Compliant</div>
        <div class="section-tag">Core Service</div>
        <h2>Electrical Installation</h2>
        <p>Setting up electrical wiring, fixtures, and equipment in buildings and facilities. We install distribution boards, switches, sockets, and all electrical components while ensuring full protection against shock, fire hazards, and all electrical risks.</p>
        <p>We serve new construction, commercial fit-outs, and renovations for both residential and commercial clients across Aruba and Bonaire.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Distribution board installation</li>
          <li><i class="fas fa-check-circle"></i> Full wiring for new builds &amp; renovations</li>
          <li><i class="fas fa-check-circle"></i> Three-phase commercial systems</li>
          <li><i class="fas fa-check-circle"></i> Load calculation &amp; system design</li>
          <li><i class="fas fa-check-circle"></i> GFCI &amp; AFCI protection</li>
          <li><i class="fas fa-check-circle"></i> Final inspection &amp; compliance sign-off</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 2: SOLAR -->
<section class="section section-alt" id="solar">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="/static/images/service-solar-install.jpg" alt="Solar panel installation Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">02</div>
        <div class="service-nen-badge"><i class="fas fa-sun"></i> Renewable Energy</div>
        <div class="section-tag">Trending</div>
        <h2>Solar Panel Installation</h2>
        <p>Mounting photovoltaic (PV) panels on rooftops and structures to convert Aruba's abundant sunlight into electricity. We design the optimal layout, handle all wiring, install inverters, and commission your system for maximum output.</p>
        <p>Aruba's sunny climate makes solar an exceptional ROI investment. BES handles both grid-connected and off-grid setups.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Rooftop &amp; ground-mount PV systems</li>
          <li><i class="fas fa-check-circle"></i> Grid-tied &amp; off-grid configurations</li>
          <li><i class="fas fa-check-circle"></i> Inverter selection &amp; installation</li>
          <li><i class="fas fa-check-circle"></i> System commissioning &amp; monitoring</li>
          <li><i class="fas fa-check-circle"></i> Post-installation maintenance</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 3: MAINTENANCE -->
<section class="section" id="maintenance">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="/static/images/tech-panel-testing.jpg" alt="Electrical maintenance Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">03</div>
        <div class="service-nen-badge"><i class="fas fa-tools"></i> Preventive</div>
        <div class="section-tag">Most Requested</div>
        <h2>Preventive Electrical Maintenance</h2>
        <p>Regular maintenance ensures electrical systems operate efficiently and safely, minimizing costly downtime. BES provides tailored maintenance programs with scheduled visits that work around your business operations.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Scheduled inspection visits</li>
          <li><i class="fas fa-check-circle"></i> Component cleaning &amp; testing</li>
          <li><i class="fas fa-check-circle"></i> Connection tightening &amp; verification</li>
          <li><i class="fas fa-check-circle"></i> Earth fault circuit breaker servicing</li>
          <li><i class="fas fa-check-circle"></i> Thermal imaging inspections</li>
          <li><i class="fas fa-check-circle"></i> Compliance documentation</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 4: TROUBLESHOOTING -->
<section class="section section-alt" id="troubleshooting">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="/static/images/tech-panel-portrait.jpg" alt="Electrical troubleshooting Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">04</div>
        <div class="service-nen-badge"><i class="fas fa-search"></i> Diagnostics</div>
        <div class="section-tag">Fast Response</div>
        <h2>Troubleshooting &amp; Repairs</h2>
        <p>Systematic diagnosis of root causes for power outages, equipment malfunctions, and energy losses. Our certified team uses advanced diagnostic tools to locate faults quickly and execute precise repairs to restore your operations.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Power outage diagnosis &amp; repair</li>
          <li><i class="fas fa-check-circle"></i> Equipment malfunction analysis</li>
          <li><i class="fas fa-check-circle"></i> Short circuit &amp; overload resolution</li>
          <li><i class="fas fa-check-circle"></i> Ground fault testing</li>
          <li><i class="fas fa-check-circle"></i> Wiring fault location &amp; repair</li>
          <li><i class="fas fa-check-circle"></i> Post-repair testing &amp; verification</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 5: EV CHARGING -->
<section class="section" id="ev">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="/static/images/service-ev-charging.jpg" alt="EV charging station installation Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">05</div>
        <div class="service-nen-badge"><i class="fas fa-car-battery"></i> EV Infrastructure</div>
        <div class="section-tag">Growing Demand</div>
        <h2>EV Charging Station Installation</h2>
        <p>As electric vehicles grow in Aruba, businesses and homeowners need reliable charging infrastructure. BES installs Level 2 and DC fast charging stations at residential, commercial, and public locations, fully compliant with NEN 1010.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Site assessment &amp; load calculation</li>
          <li><i class="fas fa-check-circle"></i> Level 1, Level 2 &amp; DC fast charging</li>
          <li><i class="fas fa-check-circle"></i> Residential &amp; commercial installations</li>
          <li><i class="fas fa-check-circle"></i> Smart charging systems</li>
          <li><i class="fas fa-check-circle"></i> Fleet charging infrastructure</li>
          <li><i class="fas fa-check-circle"></i> NEN 1010 safety compliance</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 6: ENERGY AUDIT -->
<section class="section section-alt" id="audit">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="/static/images/service-energy-audit.jpg" alt="Energy efficiency audit Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">06</div>
        <div class="service-nen-badge"><i class="fas fa-leaf"></i> Sustainability</div>
        <div class="section-tag">Save Money</div>
        <h2>Energy Efficiency Audits</h2>
        <p>A thorough assessment of energy use within your building or facility. We analyze your energy bills, inspect equipment, and provide concrete recommendations from lighting upgrades to HVAC optimization to significantly reduce your operating costs.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Comprehensive energy consumption analysis</li>
          <li><i class="fas fa-check-circle"></i> Equipment efficiency assessment</li>
          <li><i class="fas fa-check-circle"></i> LED lighting upgrade recommendations</li>
          <li><i class="fas fa-check-circle"></i> HVAC optimization planning</li>
          <li><i class="fas fa-check-circle"></i> ROI calculation for upgrades</li>
          <li><i class="fas fa-check-circle"></i> Written report &amp; action plan</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 7: BATTERY STORAGE -->
<section class="section" id="battery">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="/static/images/service-battery-storage.jpg" alt="Battery storage systems Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">07</div>
        <div class="service-nen-badge"><i class="fas fa-battery-full"></i> Energy Storage</div>
        <div class="section-tag">Energy Independence</div>
        <h2>Battery Storage Systems</h2>
        <p>Store electrical energy generated by solar panels or the grid for later use. BES designs and installs battery systems that enhance your energy security, reduce peak demand charges, and provide backup during outages.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> Solar + battery system integration</li>
          <li><i class="fas fa-check-circle"></i> Grid-connected storage solutions</li>
          <li><i class="fas fa-check-circle"></i> Backup power configuration</li>
          <li><i class="fas fa-check-circle"></i> Peak shaving &amp; load shifting</li>
          <li><i class="fas fa-check-circle"></i> Battery management systems (BMS)</li>
          <li><i class="fas fa-check-circle"></i> Remote monitoring setup</li>
        </ul>
        <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- SERVICE 8: EMERGENCY POWER -->
<section class="section section-alt" id="emergency">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="/static/images/service-emergency-power.jpg" alt="Emergency power systems installation Aruba" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">08</div>
        <div class="service-nen-badge"><i class="fas fa-bolt"></i> 24/7 Critical</div>
        <div class="section-tag">Always Ready</div>
        <h2>Emergency Power Systems</h2>
        <p>Uninterruptible power supplies (UPS) and backup generators provide continuous power for critical facilities like hospitals, data centers, hotels, and commercial operations that cannot afford downtime.</p>
        <ul class="service-features">
          <li><i class="fas fa-check-circle"></i> UPS system design &amp; installation</li>
          <li><i class="fas fa-check-circle"></i> Backup generator installation</li>
          <li><i class="fas fa-check-circle"></i> Automatic transfer switch (ATS)</li>
          <li><i class="fas fa-check-circle"></i> Load prioritization planning</li>
          <li><i class="fas fa-check-circle"></i> Regular testing &amp; maintenance</li>
          <li><i class="fas fa-check-circle"></i> 24/7 emergency response support</li>
        </ul>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <a href="/contact#quote" class="btn btn-primary">Request a Quote</a>
          <a href="${PHONE_EMERGENCY_LINK}" class="btn btn-danger"><i class="fas fa-phone"></i> Emergency: ${PHONE_EMERGENCY}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Not Sure What You Need?</h2>
    <p>Contact us for a free consultation. We'll assess your needs and recommend the most efficient solution.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Get a Quote</a>
      <a href="${WHATSAPP}" target="_blank" class="btn btn-white btn-lg"><i class="fab fa-whatsapp"></i> WhatsApp Us</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   ABOUT PAGE
============================== */
function aboutPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('About Us – Our Story & Team', 'Learn about Bello Electrical Services – founded in 2019 by Luis Bello in Aruba. 20+ years of hands-on experience, a certified team, and NEN 1010 compliant work on every project.', '/about', 'about Bello Electrical Services, Luis Bello electrician Aruba, certified electrician team Aruba, NEN 1010 Aruba, electrical contractor history Aruba')}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"AboutPage","url":"https://www.electricalservicesaruba.com/about","name":"About Bello Electrical Services","description":"Bello Electrical Services was founded in 2019 by Luis Bello in Aruba. The company provides licensed, certified and insured electrical contracting services with 20+ years of experience.","mainEntity":{"@type":"ElectricalContractor","name":"Bello Electrical Services","foundingDate":"2019","founder":{"@type":"Person","name":"Luis Bello","jobTitle":"Director of Operations"},"numberOfEmployees":{"@type":"QuantitativeValue","value":7},"url":"https://www.electricalservicesaruba.com","telephone":"+2975941089","address":{"@type":"PostalAddress","addressLocality":"Aruba","addressCountry":"AW"}}})}</script></head>
<body>
${navbar('/about')}

<section class="page-hero">
  <div class="page-hero-bg">
    <img src="/static/images/team-full-van2.jpg" alt="BES full team Aruba" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i>About Us</div>
    <h1>About Bello Electrical</h1>
    <p>Aruba's certified electrical contractor, founded in 2019 and powered by 20+ years of expertise</p>
  </div>
</section>

<!-- COMPANY STORY -->
<section class="section">
  <div class="container">
    <div class="about-story">
      <div class="about-story-content">
        <div class="section-tag">Our Story</div>
        <h2 class="section-title">Built for Aruba.<br><span>Built to Last.</span></h2>
        <p>Bello Electrical Services and More (BES) was founded in <strong>2019</strong> as a sole proprietorship by Luis Bello, a certified electrician with over 20 years of hands-on experience in electrical wiring, repair, professional drafting, and inspection. In 2024, BES became a Limited Liability Company (LLC), reflecting the company's continued growth and long-term commitment to Aruba.</p>
        <p>BES was born from a clear need in the Aruban market: businesses and homeowners deserved a reliable electrical partner that combined technical excellence with professional communication and consistent quality. That vision still drives every project we take on today.</p>
        <p>From small residential repairs to complex commercial installations and full solar systems, BES delivers exceptional results. The company has expanded its services across Aruba and Bonaire, with a growing portfolio of residential, commercial, and industrial clients.</p>
        <div class="about-quote">
          <blockquote>"Electricity is our source of energy and your business is our mission."</blockquote>
          <cite>— Luis Bello, Founder &amp; Lead Electrician</cite>
        </div>
      </div>
      <div class="about-story-image">
        <img src="/static/images/team-5-van.jpg" alt="BES team at work in Aruba" loading="lazy">
      </div>
    </div>
  </div>
</section>

<!-- FOUNDER -->
<section class="section founder-section" id="founder">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Leadership</div>
      <h2 class="section-title">Meet Our <span>Founder</span></h2>
    </div>
    <div class="founder-card">
      <div class="founder-image">
        <img src="/static/images/person-luis-bello.jpg" alt="Luis Bello - Founder & Director of Operations, BES" loading="lazy">
        <div class="founder-image-overlay">
          <span class="founder-name">Luis Bello</span>
          <span class="founder-role">Founder &amp; Lead Electrician, BES</span>
        </div>
      </div>
      <div class="founder-content">
        <h2>Luis Bello</h2>
        <p>Luis Bello is a certified electrician and entrepreneur with over 20 years of hands-on experience in Aruba. His background covers electrical wiring and repair, professional drafting, and electrical inspection, giving him the full technical picture from design to final delivery.</p>
        <p>Born and raised in Aruba, Luis built his career by working across residential, commercial, and industrial projects throughout the island. His depth of knowledge and dedication to quality are what sets BES apart.</p>
        <p>"I started BES because I saw businesses struggling to find a reliable, professional electrical contractor. That's what we built and that's what we deliver every single day."</p>
        <div class="founder-credentials">
          <span class="credential-badge"><i class="fas fa-certificate"></i> Certified Electrician</span>
          <span class="credential-badge"><i class="fas fa-plane"></i> Certified Private Pilot</span>
          <span class="credential-badge"><i class="fas fa-hard-hat"></i> 20+ Years Experience</span>
          <span class="credential-badge"><i class="fas fa-shield-alt"></i> NEN 1010 Specialist</span>
          <span class="credential-badge"><i class="fas fa-solar-panel"></i> Solar Certified</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- VALUES -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Our Values</div>
      <h2 class="section-title">What Drives <span>Every Project</span></h2>
    </div>
    <div class="values-grid">
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-shield-alt"></i></div>
        <h3>Safety First</h3>
        <p>Every job is executed to NEN 1010 safety standards. No shortcuts, no compromises. Safety is non-negotiable.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-medal"></i></div>
        <h3>Quality Work</h3>
        <p>We take pride in clean, professional installations. If it has our name on it, it meets the highest standard.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-clock"></i></div>
        <h3>On Time</h3>
        <p>We respect your time and your business operations. Projects are completed on schedule, period.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-comments"></i></div>
        <h3>Clear Communication</h3>
        <p>You'll always know what's happening. We give clear updates, honest timelines, and no technical jargon.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-handshake"></i></div>
        <h3>Trusted Partner</h3>
        <p>We build long-term relationships. Many of our clients have been with us since we opened in 2019.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-graduation-cap"></i></div>
        <h3>Certified Expertise</h3>
        <p>Our team stays current with the latest technologies, from solar to EV charging to battery storage.</p>
      </div>
    </div>
  </div>
</section>

<!-- TEAM -->
<section class="section" id="team">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Our Team</div>
      <h2 class="section-title">The People Behind <span>Every Project</span></h2>
      <p class="section-subtitle">Trained electricians, designers, administrators, and field technicians united by a commitment to quality and safety on every job.</p>
    </div>

    <!-- Leadership cards -->
    <div class="section-tag" style="margin-bottom:1.5rem;">Leadership</div>
    <div class="team-cards-grid" style="margin-bottom:3rem;">

      <div class="team-card team-card-leader">
        <div class="team-card-photo">
          <img src="/static/images/person-luis-bello.jpg" alt="Luis Bello – Director of Operations" loading="lazy">
        </div>
        <div class="team-card-info">
          <h3>Luis Bello</h3>
          <span class="team-role">Director of Operations</span>
          <p>Founder and certified electrician with 20+ years of industry experience. Luis leads all project operations, maintains NEN 1010 standards, and drives BES's expansion across Aruba and Bonaire.</p>
          <div class="team-badges">
            <span><i class="fas fa-certificate"></i> Certified Electrician</span>
            <span><i class="fas fa-plane"></i> Private Pilot</span>
            <span><i class="fas fa-hard-hat"></i> 20+ Yrs</span>
            <span><i class="fas fa-shield-alt"></i> NEN 1010</span>
          </div>
        </div>
      </div>

      <div class="team-card team-card-leader">
        <div class="team-card-photo">
          <img src="/static/images/person-eliseth.jpg" alt="Eliseth Bello – Managing Director" loading="lazy">
        </div>
        <div class="team-card-info">
          <h3>Eliseth Bello</h3>
          <span class="team-role">Managing Director</span>
          <p>Co-founder and Managing Director who oversees the company's strategic direction, daily operations, and team management. Her leadership ensures BES consistently delivers professional, client-first service.</p>
          <div class="team-badges">
            <span><i class="fas fa-briefcase"></i> Business Management</span>
            <span><i class="fas fa-users"></i> Team Leadership</span>
            <span><i class="fas fa-chart-line"></i> Strategy</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Staff grid -->
    <div class="section-tag" style="margin-bottom:1.5rem;">Our Team</div>
    <div class="team-staff-grid">

      <div class="team-staff-card">
        <div class="team-staff-photo">
          <img src="/static/images/person-genesis.jpg" alt="Genesis Nunez Monsalve – Project Administrator" loading="lazy">
        </div>
        <div class="team-staff-info">
          <h4>Genesis Nunez Monsalve</h4>
          <span class="team-role-sm">Project Administrator</span>
          <p>Manages scheduling, invoicing, and all client communications. She is the organizational force that keeps every BES project on time and clients fully informed.</p>
        </div>
      </div>

      <div class="team-staff-card team-staff-card--andric">
        <div class="team-staff-photo">
          <img src="/static/images/person-andric.jpg" alt="Andric Feliciano – Electrical Design & Project Technician" loading="lazy">
        </div>
        <div class="team-staff-info">
          <h4>Andric Feliciano</h4>
          <span class="team-role-sm">Electrical Design &amp; Project Technician</span>
          <p>Responsible for electrical system design and project technical execution. He translates client needs into safe, efficient, and compliant electrical plans.</p>
        </div>
      </div>

      <div class="team-staff-card">
        <div class="team-staff-photo">
          <img src="/static/images/person-steven.jpg" alt="Steven Croes – Electrician" loading="lazy">
        </div>
        <div class="team-staff-info">
          <h4>Steven Croes</h4>
          <span class="team-role-sm">Electrician</span>
          <p>Certified field electrician specializing in commercial wiring, distribution panel work, and electrical maintenance. Steven is known for his precision and clean installation work.</p>
        </div>
      </div>

      <div class="team-staff-card">
        <div class="team-staff-photo">
          <img src="/static/images/person-michael.jpg" alt="Michael Osborne – Electrical Assistant Solar & Installation" loading="lazy">
        </div>
        <div class="team-staff-info">
          <h4>Michael Osborne</h4>
          <span class="team-role-sm">Electrical Assistant Solar &amp; Installation</span>
          <p>Supports solar PV installations and electrical fit-outs across Aruba. Michael brings enthusiasm and skill to every rooftop and on-site installation project.</p>
        </div>
      </div>

      <div class="team-staff-card">
        <div class="team-staff-photo">
          <img src="/static/images/person-myron.jpg" alt="Myron Saladin – Intern" loading="lazy">
        </div>
        <div class="team-staff-info">
          <h4>Myron Saladin</h4>
          <span class="team-role-sm">Intern</span>
          <p>Learning the trade hands-on alongside the BES team, developing skills in electrical work, safety protocols, and professional standards.</p>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- STATS -->
<section class="section stats-section">
  <div class="container">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
        <div class="stat-number-lg">2019</div>
        <div class="stat-label-lg">Founded in Aruba</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-hard-hat"></i></div>
        <div class="stat-number-lg">20+</div>
        <div class="stat-label-lg">Years of Experience</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-project-diagram"></i></div>
        <div class="stat-number-lg">500+</div>
        <div class="stat-label-lg">Projects Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-map-marker-alt"></i></div>
        <div class="stat-number-lg">2</div>
        <div class="stat-label-lg">Islands Served</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Ready to Work Together?</h2>
    <p>Let's discuss your project and build something reliable, safe, and efficient.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-envelope"></i> Contact Us Today</a>
      <a href="/services" class="btn btn-white btn-lg"><i class="fas fa-bolt"></i> View Services</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   CONTACT PAGE
============================== */
function contactPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Contact Us', 'Contact Bello Electrical Services in Aruba. Office: +297 594 1089. Emergency 24/7: +297 594 0104. Send a message or WhatsApp for a fast response within 24 hours.', '/contact', 'contact electrician Aruba, call electrician Aruba, WhatsApp electrician Aruba, electrical quote Aruba, Bello Electrical contact')}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"ContactPage","url":"https://www.electricalservicesaruba.com/contact","name":"Contact Bello Electrical Services","description":"Get in touch with Bello Electrical Services in Aruba. We respond within 24 hours.","mainEntity":{"@type":"ElectricalContractor","name":"Bello Electrical Services","telephone":"+2975941089","email":"info@electricalservicesaruba.com","url":"https://www.electricalservicesaruba.com","contactPoint":[{"@type":"ContactPoint","telephone":"+2975941089","contactType":"customer service","availableLanguage":["English","Spanish","Dutch","Papiamento"],"hoursAvailable":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:00","closes":"17:00"}},{"@type":"ContactPoint","telephone":"+2975941089","contactType":"emergency","hoursAvailable":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"00:00","closes":"23:59"}}]}})}</script></head>
<body>
${navbar('/contact')}

<section class="page-hero page-hero-short">
  <div class="page-hero-overlay-solid"></div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i>Contact</div>
    <h1>Contact Us</h1>
    <p>Send us a message or give us a call. We respond within 24 hours.</p>
  </div>
</section>

<section class="section contact-section" id="quote">
  <div class="container">
    <div class="contact-grid">
      <!-- FORM -->
      <div class="contact-form-wrapper">
        <div class="form-header">
          <h2>Send Us a Message</h2>
          <p>Tell us about your project and we'll get back to you within 24 hours.</p>
        </div>
        <form class="contact-form" id="contactForm">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Full Name *</label>
              <input type="text" id="name" name="name" placeholder="Your full name" required>
            </div>
            <div class="form-group">
              <label for="email">Email Address *</label>
              <input type="email" id="email" name="email" placeholder="your@email.com" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone / WhatsApp</label>
              <input type="tel" id="phone" name="phone" placeholder="+297 000-0000">
            </div>
            <div class="form-group">
              <label for="company">Company Name</label>
              <input type="text" id="company" name="company" placeholder="Your company (optional)">
            </div>
          </div>
          <div class="form-group">
            <label for="service">Service Needed</label>
            <select id="service" name="service">
              <option value="">Select a service...</option>
              <option value="installation">Electrical Installation</option>
              <option value="solar">Solar Panel Installation</option>
              <option value="maintenance">Preventive Maintenance</option>
              <option value="troubleshooting">Troubleshooting &amp; Repair</option>
              <option value="ev">EV Charging Station</option>
              <option value="audit">Energy Efficiency Audit</option>
              <option value="battery">Battery Storage System</option>
              <option value="emergency">Emergency Power System</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="message">Project Details *</label>
            <textarea id="message" name="message" rows="5" placeholder="Describe your project: location, scope, timeline and any specific requirements..." required></textarea>
          </div>
          <div id="formStatus" class="form-status" style="display:none;"></div>
          <button type="submit" class="btn btn-primary btn-full" id="submitBtn">
            <i class="fas fa-paper-plane"></i>
            <span>Send Message</span>
          </button>
          <p class="form-note"><i class="fas fa-lock"></i> Your information is secure and will never be shared with third parties.</p>
        </form>
      </div>

      <!-- CONTACT INFO -->
      <div class="contact-info-wrapper">
        <div class="contact-info-card">
          <h3>Get In Touch</h3>
          <div class="contact-info-items">
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fas fa-map-marker-alt"></i></div>
              <div class="contact-info-content">
                <h4>Location</h4>
                <p>Aruba, ABC Islands</p>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fas fa-phone"></i></div>
              <div class="contact-info-content">
                <h4>Office Hours</h4>
                <a href="${PHONE_LINK}">${PHONE}</a>
                <p style="font-size:0.8rem;color:var(--gray-400);margin-top:0.2rem;">Mon–Fri 8 AM–5 PM</p>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon" style="background:rgba(227,6,19,0.1);color:var(--red);"><i class="fas fa-phone-alt"></i></div>
              <div class="contact-info-content">
                <h4>Emergency Line <span style="font-size:0.75rem;background:var(--red);color:#fff;padding:0.15rem 0.5rem;border-radius:100px;font-family:'Montserrat',sans-serif;font-weight:700;">24/7</span></h4>
                <a href="${PHONE_EMERGENCY_LINK}" style="color:var(--red);font-weight:700;">${PHONE_EMERGENCY}</a>
                <p style="font-size:0.8rem;color:var(--gray-400);margin-top:0.2rem;">Power outages &amp; urgent faults</p>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fab fa-whatsapp"></i></div>
              <div class="contact-info-content">
                <h4>WhatsApp</h4>
                <a href="${WHATSAPP}" target="_blank">Send a WhatsApp Message</a>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fas fa-envelope"></i></div>
              <div class="contact-info-content">
                <h4>Email</h4>
                <a href="mailto:${EMAIL}">${EMAIL}</a>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fas fa-globe"></i></div>
              <div class="contact-info-content">
                <h4>Website</h4>
                <a href="https://${WEBSITE}" target="_blank">${WEBSITE}</a>
              </div>
            </div>
          </div>
          <div class="contact-hours">
            <h4><i class="fas fa-clock"></i> Business Hours</h4>
            <div class="hours-grid">
              <div class="hours-row"><span>Monday – Friday</span><span>8:00 AM – 5:00 PM</span></div>
              <div class="hours-row"><span>Saturday</span><span>By Appointment</span></div>
              <div class="hours-row emergency"><span>Emergency Line</span><span><a href="${PHONE_EMERGENCY_LINK}" style="color:inherit;font-weight:700;">${PHONE_EMERGENCY}</a></span></div>
            </div>
          </div>
          <div class="contact-social">
            <h4>Follow &amp; Connect</h4>
            <div class="social-links">
              <a href="${FACEBOOK}"   target="_blank" rel="noopener" class="social-link" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="${INSTAGRAM}"  target="_blank" rel="noopener" class="social-link" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="${WHATSAPP}"   target="_blank" rel="noopener" class="social-link whatsapp" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
              <a href="${GOOGLE_BIZ}" target="_blank" rel="noopener" class="social-link google" aria-label="Google Business"><i class="fab fa-google"></i></a>
            </div>
          </div>
        </div>
        <div class="contact-team-img">
          <img src="/static/images/team-5-van.jpg" alt="BES team ready to help" loading="lazy">
          <div class="contact-team-caption">
            <i class="fas fa-hard-hat"></i>
            <span>Our team is ready to help. Call, WhatsApp, or email us.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   CASE STUDIES PAGE
============================== */
function caseStudiesPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Case Studies', 'Real electrical projects completed by Bello Electrical Services in Aruba. See how BES solved commercial, restaurant, solar, and emergency electrical challenges across the island.', '/case-studies', 'electrical contractor case studies Aruba, BES project results Aruba, commercial electrician projects Aruba, solar installation results Aruba')}
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "url": "https://www.electricalservicesaruba.com/case-studies",
  "name": "Case Studies – Bello Electrical Services",
  "description": "Real commercial electrical projects completed by BES across Aruba.",
  "provider": { "@type": "ElectricalContractor", "name": "Bello Electrical Services", "url": "https://www.electricalservicesaruba.com" }
})}</script></head>
<body>
${navbar('/case-studies')}

<section class="page-hero">
  <div class="page-hero-bg">
    <img src="/static/images/hero-electrician-panel.jpg" alt="BES project work Aruba" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i>Case Studies</div>
    <h1>Case Studies</h1>
    <p>Real problems. Real fixes. Real results. See how BES delivers across Aruba.</p>
  </div>
</section>

<!-- INTRO -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">From the Job Site</div>
      <h2 class="section-title">How We <span>Get It Done</span></h2>
      <p class="section-subtitle">Each case study covers scope, the problem, our approach, and the measurable outcome. No marketing fluff.</p>
    </div>
    <div class="trust-container" style="background:var(--navy);border-radius:16px;padding:1.25rem 2rem;justify-content:space-around;">
      <div class="trust-item"><i class="fas fa-utensils"></i><span>Restaurants</span></div>
      <div class="trust-item"><i class="fas fa-building"></i><span>Commercial</span></div>
      <div class="trust-item"><i class="fas fa-hard-hat"></i><span>New Build</span></div>
      <div class="trust-item"><i class="fas fa-solar-panel"></i><span>Solar &amp; Storage</span></div>
      <div class="trust-item"><i class="fas fa-bolt"></i><span>Emergency</span></div>
    </div>
  </div>
</section>

<!-- CASE STUDY 1 -->
<section class="section" id="moomba">
  <div class="container">
    <article class="case-study-card">
      <div class="case-study-meta">
        <span class="case-tag cs-restaurant">Restaurant</span>
        <span class="case-location"><i class="fas fa-map-marker-alt"></i> Palm Beach, Aruba</span>
      </div>
      <h2>Moomba Beach — Kitchen Circuit Upgrade</h2>
      <div class="case-study-grid">
        <div class="case-study-body">
          <div class="case-block">
            <h4><i class="fas fa-expand-arrows-alt"></i> Scope</h4>
            <p>Full audit and upgrade of kitchen electrical circuits for a high-volume beachfront restaurant operating 7 days a week.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-exclamation-triangle"></i> Problem</h4>
            <p>During peak dinner service, circuit breakers repeatedly tripped in the kitchen, halting fryer and grill operations mid-service. The existing panel was undersized for the expanded kitchen equipment and posed a fire risk under sustained load.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-tools"></i> What We Did</h4>
            <ul class="case-list">
              <li><i class="fas fa-check-circle"></i> Conducted load calculation across all kitchen equipment</li>
              <li><i class="fas fa-check-circle"></i> Installed dedicated 40A circuits for fryers and commercial grills</li>
              <li><i class="fas fa-check-circle"></i> Upgraded distribution panel to handle peak load</li>
              <li><i class="fas fa-check-circle"></i> All work performed between 11 PM and 6 AM to avoid business disruption</li>
              <li><i class="fas fa-check-circle"></i> Full NEN 1010 compliance documentation provided</li>
            </ul>
          </div>
          <div class="case-block case-outcome">
            <h4><i class="fas fa-chart-line"></i> Outcome</h4>
            <p>Zero circuit trips since installation. Kitchen operates at full capacity during peak service. The client also booked BES for annual preventive maintenance — ongoing relationship since 2022.</p>
          </div>
        </div>
        <div class="case-study-sidebar">
          <div class="case-stat-card">
            <div class="case-stat"><span class="cs-number">0</span><span class="cs-label">Trips since install</span></div>
            <div class="case-stat"><span class="cs-number">1 night</span><span class="cs-label">Installation window</span></div>
            <div class="case-stat"><span class="cs-number">NEN 1010</span><span class="cs-label">Fully compliant</span></div>
          </div>
          <a href="/contact#quote" class="btn btn-primary btn-full" style="margin-top:1.5rem;"><i class="fas fa-file-alt"></i> Request Similar Work</a>
        </div>
      </div>
    </article>
  </div>
</section>

<!-- CASE STUDY 2 -->
<section class="section section-alt" id="villa">
  <div class="container">
    <article class="case-study-card">
      <div class="case-study-meta">
        <span class="case-tag cs-commercial">New Construction</span>
        <span class="case-location"><i class="fas fa-map-marker-alt"></i> Noord, Aruba</span>
      </div>
      <h2>Developer — 4-Unit Villa Complex, Full Electrical Build</h2>
      <div class="case-study-grid">
        <div class="case-study-body">
          <div class="case-block">
            <h4><i class="fas fa-expand-arrows-alt"></i> Scope</h4>
            <p>Complete electrical design, supply, and installation for a new 4-unit luxury villa complex, from foundation through to ELMAR connection and inspection sign-off.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-exclamation-triangle"></i> Problem</h4>
            <p>The developer needed a single electrical subcontractor to coordinate the full scope — from permit drawings through to inspection — to avoid the scheduling chaos of multiple contractors. Previous projects had delayed handover by weeks due to coordination failures.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-tools"></i> What We Did</h4>
            <ul class="case-list">
              <li><i class="fas fa-check-circle"></i> Produced detailed electrical drawings for permit submission</li>
              <li><i class="fas fa-check-circle"></i> Installed full wiring, distribution boards, and earthing for all 4 units</li>
              <li><i class="fas fa-check-circle"></i> Coordinated directly with ELMAR for metering and grid connection</li>
              <li><i class="fas fa-check-circle"></i> Installed outdoor lighting and pool area circuits</li>
              <li><i class="fas fa-check-circle"></i> Passed ELMAR and NEN 1010 inspection first attempt</li>
              <li><i class="fas fa-check-circle"></i> Pre-wired conduit for future solar panel installation</li>
            </ul>
          </div>
          <div class="case-block case-outcome">
            <h4><i class="fas fa-chart-line"></i> Outcome</h4>
            <p>Project delivered on time and on budget. Inspection passed first attempt. Developer has since engaged BES on two additional construction projects on the island.</p>
          </div>
        </div>
        <div class="case-study-sidebar">
          <div class="case-stat-card">
            <div class="case-stat"><span class="cs-number">4 units</span><span class="cs-label">Fully wired</span></div>
            <div class="case-stat"><span class="cs-number">1st pass</span><span class="cs-label">ELMAR inspection</span></div>
            <div class="case-stat"><span class="cs-number">On budget</span><span class="cs-label">Delivered on time</span></div>
          </div>
          <a href="/industries/developers" class="btn btn-primary btn-full" style="margin-top:1.5rem;"><i class="fas fa-hard-hat"></i> Developer Services</a>
        </div>
      </div>
    </article>
  </div>
</section>

<!-- CASE STUDY 3 -->
<section class="section" id="solar-retail">
  <div class="container">
    <article class="case-study-card">
      <div class="case-study-meta">
        <span class="case-tag cs-solar">Solar + Battery</span>
        <span class="case-location"><i class="fas fa-map-marker-alt"></i> Oranjestad, Aruba</span>
      </div>
      <h2>Retail Business — 70% Electricity Cost Reduction</h2>
      <div class="case-study-grid">
        <div class="case-study-body">
          <div class="case-block">
            <h4><i class="fas fa-expand-arrows-alt"></i> Scope</h4>
            <p>24-panel rooftop solar system with battery storage for a mid-size retail shop in central Aruba operating 6 days a week.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-exclamation-triangle"></i> Problem</h4>
            <p>The owner was spending over AWG 3,000 per month on ELMAR electricity — unsustainable for the business margin. Air conditioning, display lighting, and refrigeration made up most of the load. The flat roof was well-positioned for solar but had never been assessed.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-tools"></i> What We Did</h4>
            <ul class="case-list">
              <li><i class="fas fa-check-circle"></i> Energy audit to identify highest-consumption equipment</li>
              <li><i class="fas fa-check-circle"></i> Designed 24-panel 9.6 kWp rooftop system</li>
              <li><i class="fas fa-check-circle"></i> Installed grid-tied inverter with battery storage for evening coverage</li>
              <li><i class="fas fa-check-circle"></i> Connected monitoring system so owner tracks generation in real time</li>
              <li><i class="fas fa-check-circle"></i> Coordinated ELMAR net metering application</li>
            </ul>
          </div>
          <div class="case-block case-outcome">
            <h4><i class="fas fa-chart-line"></i> Outcome</h4>
            <p>Monthly ELMAR bill dropped from AWG 3,000+ to under AWG 900 — a 70% reduction. Full ROI projected within 4 years. Business now exports excess energy back to the grid.</p>
          </div>
        </div>
        <div class="case-study-sidebar">
          <div class="case-stat-card">
            <div class="case-stat"><span class="cs-number">70%</span><span class="cs-label">Cost reduction</span></div>
            <div class="case-stat"><span class="cs-number">4 yrs</span><span class="cs-label">Projected ROI</span></div>
            <div class="case-stat"><span class="cs-number">9.6 kWp</span><span class="cs-label">System capacity</span></div>
          </div>
          <a href="/services#solar" class="btn btn-primary btn-full" style="margin-top:1.5rem;"><i class="fas fa-solar-panel"></i> Solar Services</a>
        </div>
      </div>
    </article>
  </div>
</section>

<!-- CASE STUDY 4 -->
<section class="section section-alt" id="property-manager">
  <div class="container">
    <article class="case-study-card">
      <div class="case-study-meta">
        <span class="case-tag cs-commercial">Property Management</span>
        <span class="case-location"><i class="fas fa-map-marker-alt"></i> Eagle Beach, Aruba</span>
      </div>
      <h2>Property Manager — Multi-Unit Compliance Overhaul</h2>
      <div class="case-study-grid">
        <div class="case-study-body">
          <div class="case-block">
            <h4><i class="fas fa-expand-arrows-alt"></i> Scope</h4>
            <p>Electrical compliance inspection and upgrade across 12 rental units in a managed apartment complex near Eagle Beach.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-exclamation-triangle"></i> Problem</h4>
            <p>A property management company was facing tenant complaints about repeated outages and flickering lights in several units. An informal inspection had flagged outdated wiring and missing GFCI protection in bathrooms and kitchens — a liability risk during high rental season.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-tools"></i> What We Did</h4>
            <ul class="case-list">
              <li><i class="fas fa-check-circle"></i> Inspected all 12 units and produced a written compliance report</li>
              <li><i class="fas fa-check-circle"></i> Replaced outdated wiring in 7 units with non-compliant panels</li>
              <li><i class="fas fa-check-circle"></i> Installed GFCI outlets in all wet areas across the complex</li>
              <li><i class="fas fa-check-circle"></i> Replaced faulty breakers and tested all circuits under load</li>
              <li><i class="fas fa-check-circle"></i> Scheduled work around guest occupancy to avoid lost bookings</li>
            </ul>
          </div>
          <div class="case-block case-outcome">
            <h4><i class="fas fa-chart-line"></i> Outcome</h4>
            <p>Zero electrical complaints since completion. The property manager now has BES on an annual maintenance contract covering all 12 units. Full compliance documentation provided for insurance records.</p>
          </div>
        </div>
        <div class="case-study-sidebar">
          <div class="case-stat-card">
            <div class="case-stat"><span class="cs-number">12 units</span><span class="cs-label">Inspected &amp; upgraded</span></div>
            <div class="case-stat"><span class="cs-number">0</span><span class="cs-label">Complaints since</span></div>
            <div class="case-stat"><span class="cs-number">Annual</span><span class="cs-label">Maintenance contract</span></div>
          </div>
          <a href="/industries/property-managers" class="btn btn-primary btn-full" style="margin-top:1.5rem;"><i class="fas fa-building"></i> Property Manager Services</a>
        </div>
      </div>
    </article>
  </div>
</section>

<!-- CASE STUDY 5 -->
<section class="section" id="emergency-response">
  <div class="container">
    <article class="case-study-card">
      <div class="case-study-meta">
        <span class="case-tag cs-emergency">Emergency</span>
        <span class="case-location"><i class="fas fa-map-marker-alt"></i> Oranjestad, Aruba</span>
      </div>
      <h2>Restaurant Emergency — Full Power Restored Before Dinner Service</h2>
      <div class="case-study-grid">
        <div class="case-study-body">
          <div class="case-block">
            <h4><i class="fas fa-expand-arrows-alt"></i> Scope</h4>
            <p>Emergency diagnosis and repair of complete power loss at a restaurant, with a 5-hour window before dinner service was due to begin.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-exclamation-triangle"></i> Problem</h4>
            <p>At 12:00 PM on a Friday, a restaurant called BES after total power loss. All kitchen equipment, lighting, and POS systems were down. They had a fully booked dinner service starting at 6:00 PM and a previous electrician had been unable to diagnose the fault.</p>
          </div>
          <div class="case-block">
            <h4><i class="fas fa-tools"></i> What We Did</h4>
            <ul class="case-list">
              <li><i class="fas fa-check-circle"></i> BES technician on-site within 90 minutes of the call</li>
              <li><i class="fas fa-check-circle"></i> Identified a failed main breaker and damaged feeder cable</li>
              <li><i class="fas fa-check-circle"></i> Sourced replacement parts and completed repair within 3.5 hours</li>
              <li><i class="fas fa-check-circle"></i> Tested all circuits and ran full load test before handover</li>
              <li><i class="fas fa-check-circle"></i> Coordinated with ELMAR for meter reconnection</li>
            </ul>
          </div>
          <div class="case-block case-outcome">
            <h4><i class="fas fa-chart-line"></i> Outcome</h4>
            <p>Full power restored by 3:45 PM — over 2 hours before dinner service. The restaurant ran at full capacity that evening. The client signed a preventive maintenance agreement the following week.</p>
          </div>
        </div>
        <div class="case-study-sidebar">
          <div class="case-stat-card">
            <div class="case-stat"><span class="cs-number">90 min</span><span class="cs-label">Response time</span></div>
            <div class="case-stat"><span class="cs-number">3.5 hrs</span><span class="cs-label">Repair time</span></div>
            <div class="case-stat"><span class="cs-number">0 lost</span><span class="cs-label">Dinner covers</span></div>
          </div>
          <a href="/industries/emergency" class="btn btn-danger btn-full" style="margin-top:1.5rem;"><i class="fas fa-phone"></i> Emergency Line</a>
        </div>
      </div>
    </article>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Have a Similar Challenge?</h2>
    <p>Tell us about your project. We'll give you a straight assessment and a clear quote.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Quote</a>
      <a href="${PHONE_LINK}" class="btn btn-white btn-lg"><i class="fas fa-phone"></i> Call ${PHONE}</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   INDUSTRY: RESTAURANTS
============================== */
function industryRestaurantsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Electrician for Restaurants Aruba', 'BES provides electrical services for restaurants, bars, and hospitality venues across Aruba. Kitchen circuits, HVAC, dining lighting, emergency response. NEN 1010 compliant.', '/industries/restaurants', 'electrician restaurant Aruba, kitchen electrical Aruba, bar electrical Aruba, hospitality electrician Aruba, HVAC electrical Aruba, restaurant power Aruba')}
</head>
<body>
${navbar('/industries/restaurants')}

<section class="page-hero">
  <div class="page-hero-bg">
    <img src="/static/images/hero-electrician-panel.jpg" alt="Restaurant electrical services Aruba" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i><a href="#industries">Industries</a><i class="fas fa-chevron-right"></i>Restaurants</div>
    <h1>Electrical Services for Restaurants &amp; Hospitality</h1>
    <p>Keeping kitchens, bars, and dining rooms powered and compliant across Aruba</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="industry-intro">
      <div class="industry-intro-content">
        <div class="section-tag">Restaurants &amp; Hospitality</div>
        <h2 class="section-title">Your Kitchen Can't <span>Afford to Stop</span></h2>
        <p>Restaurant and hospitality electrical systems carry some of the heaviest and most demanding loads of any commercial environment. High-wattage kitchen equipment, HVAC systems, outdoor lighting, bar power, and POS infrastructure all run simultaneously — and any failure costs revenue immediately.</p>
        <p>BES understands this. We work around your schedule, respond fast when things go wrong, and build systems that handle peak demand without tripping. Our clients include some of Aruba's best-known restaurants and beach bars.</p>
        <div class="industry-trust-badges">
          <span><i class="fas fa-clock"></i> Work outside operating hours</span>
          <span><i class="fas fa-bolt"></i> 24/7 emergency response</span>
          <span><i class="fas fa-shield-alt"></i> NEN 1010 compliant</span>
          <span><i class="fas fa-handshake"></i> Maintenance contracts available</span>
        </div>
      </div>
      <div class="industry-intro-image">
        <img src="/static/images/hero-electrician-panel.jpg" alt="Restaurant electrical services" loading="lazy">
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">What We Do</div>
      <h2 class="section-title">Services for <span>Food &amp; Beverage</span></h2>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-fire"></i></div>
        <h3>Kitchen Circuit Upgrades</h3>
        <p>Dedicated high-amperage circuits for fryers, grills, ovens, and commercial refrigeration. Sized correctly for sustained load.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-lightbulb"></i></div>
        <h3>Dining Room Lighting</h3>
        <p>Ambiance lighting design and installation, LED upgrades, and dimmable circuits for full dining atmosphere control.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-wind"></i></div>
        <h3>HVAC Electrical</h3>
        <p>Power supply and control wiring for air conditioning systems. Critical for both guest comfort and kitchen heat management.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-glass-martini-alt"></i></div>
        <h3>Bar &amp; Outdoor Power</h3>
        <p>Weatherproof outdoor circuits for beach bars, terraces, and event spaces. Including GFCI protection for all wet areas.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-clipboard-check"></i></div>
        <h3>Preventive Maintenance</h3>
        <p>Scheduled inspections to catch problems before they become emergencies. Off-peak scheduling to protect your operations.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-bolt"></i></div>
        <h3>Emergency Response</h3>
        <p>Power outages don't wait for business hours. Our emergency line is available 24/7 to get your restaurant back online fast.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Real Results</div>
      <h2 class="section-title">Trusted by Aruba's <span>Best Restaurants</span></h2>
    </div>
    <div class="clients-marquee-wrapper">
      <div class="clients-marquee">
        <div class="clients-track">
          <div class="client-logo-item"><img src="/static/images/clients/moomba-beach.png" alt="Moomba Beach" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/jolly-pirates.png" alt="Jolly Pirates" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/le-petit-chef.png" alt="Le Petit Chef" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/kokoa-restaurant.png" alt="Kokoa Restaurant" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/casa-tua.png" alt="Casa Tua" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/mambo-jambo.png" alt="Mambo Jambo" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/hadicurari-restaurant.png" alt="Hadicurari Restaurant" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/salt-pepper.png" alt="Salt &amp; Pepper" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/sopranos-piano-bar.png" alt="Soprano's Piano Bar" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/moomba-beach.png" alt="Moomba Beach" loading="lazy"></div>
          <div class="client-logo-item"><img src="/static/images/clients/jolly-pirates.png" alt="Jolly Pirates" loading="lazy"></div>
        </div>
      </div>
    </div>
    <div class="section-cta" style="margin-top:2rem;">
      <a href="/case-studies#moomba" class="btn btn-outline">Read: Moomba Beach Kitchen Upgrade <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Running a Restaurant in Aruba?</h2>
    <p>Tell us your setup and we'll recommend the right electrical solution. We respond within 24 hours.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Quote</a>
      <a href="${WHATSAPP}" target="_blank" class="btn btn-white btn-lg"><i class="fab fa-whatsapp"></i> WhatsApp Us</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   INDUSTRY: PROPERTY MANAGERS
============================== */
function industryPropertyManagersPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Electrician for Property Managers Aruba', 'BES provides electrical maintenance contracts, compliance inspections, and fast repair services for property managers across Aruba. Reliable, documented, NEN 1010 compliant.', '/industries/property-managers', 'property manager electrician Aruba, electrical maintenance contract Aruba, apartment complex electrician Aruba, NEN 1010 compliance Aruba, commercial property electrical Aruba')}
</head>
<body>
${navbar('/industries/property-managers')}

<section class="page-hero">
  <div class="page-hero-bg">
    <img src="/static/images/hero-electrician-panel.jpg" alt="Property management electrical services Aruba" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i><a href="#industries">Industries</a><i class="fas fa-chevron-right"></i>Property Managers</div>
    <h1>Electrical Services for Property Managers</h1>
    <p>Compliance, maintenance, and repairs for commercial and residential properties across Aruba</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="industry-intro">
      <div class="industry-intro-content">
        <div class="section-tag">Property Management</div>
        <h2 class="section-title">One Electrical Partner. <span>Every Property.</span></h2>
        <p>Managing multiple properties means electrical issues don't wait for convenient timing. Tenants call at any hour, inspections have deadlines, and insurance companies require documentation. BES becomes the single electrical contractor you can rely on across your entire portfolio.</p>
        <p>We provide written inspection reports, compliance documentation, and scheduled maintenance programs that protect your properties, satisfy insurance requirements, and keep tenants happy.</p>
        <div class="industry-trust-badges">
          <span><i class="fas fa-file-alt"></i> Written compliance reports</span>
          <span><i class="fas fa-calendar-alt"></i> Scheduled maintenance plans</span>
          <span><i class="fas fa-bolt"></i> Fast repair response</span>
          <span><i class="fas fa-shield-alt"></i> Insurance documentation</span>
        </div>
      </div>
      <div class="industry-intro-image">
        <img src="/static/images/hero-electrician-panel.jpg" alt="Property electrical compliance" loading="lazy">
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">What We Do</div>
      <h2 class="section-title">Services for <span>Property Managers</span></h2>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-clipboard-check"></i></div>
        <h3>Annual Compliance Inspections</h3>
        <p>Full electrical inspection with written report. Covers all circuits, panels, earthing, and safety devices. Insurance-ready documentation.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-calendar-alt"></i></div>
        <h3>Preventive Maintenance Contracts</h3>
        <p>Scheduled visits across your property portfolio. Catch problems before they cause complaints or damage. Fixed annual pricing available.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-tools"></i></div>
        <h3>Tenant Repair Response</h3>
        <p>Fast dispatch for electrical faults reported by tenants. Clear communication about work done and time to complete. Available 24/7 for emergencies.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-plug"></i></div>
        <h3>Unit Rewiring &amp; Upgrades</h3>
        <p>Rewiring older units to current NEN 1010 standards. Panel upgrades, GFCI installation, and load balancing for multi-unit buildings.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-lightbulb"></i></div>
        <h3>Common Area Lighting</h3>
        <p>LED upgrades, parking lot lighting, stairwell and corridor lighting. Motion sensor and timer controls to reduce energy costs.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-solar-panel"></i></div>
        <h3>Solar for Multi-Unit Buildings</h3>
        <p>Common area solar systems to offset building-wide electricity costs. Reduce ELMAR bills across your entire portfolio.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Why Managers Choose BES</div>
      <h2 class="section-title">The Contractor Who <span>Shows Up</span></h2>
    </div>
    <div class="why-features" style="max-width:700px;margin:0 auto;">
      <div class="why-feature">
        <div class="feature-icon"><i class="fas fa-file-alt"></i></div>
        <div class="feature-content">
          <h4>Documentation You Can Use</h4>
          <p>Every inspection and repair is documented in writing. Essential for insurance claims, tenant disputes, and regulatory compliance.</p>
        </div>
      </div>
      <div class="why-feature">
        <div class="feature-icon"><i class="fas fa-clock"></i></div>
        <div class="feature-content">
          <h4>Predictable Scheduling</h4>
          <p>Annual maintenance calendars set at the start of each year. You know exactly when we're coming and what will be done.</p>
        </div>
      </div>
      <div class="why-feature">
        <div class="feature-icon"><i class="fas fa-phone"></i></div>
        <div class="feature-content">
          <h4>Single Point of Contact</h4>
          <p>One contractor for all your properties. No hunting for different electricians. One phone number, one relationship.</p>
        </div>
      </div>
      <div class="why-feature">
        <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
        <div class="feature-content">
          <h4>Fully Insured</h4>
          <p>BES carries full professional liability insurance on every job. Your properties and tenants are protected on every visit.</p>
        </div>
      </div>
    </div>
    <div class="section-cta">
      <a href="/case-studies#property-manager" class="btn btn-outline">Read: Property Manager Case Study <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Managing Properties in Aruba?</h2>
    <p>Let's set up a maintenance plan. Tell us how many units and we'll put together a proposal.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Proposal</a>
      <a href="${PHONE_LINK}" class="btn btn-white btn-lg"><i class="fas fa-phone"></i> Call ${PHONE}</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   INDUSTRY: DEVELOPERS
============================== */
function industryDevelopersPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('Electrician for Developers Aruba', 'BES handles full electrical design, installation, and inspection for new construction projects in Aruba. Villas, commercial builds, resort developments. NEN 1010 certified, ELMAR coordinated.', '/industries/developers', 'electrical contractor developer Aruba, new construction electrician Aruba, villa electrical Aruba, commercial build electrician Aruba, ELMAR connection Aruba, NEN 1010 certified')}
</head>
<body>
${navbar('/industries/developers')}

<section class="page-hero">
  <div class="page-hero-bg">
    <img src="/static/images/hero-electrician-panel.jpg" alt="Developer electrical services Aruba" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a><i class="fas fa-chevron-right"></i><a href="#industries">Industries</a><i class="fas fa-chevron-right"></i>Developers</div>
    <h1>Electrical for Developers &amp; Builders</h1>
    <p>From permit drawings to ELMAR handover — full electrical for new construction in Aruba</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="industry-intro">
      <div class="industry-intro-content">
        <div class="section-tag">Developers &amp; Builders</div>
        <h2 class="section-title">Ground-Up Electrical. <span>First Attempt Pass.</span></h2>
        <p>Construction delays cost money. Inspection failures cost more. BES manages the electrical scope for new builds from initial permit drawings through to ELMAR connection and final NEN 1010 sign-off — coordinating directly with your project manager to stay on schedule.</p>
        <p>We work on villas, commercial fit-outs, mixed-use developments, and resort projects. Our design capability means we're not just installers — we're a technical partner from the start of the project.</p>
        <div class="industry-trust-badges">
          <span><i class="fas fa-drafting-compass"></i> Electrical drawings for permits</span>
          <span><i class="fas fa-check-double"></i> ELMAR inspection coordination</span>
          <span><i class="fas fa-shield-alt"></i> First-attempt NEN 1010 pass</span>
          <span><i class="fas fa-calendar-check"></i> On-schedule delivery</span>
        </div>
      </div>
      <div class="industry-intro-image">
        <img src="/static/images/hero-electrician-panel.jpg" alt="New construction electrical Aruba" loading="lazy">
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">What We Do</div>
      <h2 class="section-title">Full-Scope Electrical <span>for New Builds</span></h2>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-drafting-compass"></i></div>
        <h3>Electrical Design &amp; Drawings</h3>
        <p>Permit-ready electrical drawings covering load calculations, circuit layouts, panel schedules, and earthing. Designed to NEN 1010 from the start.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-plug"></i></div>
        <h3>Full Installation</h3>
        <p>Complete wiring, conduit, panels, fixtures, and outdoor circuits. Phased installation to match construction milestones.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-bolt"></i></div>
        <h3>ELMAR Coordination</h3>
        <p>Direct coordination with ELMAR for metering, grid connection, and inspection scheduling. We handle the paperwork and the liaison.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-solar-panel"></i></div>
        <h3>Solar &amp; EV Pre-wiring</h3>
        <p>Install conduit and panel capacity during construction for future solar and EV charging without costly retrofitting later.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-swimming-pool"></i></div>
        <h3>Outdoor &amp; Pool Circuits</h3>
        <p>Weatherproof outdoor wiring, garden lighting, pool pump circuits, and terrace power. All GFCI protected per NEN 1010.</p>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-clipboard-check"></i></div>
        <h3>Inspection &amp; Handover</h3>
        <p>Manage the full inspection process. Provide as-built drawings and compliance certificates for project handover documentation.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Our Process</div>
      <h2 class="section-title">How We Work on <span>New Construction</span></h2>
    </div>
    <div class="process-steps">
      <div class="process-step">
        <div class="process-step-number">01</div>
        <h4>Design &amp; Drawings</h4>
        <p>We review your architectural plans and produce electrical drawings for permit submission, including load calculations and panel schedule.</p>
      </div>
      <div class="process-step">
        <div class="process-step-number">02</div>
        <h4>Rough-In Installation</h4>
        <p>Conduit, boxes, and rough wiring installed during structural phase. Coordinated with your construction schedule.</p>
      </div>
      <div class="process-step">
        <div class="process-step-number">03</div>
        <h4>Final Installation</h4>
        <p>Panels, fixtures, outlets, switches, and final connections. Full testing and load balancing before inspection.</p>
      </div>
      <div class="process-step">
        <div class="process-step-number">04</div>
        <h4>ELMAR &amp; Inspection</h4>
        <p>We coordinate ELMAR connection and manage the NEN 1010 inspection. Provide all documentation for project handover.</p>
      </div>
    </div>
    <div class="section-cta">
      <a href="/case-studies#villa" class="btn btn-outline">Read: Villa Complex Case Study <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2>Building in Aruba?</h2>
    <p>Share your project plans and we'll send a technical proposal with timeline and scope.</p>
    <div class="cta-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Proposal</a>
      <a href="${WHATSAPP}" target="_blank" class="btn btn-white btn-lg"><i class="fab fa-whatsapp"></i> WhatsApp Us</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   INDUSTRY: EMERGENCY
============================== */
function industryEmergencyPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${head('24/7 Emergency Electrician Aruba', 'BES provides 24/7 emergency electrical response across Aruba. Power outages, tripped breakers, equipment failures. Fast dispatch. Call +297 594 0104 now.', '/industries/emergency', '24/7 electrician Aruba, emergency electrician Aruba, power outage Aruba, electrical emergency Aruba, electrician after hours Aruba, fast electrician Aruba')}
</head>
<body>
${navbar('/industries/emergency')}

<section class="page-hero page-hero-emergency">
  <div class="page-hero-bg">
    <img src="/static/images/hero-electrician-panel.jpg" alt="24/7 emergency electrical response Aruba" class="page-hero-img">
    <div class="page-hero-overlay" style="background:rgba(180,20,20,0.72);"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb" style="color:rgba(255,255,255,0.75);"><a href="/" style="color:rgba(255,255,255,0.75);">Home</a><i class="fas fa-chevron-right"></i><a href="#industries" style="color:rgba(255,255,255,0.75);">Industries</a><i class="fas fa-chevron-right"></i>Emergency</div>
    <h1>24/7 Emergency Electrical Response</h1>
    <p>Power is down. BES responds fast, any time of day or night.</p>
    <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;">
      <a href="${PHONE_EMERGENCY_LINK}" class="btn btn-yellow btn-lg" style="font-size:1.1rem;"><i class="fas fa-phone"></i> Call Now: ${PHONE_EMERGENCY}</a>
      <a href="${WHATSAPP}" target="_blank" class="btn btn-white btn-lg"><i class="fab fa-whatsapp"></i> WhatsApp Now</a>
    </div>
  </div>
</section>

<!-- EMERGENCY INTRO -->
<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag" style="background:rgba(227,6,19,0.1);color:var(--red);">Emergency Response</div>
      <h2 class="section-title">Fast. Focused. <span>Back Online.</span></h2>
      <p class="section-subtitle">When power fails, every minute costs money. BES dispatches qualified electricians across Aruba to diagnose and resolve electrical emergencies as fast as possible.</p>
    </div>
    <div class="emergency-stats">
      <div class="emergency-stat">
        <i class="fas fa-clock" style="color:var(--red);font-size:2rem;margin-bottom:0.5rem;"></i>
        <div class="cs-number" style="color:var(--red);">24/7</div>
        <div class="cs-label">Available</div>
      </div>
      <div class="emergency-stat">
        <i class="fas fa-car" style="color:var(--red);font-size:2rem;margin-bottom:0.5rem;"></i>
        <div class="cs-number" style="color:var(--red);">&lt; 2 hrs</div>
        <div class="cs-label">Typical response</div>
      </div>
      <div class="emergency-stat">
        <i class="fas fa-map-marker-alt" style="color:var(--red);font-size:2rem;margin-bottom:0.5rem;"></i>
        <div class="cs-number" style="color:var(--red);">All Aruba</div>
        <div class="cs-label">Coverage</div>
      </div>
    </div>
  </div>
</section>

<!-- WHAT WE HANDLE -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">We Handle</div>
      <h2 class="section-title">Common <span>Emergency Situations</span></h2>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon" style="color:var(--red);"><i class="fas fa-power-off"></i></div>
        <h3>Total Power Loss</h3>
        <p>Complete outage affecting your entire property. We diagnose the cause — from the meter to the panel to the feed — and restore power fast.</p>
      </div>
      <div class="service-card">
        <div class="service-icon" style="color:var(--red);"><i class="fas fa-exclamation-triangle"></i></div>
        <h3>Tripped or Failed Breakers</h3>
        <p>Circuit breakers that won't reset, repeatedly trip, or have failed. We identify the root cause and replace or repair as needed.</p>
      </div>
      <div class="service-card">
        <div class="service-icon" style="color:var(--red);"><i class="fas fa-fire"></i></div>
        <h3>Burning Smell / Sparks</h3>
        <p>Burning electrical smell or visible sparks are serious hazards. Turn off the affected circuit immediately and call us — do not wait.</p>
      </div>
      <div class="service-card">
        <div class="service-icon" style="color:var(--red);"><i class="fas fa-lightbulb"></i></div>
        <h3>Flickering or Unstable Power</h3>
        <p>Voltage fluctuations, flickering lights, or equipment cycling indicate a wiring fault or supply issue requiring immediate attention.</p>
      </div>
      <div class="service-card">
        <div class="service-icon" style="color:var(--red);"><i class="fas fa-plug"></i></div>
        <h3>Equipment Failure</h3>
        <p>Commercial kitchen equipment, HVAC units, or critical systems going offline due to electrical fault. Fast diagnosis and repair.</p>
      </div>
      <div class="service-card">
        <div class="service-icon" style="color:var(--red);"><i class="fas fa-bolt"></i></div>
        <h3>Storm Damage</h3>
        <p>Post-storm electrical inspection and repair. We assess damage, restore safe power, and document everything for insurance claims.</p>
      </div>
    </div>
  </div>
</section>

<!-- HOW TO REACH US -->
<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Contact Now</div>
      <h2 class="section-title">How to Reach <span>Emergency Response</span></h2>
    </div>
    <div class="emergency-contact-grid">
      <div class="emergency-contact-card">
        <i class="fas fa-phone" style="font-size:2.5rem;color:var(--red);margin-bottom:1rem;"></i>
        <h3>Call the Emergency Line</h3>
        <p>The fastest way to get a technician dispatched. Available 24 hours a day, 7 days a week.</p>
        <a href="${PHONE_EMERGENCY_LINK}" class="btn btn-danger btn-full" style="margin-top:1rem;"><i class="fas fa-phone"></i> ${PHONE_EMERGENCY}</a>
      </div>
      <div class="emergency-contact-card">
        <i class="fab fa-whatsapp" style="font-size:2.5rem;color:#25D366;margin-bottom:1rem;"></i>
        <h3>WhatsApp for Fast Response</h3>
        <p>Send us your location and describe the problem. We'll confirm dispatch time immediately.</p>
        <a href="${WHATSAPP}" target="_blank" class="btn btn-full" style="margin-top:1rem;background:#25D366;color:#fff;border-radius:8px;padding:0.75rem 1.5rem;font-weight:600;font-family:'Montserrat',sans-serif;display:inline-flex;align-items:center;gap:0.5rem;justify-content:center;"><i class="fab fa-whatsapp"></i> WhatsApp Now</a>
      </div>
      <div class="emergency-contact-card">
        <i class="fas fa-shield-alt" style="font-size:2.5rem;color:var(--navy);margin-bottom:1rem;"></i>
        <h3>What to Do While We Come</h3>
        <ul class="case-list" style="text-align:left;margin-top:1rem;">
          <li><i class="fas fa-check-circle"></i> Turn off the affected circuit at the breaker</li>
          <li><i class="fas fa-check-circle"></i> Do not attempt to reset breakers repeatedly</li>
          <li><i class="fas fa-check-circle"></i> Keep staff and guests away from the fault area</li>
          <li><i class="fas fa-check-circle"></i> If you smell burning, evacuate the area</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="cta-section" style="background:var(--red);--cta-bg:var(--red);">
  <div class="cta-bg-img"></div>
  <div class="cta-content">
    <h2 style="color:var(--yellow);">Electrical Emergency Right Now?</h2>
    <p>Don't wait. Call our emergency line and we'll dispatch immediately.</p>
    <div class="cta-actions">
      <a href="${PHONE_EMERGENCY_LINK}" class="btn btn-yellow btn-lg" style="font-size:1.1rem;"><i class="fas fa-phone"></i> Call ${PHONE_EMERGENCY}</a>
      <a href="${WHATSAPP}" target="_blank" class="btn btn-white btn-lg"><i class="fab fa-whatsapp"></i> WhatsApp Now</a>
    </div>
  </div>
</section>

${footer()}
</body>
</html>`
}

/* ==============================
   404 PAGE
============================== */
function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Page Not Found — Bello Electrical Services | Aruba</title>
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-WYHXCJX8E7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-WYHXCJX8E7');
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="/static/style.css">
  <link rel="icon" type="image/png" href="/static/logo-transparent.png">
  <style>
    .not-found-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      background: #f8f9fc;
    }
    .not-found-logo { width: 160px; margin-bottom: 2rem; }
    .not-found-code {
      font-size: 7rem;
      font-weight: 900;
      color: #f5a623;
      line-height: 1;
      font-family: 'Montserrat', sans-serif;
    }
    .not-found-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #0a1931;
      margin: 0.5rem 0 1rem;
      font-family: 'Montserrat', sans-serif;
    }
    .not-found-text {
      color: #6b7280;
      font-size: 1rem;
      max-width: 420px;
      line-height: 1.7;
      margin-bottom: 2rem;
      font-family: 'Poppins', sans-serif;
    }
    .not-found-links {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .not-found-links a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .not-found-links a.primary {
      background: #f5a623;
      color: #0a1931;
    }
    .not-found-links a.primary:hover { background: #e09516; }
    .not-found-links a.secondary {
      background: #0a1931;
      color: #fff;
    }
    .not-found-links a.secondary:hover { background: #162a4a; }
    .not-found-links a.outline {
      border: 2px solid #0a1931;
      color: #0a1931;
    }
    .not-found-links a.outline:hover { background: #0a1931; color: #fff; }
    .not-found-divider {
      margin: 2.5rem 0 1.5rem;
      color: #9ca3af;
      font-size: 0.85rem;
    }
    .not-found-contact {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .not-found-contact a {
      color: #0a1931;
      font-weight: 600;
      text-decoration: none;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .not-found-contact a:hover { color: #f5a623; }
  </style>
</head>
<body>
<div class="not-found-page">
  <img src="/static/logo-transparent.png" alt="Bello Electrical Services" class="not-found-logo">
  <div class="not-found-code">404</div>
  <h1 class="not-found-title">Page Not Found</h1>
  <p class="not-found-text">
    This page no longer exists or has been moved. 
    Use the links below to find what you're looking for.
  </p>
  <div class="not-found-links">
    <a href="/" class="primary"><i class="fas fa-home"></i> Go Home</a>
    <a href="/services" class="secondary"><i class="fas fa-bolt"></i> Our Services</a>
    <a href="/contact" class="outline"><i class="fas fa-envelope"></i> Contact Us</a>
  </div>
  <p class="not-found-divider">Or reach us directly</p>
  <div class="not-found-contact">
    <a href="tel:+2975941089"><i class="fas fa-phone"></i> Office: +297 594 1089</a>
    <a href="https://wa.me/2975941089" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>
    <a href="mailto:info@electricalservicesaruba.com"><i class="fas fa-envelope"></i> Email Us</a>
  </div>
</div>
</body>
</html>`
}

export default app
