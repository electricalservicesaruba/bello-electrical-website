import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))

// Contact form handler
app.post('/api/contact', async (c) => {
  const body = await c.req.json()
  const { name, email, phone, service, message } = body

  if (!name || !email || !message) {
    return c.json({ success: false, error: 'Please fill in all required fields.' }, 400)
  }

  // In production, you would send this to an email service
  // For now, we return success
  console.log('Contact form submission:', { name, email, phone, service, message })

  return c.json({
    success: true,
    message: 'Thank you for your message! We will contact you within 24 hours.'
  })
})

// Main website route
app.get('/', (c) => {
  return c.html(renderHomePage())
})

app.get('/services', (c) => {
  return c.html(renderServicesPage())
})

app.get('/about', (c) => {
  return c.html(renderAboutPage())
})

app.get('/contact', (c) => {
  return c.html(renderContactPage())
})

// 404
app.notFound((c) => {
  return c.html(`<!DOCTYPE html><html><body><h1>Page not found</h1><a href="/">Go Home</a></body></html>`, 404)
})

function getHead(title: string, description: string) {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Bello Electrical Services</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="electrical services Aruba, electrician Aruba, commercial electrical, solar installation Aruba">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="/static/style.css">
    <link rel="icon" type="image/png" href="/static/favicon.png">
  `
}

function getNavbar(activePage: string) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ]
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/static/logo.png" alt="Bello Electrical Services" class="logo-img">
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-menu" id="navMenu">
        ${links.map(l => `<li><a href="${l.href}" class="nav-link${activePage === l.href ? ' active' : ''}">${l.label}</a></li>`).join('')}
        <li><a href="/contact" class="nav-cta">Get a Quote</a></li>
      </ul>
    </div>
  </nav>`
}

function getFooter() {
  return `
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="/static/logo-white.png" alt="Bello Electrical Services" class="footer-logo">
          <p class="footer-tagline">Ridiculously Good. Exactly What You Need.</p>
          <p class="footer-description">Reliable electrical installation and maintenance for businesses in Aruba since 2015.</p>
          <div class="footer-social">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            <a href="#" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>
        <div class="footer-links">
          <h4>Services</h4>
          <ul>
            <li><a href="/services#installations">Commercial Installations</a></li>
            <li><a href="/services#maintenance">Preventive Maintenance</a></li>
            <li><a href="/services#solar">Solar Energy</a></li>
            <li><a href="/services#panels">Panel Upgrades</a></li>
            <li><a href="/services#emergency">Emergency Support</a></li>
            <li><a href="/services#lighting">Lighting Systems</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/about#team">Our Team</a></li>
            <li><a href="/services">Our Services</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/contact#quote">Get a Quote</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contact Us</h4>
          <ul class="footer-contact-list">
            <li><i class="fas fa-map-marker-alt"></i><span>Aruba</span></li>
            <li><i class="fas fa-phone"></i><a href="tel:+2975001234">+297 500-1234</a></li>
            <li><i class="fas fa-envelope"></i><a href="mailto:info@electricalservicesaruba.com">info@electricalservicesaruba.com</a></li>
            <li><i class="fas fa-globe"></i><a href="https://www.electricalservicesaruba.com" target="_blank">electricalservicesaruba.com</a></li>
          </ul>
          <div class="footer-hours">
            <h5>Business Hours</h5>
            <p>Mon – Fri: 7:00 AM – 5:00 PM</p>
            <p>Emergency: 24/7 Available</p>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Bello Electrical Services. All rights reserved.</p>
        <p>Licensed & Insured | Serving Aruba Since 2015</p>
      </div>
    </div>
  </footer>
  <script src="/static/main.js"></script>
  `
}

function renderHomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${getHead('Home', 'Bello Electrical Services – Reliable commercial electrical installation and maintenance in Aruba. Safe, code-compliant work with fast response times.')}</head>
<body>
${getNavbar('/')}

