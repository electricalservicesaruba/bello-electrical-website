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
        error: 'Failed to send message. Please call us directly at +297 594 1089.'
      }, 500)
    }
  } catch (err) {
    return c.json({
      success: false,
      error: 'Unable to send message. Please call us directly at +297 594 1089.'
    }, 500)
  }
})

app.get('/',        (c) => c.html(homePage()))
app.get('/services',(c) => c.html(servicesPage()))
app.get('/about',   (c) => c.html(aboutPage()))
app.get('/contact', (c) => c.html(contactPage()))

// SEO: serve sitemap and robots at root
app.get('/sitemap.xml', async (c) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.electricalservicesaruba.com/</loc><lastmod>2026-04-11</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/services</loc><lastmod>2026-04-11</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/about</loc><lastmod>2026-04-11</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.electricalservicesaruba.com/contact</loc><lastmod>2026-04-11</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`
  return c.text(sitemap, 200, { 'Content-Type': 'application/xml; charset=UTF-8' })
})

app.get('/robots.txt', (c) => {
  const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://www.electricalservicesaruba.com/sitemap.xml`
  return c.text(robots, 200, { 'Content-Type': 'text/plain; charset=UTF-8' })
})

app.notFound((c)   => c.html(`<!DOCTYPE html><html><body><h1>Page not found</h1><a href="/">Go Home</a></body></html>`, 404))

/* ==============================
   SHARED HELPERS
============================== */
const PHONE       = '+297 594 1089'
const PHONE_LINK  = 'tel:+2975941089'
const WHATSAPP    = 'https://wa.me/2975941089'
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

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="/static/style.css">
    <link rel="icon" type="image/png" href="/static/logo-transparent.png">
  `
}

function navbar(active: string) {
  const links = [
    { href: '/',         label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/about',    label: 'About Us' },
    { href: '/contact',  label: 'Contact' },
  ]
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
        ${links.map(l => `<li><a href="${l.href}" class="nav-link${active === l.href ? ' active' : ''}">${l.label}</a></li>`).join('')}
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
            <li><a href="/services">All Services</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/contact#quote">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contact</h4>
          <ul class="footer-contact-list">
            <li><i class="fas fa-map-marker-alt"></i><span>Aruba, ABC Islands</span></li>
            <li><i class="fas fa-phone"></i><a href="${PHONE_LINK}">${PHONE}</a></li>
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
<head>${head('Electrical Services in Aruba', 'Bello Electrical Services – Certified & insured electrical contractor in Aruba. Commercial & residential electrical, solar panels, EV charging. NEN 1010 compliant. Fast 24-hour response.', '/', 'electrician Aruba, electrical services Aruba, residential electrician Aruba, commercial electrician Aruba, solar panel Aruba, EV charging Aruba, NEN 1010, Bello Electrical Services')}
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
    <div class="hero-badge"><i class="fas fa-certificate"></i>&nbsp; Licensed &bull; Certified &bull; Insured &bull; Aruba</div>
    <h1 class="hero-title">
      Reliable Electrical<br>
      <span class="hero-highlight">Services in Aruba.</span>
    </h1>
    <p class="hero-slogan"><i class="fas fa-bolt"></i> Shockingly Good. Watt-Ever You Need.</p>
    <p class="hero-subtitle">
      From small repairs to full commercial installations and solar systems,
      BES delivers safe, NEN 1010 compliant work with fast response times and consistent quality. Backed by more than 20 years of hands-on experience.
    </p>
    <div class="hero-actions">
      <a href="/contact#quote" class="btn btn-yellow btn-lg"><i class="fas fa-file-alt"></i> Request a Quote</a>
      <a href="${WHATSAPP}" target="_blank" class="btn btn-outline btn-lg"><i class="fab fa-whatsapp"></i> WhatsApp Us</a>
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

<!-- WHO WE SERVE -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Who We Serve</div>
      <h2 class="section-title">Built for Aruba's<br><span>Business Community</span></h2>
      <p class="section-subtitle">From small shops to large commercial developments — if it needs electricity, BES has you covered.</p>
    </div>
    <div class="clients-grid">
      <div class="client-card"><div class="client-icon"><i class="fas fa-utensils"></i></div><h3>Restaurants</h3><p>Kitchen power, HVAC &amp; dining lighting</p></div>
      <div class="client-card"><div class="client-icon"><i class="fas fa-building"></i></div><h3>Property Managers</h3><p>Commercial property maintenance &amp; compliance</p></div>
      <div class="client-card"><div class="client-icon"><i class="fas fa-store"></i></div><h3>Retail Stores</h3><p>Display lighting, POS &amp; storefront power</p></div>
      <div class="client-card"><div class="client-icon"><i class="fas fa-briefcase"></i></div><h3>Office Buildings</h3><p>Complete electrical systems &amp; smart power</p></div>
      <div class="client-card"><div class="client-icon"><i class="fas fa-hard-hat"></i></div><h3>Developers</h3><p>New construction from ground up to handover</p></div>
      <div class="client-card"><div class="client-icon"><i class="fas fa-home"></i></div><h3>Homeowners</h3><p>Residential wiring, solar &amp; EV charging</p></div>
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
      <p class="section-subtitle">From restaurants and resorts to shops and entertainment venues — Aruba's best businesses rely on Bello Electrical Services.</p>
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
      <p class="section-subtitle">Whether you're changing a light fixture or installing a full solar system with battery storage — BES has the certification, tools, and team to get it done right in Aruba.</p>
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
          <a href="${PHONE_LINK}" class="btn btn-danger"><i class="fas fa-phone"></i> Emergency Line</a>
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
        <p>Bello Electrical Services and More (BES) was founded in <strong>2019</strong> as a sole proprietorship by Luis Bello — a certified electrician with over 20 years of hands-on experience in electrical wiring, repair, professional drafting, and inspection. In 2024, BES became a Limited Liability Company (LLC), reflecting the company's continued growth and long-term commitment to Aruba.</p>
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
        <p>Luis Bello is a certified electrician and entrepreneur with over 20 years of hands-on experience in Aruba. His background covers electrical wiring and repair, professional drafting, and electrical inspection — giving him the full technical picture from design to final delivery.</p>
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
      <p class="section-subtitle">Trained electricians, designers, administrators, and field technicians — united by a commitment to quality and safety on every job.</p>
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
<head>${head('Contact Us', 'Contact Bello Electrical Services in Aruba. Send us a message, call +297 594 1089, or WhatsApp for a fast response. We respond within 24 hours, Mon–Fri 8 AM–5 PM.', '/contact', 'contact electrician Aruba, call electrician Aruba, WhatsApp electrician Aruba, electrical quote Aruba, Bello Electrical contact')}
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
                <h4>Phone</h4>
                <a href="${PHONE_LINK}">${PHONE}</a>
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
              <div class="hours-row emergency"><span>Emergency Line</span><span>24/7 Available</span></div>
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

export default app