<!-- HERO SECTION -->
<section class="hero" id="home">
  <div class="hero-bg">
    <img src="https://www.genspark.ai/api/files/s/bqLIkGQ3" alt="Bello Electrical Services team" class="hero-bg-img">
    <div class="hero-overlay"></div>
  </div>
  <div class="hero-content">
    <div class="hero-badge"><i class="fas fa-bolt"></i> Aruba's Trusted Electrical Partner</div>
    <h1 class="hero-title">
      Ridiculously Good.<br>
      <span class="hero-highlight">Exactly What You Need.</span>
    </h1>
    <p class="hero-subtitle">
      Professional electrical installation and maintenance for businesses across Aruba.
      Safe, code-compliant, and built to last.
    </p>
    <div class="hero-actions">
      <a href="/contact" class="btn btn-primary btn-lg"><i class="fas fa-file-alt"></i> Get a Free Quote</a>
      <a href="/services" class="btn btn-outline btn-lg"><i class="fas fa-bolt"></i> Our Services</a>
    </div>
    <div class="hero-stats">
      <div class="stat-item">
        <span class="stat-number">10+</span>
        <span class="stat-label">Years Experience</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">500+</span>
        <span class="stat-label">Projects Completed</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">100%</span>
        <span class="stat-label">Code Compliant</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">24/7</span>
        <span class="stat-label">Emergency Support</span>
      </div>
    </div>
  </div>
  <a href="#services" class="hero-scroll"><i class="fas fa-chevron-down"></i></a>
</section>

<!-- TRUST BAR -->
<section class="trust-bar">
  <div class="trust-container">
    <div class="trust-item"><i class="fas fa-certificate"></i><span>Licensed & Insured</span></div>
    <div class="trust-item"><i class="fas fa-shield-alt"></i><span>Code Compliant Work</span></div>
    <div class="trust-item"><i class="fas fa-clock"></i><span>Fast Response Times</span></div>
    <div class="trust-item"><i class="fas fa-handshake"></i><span>Long-Term Partnerships</span></div>
    <div class="trust-item"><i class="fas fa-star"></i><span>Quality Guaranteed</span></div>
  </div>
</section>

<!-- SERVICES OVERVIEW -->
<section class="section services-overview" id="services">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">What We Do</div>
      <h2 class="section-title">Complete Electrical Solutions<br><span>for Your Business</span></h2>
      <p class="section-subtitle">From planning to execution, we handle all your commercial electrical needs with precision and professionalism.</p>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-building"></i></div>
        <h3>Commercial Installations</h3>
        <p>Full electrical installations for commercial spaces, from initial design to final hookup and testing.</p>
        <a href="/services#installations" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-tools"></i></div>
        <h3>Upgrades & Renovations</h3>
        <p>Modernize your electrical systems to meet current codes and handle today's power demands.</p>
        <a href="/services#upgrades" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card featured">
        <div class="service-badge">Most Popular</div>
        <div class="service-icon"><i class="fas fa-clipboard-check"></i></div>
        <h3>Preventive Maintenance</h3>
        <p>Regular inspections and maintenance to prevent costly downtime and ensure system reliability.</p>
        <a href="/services#maintenance" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-solar-panel"></i></div>
        <h3>Solar Energy Systems</h3>
        <p>Professional solar panel installation and integration for energy efficiency and cost savings.</p>
        <a href="/services#solar" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-bolt"></i></div>
        <h3>Panel Installation</h3>
        <p>Main panel upgrades and sub-panel installations for increased capacity and safety.</p>
        <a href="/services#panels" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-lightbulb"></i></div>
        <h3>Lighting Systems</h3>
        <p>Indoor and outdoor lighting design and installation for commercial properties.</p>
        <a href="/services#lighting" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3>Emergency Support</h3>
        <p>24/7 emergency electrical support to minimize downtime for your business operations.</p>
        <a href="/services#emergency" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
      <div class="service-card">
        <div class="service-icon"><i class="fas fa-leaf"></i></div>
        <h3>Energy Efficiency</h3>
        <p>Comprehensive energy audits and improvements to reduce your electricity costs.</p>
        <a href="/services#energy" class="service-link">Learn More <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
    <div class="section-cta">
      <a href="/services" class="btn btn-primary">View All Services</a>
    </div>
  </div>
</section>

<!-- WHY CHOOSE US -->
<section class="section why-us">
  <div class="container">
    <div class="why-us-inner">
      <div class="why-us-images">
        <div class="why-img-main">
          <img src="https://www.genspark.ai/api/files/s/pudKGucK" alt="Bello team on solar project in Aruba" loading="lazy">
        </div>
        <div class="why-img-secondary">
          <img src="https://www.genspark.ai/api/files/s/w21o6yEm" alt="Bello team installing solar panels" loading="lazy">
        </div>
        <div class="why-img-badge">
          <span class="badge-number">10+</span>
          <span class="badge-text">Years in Aruba</span>
        </div>
      </div>
      <div class="why-us-content">
        <div class="section-tag">Why Bello?</div>
        <h2 class="section-title">The Electrical Partner<br><span>You Can Count On</span></h2>
        <p class="section-subtitle">We don't just fix electrical problems — we build long-term partnerships with businesses across Aruba based on trust, quality, and reliability.</p>
        <div class="why-features">
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-check-circle"></i></div>
            <div class="feature-content">
              <h4>Code-Compliant Work</h4>
              <p>All work meets or exceeds Aruba's electrical codes and safety standards.</p>
            </div>
          </div>
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-users"></i></div>
            <div class="feature-content">
              <h4>Certified Professionals</h4>
              <p>Our team of certified electricians brings expertise to every project, big or small.</p>
            </div>
          </div>
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-clock"></i></div>
            <div class="feature-content">
              <h4>On-Time, Every Time</h4>
              <p>We respect your schedule. Projects are completed on time without cutting corners.</p>
            </div>
          </div>
          <div class="why-feature">
            <div class="feature-icon"><i class="fas fa-headset"></i></div>
            <div class="feature-content">
              <h4>Dedicated Support</h4>
              <p>From planning to after-service support, we're here when you need us most.</p>
            </div>
          </div>
        </div>
        <a href="/about" class="btn btn-primary">Learn More About Us</a>
      </div>
    </div>
  </div>
</section>

<!-- WHO WE SERVE -->
<section class="section clients-section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Who We Serve</div>
      <h2 class="section-title">Built for Aruba's<br><span>Business Community</span></h2>
    </div>
    <div class="clients-grid">
      <div class="client-card">
        <div class="client-icon"><i class="fas fa-utensils"></i></div>
        <h3>Restaurants</h3>
        <p>Kitchen power, HVAC systems, and dining area lighting.</p>
      </div>
      <div class="client-card">
        <div class="client-icon"><i class="fas fa-building"></i></div>
        <h3>Property Managers</h3>
        <p>Commercial property electrical maintenance and compliance.</p>
      </div>
      <div class="client-card">
        <div class="client-icon"><i class="fas fa-store"></i></div>
        <h3>Retail Stores</h3>
        <p>Display lighting, POS power, and storefront electrical.</p>
      </div>
      <div class="client-card">
        <div class="client-icon"><i class="fas fa-office-building"></i></div>
        <h3>Office Buildings</h3>
        <p>Complete office electrical systems and smart power solutions.</p>
      </div>
      <div class="client-card">
        <div class="client-icon"><i class="fas fa-hard-hat"></i></div>
        <h3>Developers</h3>
        <p>New construction electrical from ground up to handover.</p>
      </div>
      <div class="client-card">
        <div class="client-icon"><i class="fas fa-briefcase"></i></div>
        <h3>Business Owners</h3>
        <p>Custom solutions for any commercial electrical need.</p>
      </div>
    </div>
  </div>
</section>

<!-- TEAM SECTION TEASER -->
<section class="section team-teaser">
  <div class="container">
    <div class="team-teaser-inner">
      <div class="team-teaser-content">
        <div class="section-tag">Our People</div>
        <h2 class="section-title">A Team You Can<br><span>Trust on the Job</span></h2>
        <p>Our certified electricians and support staff are committed to delivering excellence on every project. From the office to the field, Bello runs on professionalism, teamwork, and a passion for quality work.</p>
        <a href="/about#team" class="btn btn-primary">Meet Our Team</a>
      </div>
      <div class="team-photo-collage">
        <img src="https://www.genspark.ai/api/files/s/twhZVmUv" alt="Bello Electrical Services full team" class="team-main-photo" loading="lazy">
        <div class="team-sub-photos">
          <img src="https://www.genspark.ai/api/files/s/8R9X6aUI" alt="Bello team member" loading="lazy">
          <img src="https://www.genspark.ai/api/files/s/wvwYeDRZ" alt="Bello technician" loading="lazy">
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA SECTION -->
<section class="cta-section">
  <div class="cta-overlay"></div>
  <div class="cta-content">
    <h2>Ready to Get Started?</h2>
    <p>Contact us today for a free consultation and quote. We respond within 24 hours.</p>
    <div class="cta-actions">
      <a href="/contact" class="btn btn-primary btn-lg"><i class="fas fa-envelope"></i> Request a Quote</a>
      <a href="tel:+2975001234" class="btn btn-white btn-lg"><i class="fas fa-phone"></i> Call Us Now</a>
    </div>
    <p class="cta-note"><i class="fas fa-clock"></i> We typically respond within 24 hours</p>
  </div>
</section>

${getFooter()}
</body>
</html>`
}

function renderServicesPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${getHead('Services', 'Full range of commercial electrical services in Aruba – installations, maintenance, solar, panel upgrades, lighting, and emergency support.')}</head>
<body>
${getNavbar('/services')}

<!-- PAGE HERO -->
<section class="page-hero">
  <div class="page-hero-bg">
    <img src="https://www.genspark.ai/api/files/s/girPnj3G" alt="Electrical panel work" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a> <i class="fas fa-chevron-right"></i> Services</div>
    <h1>Our Services</h1>
    <p>Comprehensive electrical solutions for every commercial need in Aruba</p>
  </div>
</section>

<!-- SERVICES INTRO -->
<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">What We Offer</div>
      <h2 class="section-title">Complete Electrical Services<br><span>From Planning to Execution</span></h2>
      <p class="section-subtitle">Bello Electrical Services handles all phases of commercial electrical work — from initial consultation and design to installation, testing, and ongoing maintenance.</p>
    </div>
  </div>
</section>

<!-- DETAILED SERVICES -->
<section class="section services-detail" id="installations">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/FsJDhHTt" alt="Commercial electrical installation" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">01</div>
        <div class="section-tag">Commercial</div>
        <h2>Electrical Installations</h2>
        <p>We provide complete electrical installations for commercial spaces of all sizes. Our team handles everything from load calculations and system design to conduit routing, wiring, panel installation, and final inspection.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> New construction wiring</li>
          <li><i class="fas fa-check"></i> Commercial fit-outs</li>
          <li><i class="fas fa-check"></i> Three-phase power systems</li>
          <li><i class="fas fa-check"></i> Load balancing & distribution</li>
          <li><i class="fas fa-check"></i> Full code compliance</li>
        </ul>
        <a href="/contact" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<section class="section services-detail section-alt" id="maintenance">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/girPnj3G" alt="Preventive maintenance" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">02</div>
        <div class="section-tag">Maintenance</div>
        <h2>Preventive Maintenance & Inspections</h2>
        <p>Regular electrical maintenance is the best way to prevent costly failures and protect your business. Our maintenance programs are tailored to your facility's needs and schedule to minimize disruption.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> Scheduled maintenance visits</li>
          <li><i class="fas fa-check"></i> Thermal imaging inspections</li>
          <li><i class="fas fa-check"></i> Panel testing & cleaning</li>
          <li><i class="fas fa-check"></i> Grounding system verification</li>
          <li><i class="fas fa-check"></i> Compliance documentation</li>
        </ul>
        <a href="/contact" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<section class="section services-detail" id="solar">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/Da7x516z" alt="Solar panel installation" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">03</div>
        <div class="section-tag">Renewable Energy</div>
        <h2>Solar Energy Systems</h2>
        <p>Aruba's sunny climate makes solar power an excellent investment for businesses. We design, install, and commission solar energy systems that integrate seamlessly with your existing electrical infrastructure.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> Solar panel installation</li>
          <li><i class="fas fa-check"></i> Grid-tie & off-grid systems</li>
          <li><i class="fas fa-check"></i> Battery storage solutions</li>
          <li><i class="fas fa-check"></i> Net metering setup</li>
          <li><i class="fas fa-check"></i> System monitoring & maintenance</li>
        </ul>
        <a href="/contact" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<section class="section services-detail section-alt" id="panels">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/bqLIkGQ3" alt="Panel installation" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">04</div>
        <div class="section-tag">Power Distribution</div>
        <h2>Panel Installation & Upgrades</h2>
        <p>Outdated panels are a safety and performance risk. We install, upgrade, and replace electrical panels to ensure your business has reliable, properly protected power distribution that meets today's demands.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> Main panel replacements</li>
          <li><i class="fas fa-check"></i> Sub-panel additions</li>
          <li><i class="fas fa-check"></i> Capacity upgrades</li>
          <li><i class="fas fa-check"></i> AFCI/GFCI protection</li>
          <li><i class="fas fa-check"></i> Surge protection systems</li>
        </ul>
        <a href="/contact" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<section class="section services-detail" id="lighting">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/FsJDhHTt" alt="Commercial lighting" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">05</div>
        <div class="section-tag">Lighting</div>
        <h2>Lighting Systems – Indoor & Outdoor</h2>
        <p>Effective lighting improves safety, productivity, and ambience. We design and install custom lighting solutions for commercial interiors, parking areas, signage, and building exteriors.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> LED lighting design</li>
          <li><i class="fas fa-check"></i> Parking & security lighting</li>
          <li><i class="fas fa-check"></i> Architectural lighting</li>
          <li><i class="fas fa-check"></i> Emergency exit lighting</li>
          <li><i class="fas fa-check"></i> Smart lighting controls</li>
        </ul>
        <a href="/contact" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<section class="section services-detail section-alt" id="emergency">
  <div class="container">
    <div class="service-detail-card reverse">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/w21o6yEm" alt="Emergency electrical support" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">06</div>
        <div class="section-tag">Emergency</div>
        <h2>Emergency Electrical Support</h2>
        <p>Electrical emergencies don't follow business hours. Our team is available 24/7 to respond to power outages, tripped breakers, electrical faults, and safety hazards to get your business back online fast.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> 24/7 availability</li>
          <li><i class="fas fa-check"></i> Rapid response times</li>
          <li><i class="fas fa-check"></i> Fault diagnosis & repair</li>
          <li><i class="fas fa-check"></i> Temporary power solutions</li>
          <li><i class="fas fa-check"></i> Safety assessments</li>
        </ul>
        <a href="tel:+2975001234" class="btn btn-danger"><i class="fas fa-phone"></i> Emergency Line</a>
      </div>
    </div>
  </div>
</section>

<section class="section services-detail" id="energy">
  <div class="container">
    <div class="service-detail-card">
      <div class="service-detail-img">
        <img src="https://www.genspark.ai/api/files/s/LJASeQUs" alt="Energy efficiency" loading="lazy">
      </div>
      <div class="service-detail-content">
        <div class="service-number">07</div>
        <div class="section-tag">Efficiency</div>
        <h2>Energy Efficiency Improvements</h2>
        <p>Reducing energy consumption lowers operating costs and environmental impact. We conduct energy audits and implement solutions like LED retrofits, smart controls, and power factor correction.</p>
        <ul class="service-features">
          <li><i class="fas fa-check"></i> Energy consumption audits</li>
          <li><i class="fas fa-check"></i> LED & fixture upgrades</li>
          <li><i class="fas fa-check"></i> Power factor correction</li>
          <li><i class="fas fa-check"></i> Building automation systems</li>
          <li><i class="fas fa-check"></i> Monitoring & reporting</li>
        </ul>
        <a href="/contact" class="btn btn-primary">Request a Quote</a>
      </div>
    </div>
  </div>
</section>

<!-- CTA SECTION -->
<section class="cta-section">
  <div class="cta-overlay"></div>
  <div class="cta-content">
    <h2>Not Sure What You Need?</h2>
    <p>Contact us for a free consultation. We'll assess your needs and recommend the best solution.</p>
    <div class="cta-actions">
      <a href="/contact" class="btn btn-primary btn-lg"><i class="fas fa-envelope"></i> Request a Quote</a>
      <a href="tel:+2975001234" class="btn btn-white btn-lg"><i class="fas fa-phone"></i> Call Us Now</a>
    </div>
  </div>
</section>

${getFooter()}
</body>
</html>`
}

function renderAboutPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${getHead('About Us', 'Learn about Bello Electrical Services – Aruba\'s trusted commercial electricians since 2015. Meet our team and learn our story.')}</head>
<body>
${getNavbar('/about')}

<!-- PAGE HERO -->
<section class="page-hero">
  <div class="page-hero-bg">
    <img src="https://www.genspark.ai/api/files/s/rcYkUkQ2" alt="Bello Electrical team" class="page-hero-img">
    <div class="page-hero-overlay"></div>
  </div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a> <i class="fas fa-chevron-right"></i> About Us</div>
    <h1>About Bello Electrical</h1>
    <p>Aruba's trusted commercial electrical partner since 2015</p>
  </div>
</section>

<!-- COMPANY STORY -->
<section class="section">
  <div class="container">
    <div class="about-story">
      <div class="about-story-content">
        <div class="section-tag">Our Story</div>
        <h2 class="section-title">Built on Trust,<br><span>Driven by Quality</span></h2>
        <p>Bello Electrical Services was founded with a clear mission: deliver reliable, high-quality electrical solutions to businesses in Aruba. What started as a small team has grown into one of Aruba's most trusted commercial electrical contractors, serving restaurants, offices, retailers, developers, and property managers across the island.</p>
        <p>We believe in doing things right the first time. Every project — from a simple panel swap to a full commercial installation — receives the same level of care, precision, and professionalism. Our work is safe, code-compliant, and built to last.</p>
        <p>Our approach is built on long-term client relationships. We don't just complete jobs and move on — we stay connected, respond fast, and support our clients for the life of the system.</p>
        <div class="about-quote">
          <blockquote>"Ridiculously Good. Exactly What You Need."</blockquote>
          <cite>— Bello Electrical Services</cite>
        </div>
      </div>
      <div class="about-story-image">
        <img src="https://www.genspark.ai/api/files/s/QDOLTJji" alt="Bello team at work in Aruba" loading="lazy">
        <div class="about-img-accent">
          <img src="https://www.genspark.ai/api/files/s/P9PpnwhD" alt="Bello office team" loading="lazy">
        </div>
      </div>
    </div>
  </div>
</section>

<!-- VALUES -->
<section class="section values-section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">What Drives Us</div>
      <h2 class="section-title">Our Core Values</h2>
    </div>
    <div class="values-grid">
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-shield-alt"></i></div>
        <h3>Safety First</h3>
        <p>Safety is non-negotiable. All our work complies with Aruba's electrical codes and international safety standards.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-medal"></i></div>
        <h3>Quality Work</h3>
        <p>We take pride in every installation. No shortcuts, no compromises — only work we're proud to put our name on.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-handshake"></i></div>
        <h3>Client Focus</h3>
        <p>We build lasting partnerships. Your success is our success, and we stay committed long after the project ends.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-bolt"></i></div>
        <h3>Fast Response</h3>
        <p>We understand that downtime costs money. Our team responds quickly to keep your business running smoothly.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-graduation-cap"></i></div>
        <h3>Expertise</h3>
        <p>Our certified team stays current with the latest technologies and practices in commercial electrical work.</p>
      </div>
      <div class="value-card">
        <div class="value-icon"><i class="fas fa-island-tropical"></i></div>
        <h3>Local Pride</h3>
        <p>We're proudly Aruban. We understand the local environment, codes, and what businesses here truly need.</p>
      </div>
    </div>
  </div>
</section>

<!-- TEAM SECTION -->
<section class="section" id="team">
  <div class="container">
    <div class="section-header">
      <div class="section-tag">Our People</div>
      <h2 class="section-title">Meet the Bello Team</h2>
      <p class="section-subtitle">A team of dedicated professionals committed to excellence in every project.</p>
    </div>
    <div class="team-photos-grid">
      <div class="team-photo-full">
        <img src="https://www.genspark.ai/api/files/s/twhZVmUv" alt="Full Bello Electrical Services team" loading="lazy">
        <div class="team-photo-caption">The Bello Electrical Services Team – Aruba</div>
      </div>
      <div class="team-photos-row">
        <div class="team-photo-item">
          <img src="https://www.genspark.ai/api/files/s/8R9X6aUI" alt="Bello office staff member" loading="lazy">
          <div class="team-member-info">
            <h4>Office & Administration</h4>
            <p>Coordinating projects and client relations</p>
          </div>
        </div>
        <div class="team-photo-item">
          <img src="https://www.genspark.ai/api/files/s/P9PpnwhD" alt="Bello project coordinator" loading="lazy">
          <div class="team-member-info">
            <h4>Project Coordination</h4>
            <p>Planning and scheduling all field work</p>
          </div>
        </div>
        <div class="team-photo-item">
          <img src="https://www.genspark.ai/api/files/s/NLorPAc3" alt="Bello team member" loading="lazy">
          <div class="team-member-info">
            <h4>Operations Team</h4>
            <p>Keeping everything running smoothly</p>
          </div>
        </div>
      </div>
      <div class="team-photos-row">
        <div class="team-photo-item">
          <img src="https://www.genspark.ai/api/files/s/wvwYeDRZ" alt="Bello field electrician" loading="lazy">
          <div class="team-member-info">
            <h4>Field Electricians</h4>
            <p>Expert installation & maintenance</p>
          </div>
        </div>
        <div class="team-photo-item">
          <img src="https://www.genspark.ai/api/files/s/lW2yqxHU" alt="Bello technician ready for job" loading="lazy">
          <div class="team-member-info">
            <h4>Service Technicians</h4>
            <p>Ready to respond to any electrical need</p>
          </div>
        </div>
        <div class="team-photo-item">
          <img src="https://www.genspark.ai/api/files/s/pudKGucK" alt="Bello solar installation team" loading="lazy">
          <div class="team-member-info">
            <h4>Solar Specialists</h4>
            <p>Certified in renewable energy systems</p>
          </div>
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
        <div class="stat-number-lg">10+</div>
        <div class="stat-label-lg">Years in Business</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-project-diagram"></i></div>
        <div class="stat-number-lg">500+</div>
        <div class="stat-label-lg">Projects Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div class="stat-number-lg">200+</div>
        <div class="stat-label-lg">Happy Clients</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-hard-hat"></i></div>
        <div class="stat-number-lg">15+</div>
        <div class="stat-label-lg">Certified Professionals</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-overlay"></div>
  <div class="cta-content">
    <h2>Ready to Work Together?</h2>
    <p>Let's discuss your project and find the right solution for your business.</p>
    <div class="cta-actions">
      <a href="/contact" class="btn btn-primary btn-lg"><i class="fas fa-envelope"></i> Contact Us</a>
      <a href="/services" class="btn btn-white btn-lg"><i class="fas fa-bolt"></i> View Services</a>
    </div>
  </div>
</section>

${getFooter()}
</body>
</html>`
}

function renderContactPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>${getHead('Contact', 'Contact Bello Electrical Services in Aruba. Get a free quote for your commercial electrical project. We respond within 24 hours.')}</head>
<body>
${getNavbar('/contact')}

<!-- PAGE HERO -->
<section class="page-hero page-hero-short">
  <div class="page-hero-overlay-solid"></div>
  <div class="page-hero-content">
    <div class="breadcrumb"><a href="/">Home</a> <i class="fas fa-chevron-right"></i> Contact</div>
    <h1>Contact Us</h1>
    <p>Get a free quote or reach out with any questions</p>
  </div>
</section>

<!-- CONTACT SECTION -->
<section class="section contact-section" id="quote">
  <div class="container">
    <div class="contact-grid">
      <!-- CONTACT FORM -->
      <div class="contact-form-wrapper">
        <div class="form-header">
          <h2>Request a Free Quote</h2>
          <p>Fill in your details and we'll get back to you within 24 hours.</p>
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
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" placeholder="+297 000-0000">
            </div>
            <div class="form-group">
              <label for="company">Company Name</label>
              <input type="text" id="company" name="company" placeholder="Your company">
            </div>
          </div>
          <div class="form-group">
            <label for="service">Service Needed</label>
            <select id="service" name="service">
              <option value="">Select a service...</option>
              <option value="installation">Commercial Installation</option>
              <option value="maintenance">Preventive Maintenance</option>
              <option value="solar">Solar Energy System</option>
              <option value="panel">Panel Installation/Upgrade</option>
              <option value="lighting">Lighting System</option>
              <option value="emergency">Emergency Support</option>
              <option value="energy">Energy Efficiency</option>
              <option value="troubleshooting">Troubleshooting & Repair</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="message">Project Details *</label>
            <textarea id="message" name="message" rows="5" placeholder="Describe your project or question in detail..." required></textarea>
          </div>
          <div id="formStatus" class="form-status" style="display:none;"></div>
          <button type="submit" class="btn btn-primary btn-full" id="submitBtn">
            <i class="fas fa-paper-plane"></i>
            <span>Send Message</span>
          </button>
          <p class="form-note"><i class="fas fa-lock"></i> Your information is secure and will never be shared.</p>
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
                <a href="tel:+2975001234">+297 500-1234</a>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fas fa-envelope"></i></div>
              <div class="contact-info-content">
                <h4>Email</h4>
                <a href="mailto:info@electricalservicesaruba.com">info@electricalservicesaruba.com</a>
              </div>
            </div>
            <div class="contact-info-item">
              <div class="contact-info-icon"><i class="fas fa-globe"></i></div>
              <div class="contact-info-content">
                <h4>Website</h4>
                <a href="https://www.electricalservicesaruba.com">electricalservicesaruba.com</a>
              </div>
            </div>
          </div>
          <div class="contact-hours">
            <h4><i class="fas fa-clock"></i> Business Hours</h4>
            <div class="hours-grid">
              <div class="hours-row">
                <span>Monday – Friday</span>
                <span>7:00 AM – 5:00 PM</span>
              </div>
              <div class="hours-row">
                <span>Saturday</span>
                <span>By Appointment</span>
              </div>
              <div class="hours-row emergency">
                <span>Emergency</span>
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
          <div class="contact-social">
            <h4>Follow Us</h4>
            <div class="social-links">
              <a href="#" class="social-link" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="social-link" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="#" class="social-link" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
              <a href="#" class="social-link whatsapp" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            </div>
          </div>
        </div>
        <div class="contact-team-img">
          <img src="https://www.genspark.ai/api/files/s/QDOLTJji" alt="Bello team ready to help" loading="lazy">
          <div class="contact-team-caption">
            <i class="fas fa-hard-hat"></i>
            <span>Our team is ready to help you</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

${getFooter()}
</body>
</html>`
}

export default app
