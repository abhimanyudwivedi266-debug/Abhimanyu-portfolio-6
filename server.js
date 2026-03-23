/* ============================================================
   Abhimanyu Dwivedi — Portfolio + Admin  |  server.js
   Stack: Node.js + Express | In-memory | JWT | bcryptjs
   ============================================================ */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'AbhimanyuSecret2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'abhimanyu';
const ADMIN_PASSWORD_RAW = process.env.ADMIN_PASSWORD || 'Abhi@9303309045';

app.use(cors());
app.use(express.json());

/* ── In-memory store ── */
let adminPasswordHash = bcrypt.hashSync(ADMIN_PASSWORD_RAW, 10);
let inquiries = [];
let blogs = [];
let nextInquiryId = 1;
let nextBlogId = 1;

/* ── Auth middleware ── */
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

/* ═══════════════════════════════════════
   API ROUTES
═══════════════════════════════════════ */

/* Health */
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

/* Auth */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Fields required' });
  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, adminPasswordHash))
    return res.status(401).json({ error: 'Invalid username or password' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/auth/verify', auth, (req, res) => res.json({ ok: true }));

app.put('/api/auth/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });
  if (!bcrypt.compareSync(currentPassword, adminPasswordHash))
    return res.status(401).json({ error: 'Current password is incorrect' });
  adminPasswordHash = bcrypt.hashSync(newPassword, 10);
  res.json({ message: 'Password updated successfully' });
});

/* Inquiries */
app.post('/api/inquiries', (req, res) => {
  const { fullName, phone, email, budget, service, message } = req.body;
  if (!fullName || !phone || !service || !message)
    return res.status(400).json({ error: 'Required fields missing' });
  const inq = { id: nextInquiryId++, fullName, phone, email, budget, service, message,
    status: 'New', notes: '', createdAt: new Date().toISOString() };
  inquiries.unshift(inq);
  res.status(201).json({ message: 'Inquiry received' });
});

app.get('/api/inquiries', auth, (req, res) => {
  const { status } = req.query;
  const list = status ? inquiries.filter(i => i.status === status) : inquiries;
  res.json(list);
});

app.put('/api/inquiries/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = inquiries.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  inquiries[idx] = { ...inquiries[idx], ...req.body };
  res.json(inquiries[idx]);
});

app.delete('/api/inquiries/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = inquiries.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  inquiries.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

/* Blogs */
app.get('/api/blogs', (_, res) => res.json(blogs));

app.post('/api/blogs', auth, (req, res) => {
  const { title, coverImage, tag, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const blog = { id: nextBlogId++, title, coverImage, tag, content, createdAt: new Date().toISOString() };
  blogs.unshift(blog);
  res.status(201).json(blog);
});

app.delete('/api/blogs/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = blogs.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  blogs.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

/* ═══════════════════════════════════════
   FRONTEND HTML  (Main Site)
═══════════════════════════════════════ */
const mainHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Abhimanyu Dwivedi — Web Developer & Digital Growth Partner</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Dancing+Script:wght@700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#060612;
  --card:#0d0d20;
  --border:rgba(123,47,190,0.25);
  --accent:#00D2FF;
  --purple:#7B2FBE;
  --text:#e2e8f0;
  --muted:#94a3b8;
  --grad1:linear-gradient(135deg,#00D2FF,#7B2FBE);
  --grad2:linear-gradient(135deg,#7B2FBE,#FF6B6B);
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;overflow-x:hidden;line-height:1.6}

/* Scrollbar */
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0a0a18}::-webkit-scrollbar-thumb{background:var(--purple);border-radius:3px}

/* NAV */
nav{position:sticky;top:0;z-index:100;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);background:rgba(6,6,18,0.8);border-bottom:1px solid var(--border);padding:0 6%}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{font-family:'Dancing Script',cursive;font-size:2rem;font-weight:700;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;white-space:nowrap;cursor:pointer}
.nav-links{display:flex;align-items:center;gap:2rem;list-style:none}
.nav-links a{color:var(--muted);text-decoration:none;font-size:.9rem;font-weight:500;transition:.3s}
.nav-links a:hover{color:#fff}
.btn-quote{background:var(--grad1);color:#fff;border:none;padding:.5rem 1.3rem;border-radius:50px;font-size:.9rem;font-weight:600;cursor:pointer;transition:.3s;white-space:nowrap}
.btn-quote:hover{opacity:.85;transform:scale(1.04)}
.hamburger{display:none;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer}
.mobile-menu{display:none;flex-direction:column;gap:1.2rem;background:rgba(6,6,18,0.97);padding:1.5rem 6%;border-top:1px solid var(--border)}
.mobile-menu a{color:var(--muted);text-decoration:none;font-weight:500}
.mobile-menu.open{display:flex}

/* HERO */
#hero{min-height:100vh;display:flex;align-items:center;position:relative;overflow:hidden;padding:80px 6% 60px;background:var(--bg)}
.grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(0,210,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,255,.04) 1px,transparent 1px);background-size:50px 50px;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
.orb1{width:420px;height:420px;background:radial-gradient(circle,rgba(123,47,190,.35),transparent 70%);top:-60px;right:-60px;animation:floatOrb 6s ease-in-out infinite}
.orb2{width:280px;height:280px;background:radial-gradient(circle,rgba(0,210,255,.2),transparent 70%);bottom:60px;left:-60px}
@keyframes floatOrb{0%,100%{transform:translateY(0)}50%{transform:translateY(-28px)}}
.hero-content{position:relative;z-index:2;max-width:680px}
.avail-badge{display:inline-flex;align-items:center;gap:.55rem;background:rgba(0,210,255,.1);border:1px solid rgba(0,210,255,.3);padding:.38rem 1rem;border-radius:50px;font-size:.82rem;font-weight:600;color:var(--accent);margin-bottom:1.4rem}
.blink{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.hero-content h1{font-size:clamp(2.4rem,5.5vw,4.5rem);font-weight:800;line-height:1.1;margin-bottom:1.2rem}
.grad-text{background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{color:var(--muted);font-size:1.05rem;margin-bottom:1.6rem;max-width:520px}
.tags{display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:2rem}
.tag{background:rgba(123,47,190,.15);border:1px solid rgba(123,47,190,.3);padding:.3rem .8rem;border-radius:50px;font-size:.82rem;font-weight:500}
.hero-btns{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2.5rem}
.btn-primary{background:var(--grad1);color:#fff;border:none;padding:.75rem 1.6rem;border-radius:50px;font-size:.95rem;font-weight:700;cursor:pointer;transition:.3s}
.btn-primary:hover{opacity:.85;transform:translateY(-2px)}
.btn-outline{background:transparent;color:#fff;border:2px solid var(--border);padding:.73rem 1.6rem;border-radius:50px;font-size:.95rem;font-weight:600;cursor:pointer;transition:.3s}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}
.stats{display:flex;gap:2.5rem;flex-wrap:wrap}
.stat h3{font-size:1.8rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat p{font-size:.8rem;color:var(--muted);font-weight:500}

/* SECTIONS */
section{padding:75px 6%}
.section-label{font-size:.8rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:.6rem}
.section-title{font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:800;margin-bottom:.8rem}
.section-sub{color:var(--muted);max-width:520px;margin-bottom:2.8rem}

/* SERVICES */
#services{background:rgba(13,13,32,.5)}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1.5rem}
.service-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.8rem;position:relative;overflow:hidden;transition:.3s;cursor:default}
.service-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--grad1)}
.service-card:hover{transform:translateY(-5px);border-color:rgba(0,210,255,.4)}
.svc-icon{width:52px;height:52px;border-radius:12px;background:rgba(123,47,190,.2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1rem}
.service-card h3{font-size:1.1rem;font-weight:700;margin-bottom:.5rem}
.service-card p{color:var(--muted);font-size:.88rem}

/* PRICING */
#pricing{}
.price-tabs{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:2.2rem}
.price-tab{background:rgba(13,13,32,.8);border:1px solid var(--border);color:var(--muted);padding:.55rem 1.2rem;border-radius:50px;font-size:.88rem;font-weight:600;cursor:pointer;transition:.3s}
.price-tab.active{background:var(--grad1);border-color:transparent;color:#fff}
.price-pane{display:none}
.price-pane.active{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1.5rem}
.price-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:1.8rem;position:relative;transition:.3s}
.price-card.popular{border-color:var(--purple);box-shadow:0 0 30px rgba(123,47,190,.25)}
.popular-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--grad1);color:#fff;font-size:.72rem;font-weight:700;padding:.25rem .85rem;border-radius:50px;white-space:nowrap}
.price-card h3{font-size:1.1rem;font-weight:700;margin-bottom:.4rem}
.price-amount{font-size:1.4rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:1rem}
.price-features{list-style:none;display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.5rem}
.price-features li{color:var(--muted);font-size:.85rem;display:flex;align-items:flex-start;gap:.5rem}
.price-features li::before{content:'✓';color:#22c55e;font-weight:700;flex-shrink:0}
.btn-started{width:100%;background:var(--grad1);color:#fff;border:none;padding:.7rem;border-radius:50px;font-weight:600;cursor:pointer;transition:.3s;font-size:.9rem}
.btn-started:hover{opacity:.85}
.addon-note{margin-top:2rem;background:rgba(123,47,190,.1);border:1px solid rgba(123,47,190,.25);border-radius:12px;padding:1rem 1.4rem;color:var(--muted);font-size:.85rem}

/* BLOG */
#blog{background:rgba(13,13,32,.5)}
.blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
.blog-card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:.3s}
.blog-card:hover{transform:translateY(-4px);border-color:rgba(0,210,255,.4)}
.blog-img{width:100%;height:180px;object-fit:cover;background:rgba(123,47,190,.2)}
.blog-img-placeholder{width:100%;height:180px;background:linear-gradient(135deg,rgba(123,47,190,.3),rgba(0,210,255,.2));display:flex;align-items:center;justify-content:center;font-size:2rem}
.blog-body{padding:1.2rem}
.blog-tag{display:inline-block;background:var(--grad1);color:#fff;font-size:.7rem;font-weight:700;padding:.2rem .65rem;border-radius:50px;margin-bottom:.6rem}
.blog-date{color:var(--muted);font-size:.77rem;margin-bottom:.4rem}
.blog-title{font-size:1rem;font-weight:700;margin-bottom:.8rem}
.blog-more{color:var(--accent);font-size:.85rem;font-weight:600;text-decoration:none}
.no-blogs{text-align:center;color:var(--muted);padding:3rem}

/* CONTACT */
#contact{}
.contact-grid{display:grid;grid-template-columns:1fr 1.8fr;gap:2.5rem;align-items:start}
.contact-info{display:flex;flex-direction:column;gap:1.2rem}
.contact-item{display:flex;align-items:center;gap:1rem;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.1rem}
.ci-icon{width:44px;height:44px;border-radius:10px;background:rgba(0,210,255,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.contact-item h4{font-size:.82rem;color:var(--muted);margin-bottom:.2rem}
.contact-item a,.contact-item p{color:#fff;font-weight:600;text-decoration:none;font-size:.9rem}
.contact-item a:hover{color:var(--accent)}
.tip-box{background:rgba(0,210,255,.07);border:1px solid rgba(0,210,255,.2);border-radius:12px;padding:1rem 1.2rem;font-size:.82rem;color:var(--muted)}
.tip-box strong{color:var(--accent)}
.contact-form{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2rem}
.contact-form h3{font-size:1.2rem;font-weight:700;margin-bottom:1.4rem}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
.form-group{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem}
.form-group label{font-size:.82rem;font-weight:600;color:var(--muted)}
.form-group input,.form-group select,.form-group textarea{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;padding:.65rem .9rem;color:#fff;font-size:.9rem;font-family:inherit;transition:.3s;outline:none}
.form-group input:focus,.form-group select,.form-group textarea:focus{border-color:var(--accent)}
.form-group select{cursor:pointer}
.form-group select option{background:#0d0d20}
.form-group textarea{resize:vertical;min-height:110px}
.btn-submit{width:100%;background:var(--grad1);color:#fff;border:none;padding:.82rem;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;transition:.3s}
.btn-submit:hover{opacity:.85}
.btn-submit:disabled{opacity:.6;cursor:default}
.form-msg{margin-top:.8rem;padding:.7rem 1rem;border-radius:10px;font-size:.88rem;font-weight:500;display:none}
.form-msg.success{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#86efac;display:block}
.form-msg.error{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;display:block}

/* FOOTER */
footer{background:rgba(6,6,12,.8);border-top:1px solid var(--border);padding:2.5rem 6%;text-align:center}
footer .brand{display:inline-block;margin-bottom:.4rem;font-size:1.6rem}
.footer-tag{color:var(--muted);font-size:.82rem;margin-bottom:1.2rem}
.footer-links{display:flex;justify-content:center;gap:1.8rem;flex-wrap:wrap;margin-bottom:1.2rem}
.footer-links a{color:var(--muted);text-decoration:none;font-size:.85rem;font-weight:500;transition:.3s}
.footer-links a:hover{color:var(--accent)}
.footer-copy{color:rgba(148,163,184,.5);font-size:.78rem}

/* WHATSAPP FLOAT */
.wa-float{position:fixed;bottom:1.6rem;right:1.6rem;z-index:200;width:58px;height:58px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.4);text-decoration:none;transition:.3s}
.wa-float:hover{transform:scale(1.1)}
.wa-float::before{content:'';position:absolute;width:58px;height:58px;border-radius:50%;background:#25D366;animation:waPulse 2s infinite;z-index:-1}
@keyframes waPulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.7);opacity:0}}

/* RESPONSIVE */
@media(max-width:900px){.contact-grid{grid-template-columns:1fr}}
@media(max-width:768px){
  .nav-links,.btn-quote{display:none}
  .hamburger{display:block}
  section{padding:55px 5%}
  .form-row{grid-template-columns:1fr}
  .stats{gap:1.5rem}
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-inner">
    <span class="brand" onclick="goTo('hero')">Abhimanyu Dwivedi</span>
    <ul class="nav-links">
      <li><a href="#" onclick="goTo('services');return false">Services</a></li>
      <li><a href="#" onclick="goTo('pricing');return false">Pricing</a></li>
      <li><a href="#" onclick="goTo('blog');return false">Blog</a></li>
      <li><a href="#" onclick="goTo('contact');return false">Contact</a></li>
    </ul>
    <button class="btn-quote" onclick="goTo('contact')">Get Quote ✦</button>
    <button class="hamburger" onclick="toggleMenu()" id="hamBtn">☰</button>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    <a href="#" onclick="goTo('services');closeMobile()">Services</a>
    <a href="#" onclick="goTo('pricing');closeMobile()">Pricing</a>
    <a href="#" onclick="goTo('blog');closeMobile()">Blog</a>
    <a href="#" onclick="goTo('contact');closeMobile()">Contact</a>
    <button class="btn-quote" onclick="goTo('contact');closeMobile()">Get Quote ✦</button>
  </div>
</nav>

<!-- HERO -->
<section id="hero">
  <div class="grid-bg"></div>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="hero-content">
    <div class="avail-badge"><span class="blink"></span>🟢 Available for New Projects</div>
    <h1>Your Digital Growth<br><span class="grad-text">Partner</span></h1>
    <p class="hero-sub">I build powerful digital systems — from blazing-fast websites to smart automations — that grow your business 24/7.</p>
    <div class="tags">
      <span class="tag">🤖 Web Dev</span>
      <span class="tag">📱 Apps</span>
      <span class="tag">⚡ Automation</span>
      <span class="tag">📢 Marketing</span>
      <span class="tag">🎬 Videos</span>
      <span class="tag">🌐 Websites</span>
    </div>
    <div class="hero-btns">
      <button class="btn-primary" onclick="goTo('contact')">🚀 Start Your Project</button>
      <button class="btn-outline" onclick="goTo('pricing')">View Pricing →</button>
    </div>
    <div class="stats">
      <div class="stat"><h3>50+</h3><p>Projects Done</p></div>
      <div class="stat"><h3>30+</h3><p>Happy Clients</p></div>
      <div class="stat"><h3>3+</h3><p>Years Exp</p></div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section id="services">
  <div class="section-label">What I Offer</div>
  <h2 class="section-title">My <span class="grad-text">Services</span></h2>
  <p class="section-sub">End-to-end digital solutions tailored to your business goals.</p>
  <div class="services-grid">
    <div class="service-card"><div class="svc-icon">🤖</div><h3>Web Development</h3><p>Custom web apps, chatbots, and dashboards built for performance and scale.</p></div>
    <div class="service-card"><div class="svc-icon">⚡</div><h3>Workflow Automation</h3><p>n8n, WhatsApp, CRM, and lead nurturing automations that save hours daily.</p></div>
    <div class="service-card"><div class="svc-icon">📱</div><h3>App Development</h3><p>Android & iOS apps with React Native or Flutter — smooth, native feel.</p></div>
    <div class="service-card"><div class="svc-icon">📢</div><h3>Digital Marketing</h3><p>Google & Meta Ads, social media management, and data-driven growth.</p></div>
    <div class="service-card"><div class="svc-icon">🎬</div><h3>Video Editing</h3><p>Reels, shorts, and long-form videos that stop the scroll and convert.</p></div>
    <div class="service-card"><div class="svc-icon">🌐</div><h3>Website Development</h3><p>SEO-ready websites with contact forms, branding, and lasting impressions.</p></div>
  </div>
</section>

<!-- PRICING -->
<section id="pricing">
  <div class="section-label">Transparent Pricing</div>
  <h2 class="section-title">Choose Your <span class="grad-text">Plan</span></h2>
  <p class="section-sub">Flexible packages for every stage of your business journey.</p>

  <div class="price-tabs" id="priceTabs">
    <button class="price-tab active" data-tab="dm">📢 Digital Marketing</button>
    <button class="price-tab" data-tab="ve">🎬 Video Editing</button>
    <button class="price-tab" data-tab="web">🌐 Website</button>
    <button class="price-tab" data-tab="ai">🤖 AI & Apps</button>
  </div>

  <!-- Tab: Digital Marketing -->
  <div class="price-pane active" id="pane-dm">
    <div class="price-card">
      <h3>Basic</h3>
      <div class="price-amount">₹5,000–8,000/Month</div>
      <ul class="price-features">
        <li>12 Posts/Month</li><li>4 Reels/Month</li><li>GMB Management</li>
        <li>WhatsApp Updates</li><li>Basic Branding</li><li>Local Reach Focus</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card popular">
      <div class="popular-badge">⭐ POPULAR</div>
      <h3>Standard</h3>
      <div class="price-amount">₹10,000–18,000/Month</div>
      <ul class="price-features">
        <li>20–25 Posts & Reels</li><li>Meta Ads Management</li><li>Landing Page</li>
        <li>Lead Automation</li><li>Analytics Report</li><li>Priority Support</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card">
      <h3>Premium</h3>
      <div class="price-amount">₹25,000–50,000/Month</div>
      <ul class="price-features">
        <li>Daily Content Creation</li><li>Full Sales Funnel</li><li>CRM + Chatbot</li>
        <li>YouTube Management</li><li>High-Lead Campaigns</li><li>Dedicated Manager</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
  </div>

  <!-- Tab: Video Editing -->
  <div class="price-pane" id="pane-ve">
    <div class="price-card">
      <h3>Basic</h3>
      <div class="price-amount">₹500–1,500/Reel</div>
      <ul class="price-features">
        <li>Hook Creation</li><li>Captions & Subtitles</li><li>Sound Design</li>
        <li>Emoji Overlays</li><li>30–60 Second Edits</li><li>2 Revisions</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card">
      <h3>Standard</h3>
      <div class="price-amount">₹2,000–5,000/Video</div>
      <ul class="price-features">
        <li>Multi-Camera Editing</li><li>Color Grading</li><li>B-Roll Integration</li>
        <li>Motion Graphics</li><li>Sound Mixing</li><li>3 Revisions</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card popular">
      <div class="popular-badge">⭐ POPULAR</div>
      <h3>Premium</h3>
      <div class="price-amount">₹8,000+/Month</div>
      <ul class="price-features">
        <li>1 Long Video + 3 Reels</li><li>Batch 10+ Edits</li><li>Priority Turnaround</li>
        <li>Brand Kit Integration</li><li>Thumbnail Design</li><li>Unlimited Revisions</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
  </div>

  <!-- Tab: Website -->
  <div class="price-pane" id="pane-web">
    <div class="price-card">
      <h3>Basic</h3>
      <div class="price-amount">₹5,000 One Time</div>
      <ul class="price-features">
        <li>3–4 Pages</li><li>Mobile Friendly</li><li>Hosting 1 Year</li>
        <li>Contact Form</li><li>15 Days Support</li><li>Basic SEO</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card popular">
      <div class="popular-badge">⭐ POPULAR</div>
      <h3>Standard</h3>
      <div class="price-amount">₹10,000 One Time</div>
      <ul class="price-features">
        <li>5–7 Pages</li><li>Contact Form + Inquiry</li><li>Full SEO Optimization</li>
        <li>Free Domain Included</li><li>1 Month Support</li><li>Speed Optimized</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card">
      <h3>Premium</h3>
      <div class="price-amount">₹15,000 One Time</div>
      <ul class="price-features">
        <li>8–10+ Pages</li><li>WhatsApp Integration</li><li>Admin Panel</li>
        <li>3 Months Support</li><li>Advanced Animations</li><li>CMS / Blog</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
  </div>

  <!-- Tab: AI & Apps -->
  <div class="price-pane" id="pane-ai">
    <div class="price-card popular">
      <div class="popular-badge">⭐ POPULAR</div>
      <h3>Web Dev</h3>
      <div class="price-amount">₹15,000–80,000/Project</div>
      <ul class="price-features">
        <li>Custom Web Apps</li><li>Chatbot Integration</li><li>Admin Dashboard</li>
        <li>REST API Development</li><li>Cloud Deployment</li><li>3 Months Support</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card">
      <h3>Automation</h3>
      <div class="price-amount">₹5,000–30,000/Project</div>
      <ul class="price-features">
        <li>WhatsApp Automation</li><li>CRM Integration</li><li>Email Sequences</li>
        <li>Google Sheets Sync</li><li>n8n Workflows</li><li>30 Days Support</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
    <div class="price-card">
      <h3>App Dev</h3>
      <div class="price-amount">₹25,000–1,50,000/Project</div>
      <ul class="price-features">
        <li>Android + iOS</li><li>Flutter Framework</li><li>Backend API</li>
        <li>Database Setup</li><li>Play Store Deploy</li><li>6 Months Support</li>
      </ul>
      <button class="btn-started" data-goto="contact">Get Started</button>
    </div>
  </div>

  <div class="addon-note">
    <strong>Add-ons:</strong> Logo Design ₹1,000 &nbsp;•&nbsp; Monthly Maintenance ₹500/mo &nbsp;•&nbsp; Content Upload ₹300 &nbsp;•&nbsp; WhatsApp Button Setup ₹300
  </div>
</section>

<!-- BLOG -->
<section id="blog">
  <div class="section-label">Insights & Updates</div>
  <h2 class="section-title">Latest <span class="grad-text">Blog</span></h2>
  <p class="section-sub">Tips, case studies, and digital marketing insights.</p>
  <div class="blog-grid" id="blogGrid">
    <div class="no-blogs" style="grid-column:1/-1">Loading posts...</div>
  </div>
</section>

<!-- CONTACT -->
<section id="contact">
  <div class="section-label">Let's Work Together</div>
  <h2 class="section-title">Get In <span class="grad-text">Touch</span></h2>
  <p class="section-sub">Ready to launch? Drop a message and I'll get back within 24 hours.</p>
  <div class="contact-grid">
    <!-- Left -->
    <div class="contact-info">
      <div class="contact-item">
        <div class="ci-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </div>
        <div>
          <h4>WhatsApp</h4>
          <a href="https://wa.me/919303309045" target="_blank">+91 9303309045</a>
        </div>
      </div>
      <div class="contact-item">
        <div class="ci-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/></svg>
        </div>
        <div>
          <h4>Phone</h4>
          <a href="tel:+919303309045">+91 9303309045</a>
        </div>
      </div>
      <div class="contact-item">
        <div class="ci-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B2FBE" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <h4>Freelancer</h4>
          <p>Abhimanyu Dwivedi</p>
        </div>
      </div>
      <div class="tip-box">
        💡 <strong>Pro tip:</strong> Mention your budget range and expected timeline for a faster, more accurate quote!
      </div>
    </div>
    <!-- Right: Form -->
    <div class="contact-form">
      <h3>Send an Inquiry</h3>
      <div class="form-row">
        <div class="form-group"><label>Full Name *</label><input type="text" id="cName" placeholder="Your name"/></div>
        <div class="form-group"><label>Phone *</label><input type="tel" id="cPhone" placeholder="+91 XXXXXXXXXX"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input type="email" id="cEmail" placeholder="you@example.com"/></div>
        <div class="form-group"><label>Budget</label>
          <select id="cBudget">
            <option value="">Select budget</option>
            <option>Under ₹5,000</option><option>₹5,000–10,000</option>
            <option>₹10,000–25,000</option><option>₹25,000–50,000</option><option>₹50,000+</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Service *</label>
        <select id="cService">
          <option value="">Choose a service</option>
          <option>Web Development</option><option>App Development</option>
          <option>Workflow Automation</option><option>Digital Marketing</option>
          <option>Video Editing</option><option>Website Development</option><option>Other</option>
        </select>
      </div>
      <div class="form-group"><label>Message *</label><textarea id="cMsg" placeholder="Tell me about your project..."></textarea></div>
      <button class="btn-submit" id="submitBtn" onclick="submitInquiry()">Send Message 🚀</button>
      <div class="form-msg" id="formMsg"></div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="brand" onclick="goTo('hero')" style="cursor:pointer">Abhimanyu Dwivedi</div>
  <p class="footer-tag">Web Developer • Digital Marketer • Automation Expert • App Developer</p>
  <div class="footer-links">
    <a href="#" onclick="goTo('services');return false">Services</a>
    <a href="#" onclick="goTo('pricing');return false">Pricing</a>
    <a href="#" onclick="goTo('blog');return false">Blog</a>
    <a href="#" onclick="goTo('contact');return false">Contact</a>
  </div>
  <p class="footer-copy">© 2025 Abhimanyu Dwivedi. All rights reserved.</p>
</footer>

<!-- WhatsApp Float -->
<a href="https://wa.me/919303309045" class="wa-float" target="_blank" title="WhatsApp">
  <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

<script>
/* ── Helpers ── */
function goTo(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
function toggleMenu() {
  var m = document.getElementById('mobileMenu');
  var b = document.getElementById('hamBtn');
  m.classList.toggle('open');
  b.textContent = m.classList.contains('open') ? '✕' : '☰';
}
function closeMobile() {
  var m = document.getElementById('mobileMenu');
  m.classList.remove('open');
  document.getElementById('hamBtn').textContent = '☰';
}

/* ── Pricing tabs (event delegation) ── */
document.getElementById('priceTabs').addEventListener('click', function(e) {
  var tab = e.target.closest('.price-tab');
  if (!tab) return;
  document.querySelectorAll('.price-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.price-pane').forEach(function(p){ p.classList.remove('active'); });
  tab.classList.add('active');
  var pane = document.getElementById('pane-' + tab.dataset.tab);
  if (pane) pane.classList.add('active');
});

/* ── Get Started buttons (event delegation) ── */
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.btn-started');
  if (btn && btn.dataset.goto) goTo(btn.dataset.goto);
});

/* ── Load blogs ── */
async function loadBlogs() {
  var grid = document.getElementById('blogGrid');
  try {
    var res = await fetch('/api/blogs');
    var blogs = await res.json();
    if (!blogs.length) { grid.innerHTML = '<div class="no-blogs" style="grid-column:1/-1">No posts yet. Check back soon! 📝</div>'; return; }
    grid.innerHTML = blogs.map(function(b) {
      var d = new Date(b.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
      var img = b.coverImage
        ? '<img class="blog-img" src="' + b.coverImage + '" alt="' + b.title + '" onerror="this.style.display=\'none\'">'
        : '<div class="blog-img-placeholder">📝</div>';
      return '<div class="blog-card">' + img + '<div class="blog-body">'
        + (b.tag ? '<span class="blog-tag">' + b.tag + '</span>' : '')
        + '<div class="blog-date">' + d + '</div>'
        + '<div class="blog-title">' + b.title + '</div>'
        + '<a class="blog-more">Read More →</a></div></div>';
    }).join('');
  } catch(e) { grid.innerHTML = '<div class="no-blogs" style="grid-column:1/-1">Could not load posts.</div>'; }
}
loadBlogs();

/* ── Contact form ── */
async function submitInquiry() {
  var btn = document.getElementById('submitBtn');
  var msg = document.getElementById('formMsg');
  var fullName = document.getElementById('cName').value.trim();
  var phone = document.getElementById('cPhone').value.trim();
  var email = document.getElementById('cEmail').value.trim();
  var budget = document.getElementById('cBudget').value;
  var service = document.getElementById('cService').value;
  var message = document.getElementById('cMsg').value.trim();
  msg.className = 'form-msg'; msg.style.display='none';
  if (!fullName || !phone || !service || !message) {
    msg.textContent = '⚠️ Please fill all required fields.';
    msg.className = 'form-msg error'; return;
  }
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    var res = await fetch('/api/inquiries', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ fullName, phone, email, budget, service, message })
    });
    if (res.ok) {
      msg.textContent = '✅ Inquiry sent! Will contact within 24 hours.';
      msg.className = 'form-msg success';
      document.getElementById('cName').value='';document.getElementById('cPhone').value='';
      document.getElementById('cEmail').value='';document.getElementById('cBudget').value='';
      document.getElementById('cService').value='';document.getElementById('cMsg').value='';
    } else { throw new Error('Server error'); }
  } catch(e) {
    msg.textContent = '❌ Something went wrong. Please try WhatsApp instead.';
    msg.className = 'form-msg error';
  }
  btn.disabled = false; btn.textContent = 'Send Message 🚀';
}
</script>
</body>
</html>`;

/* ═══════════════════════════════════════
   ADMIN HTML
═══════════════════════════════════════ */
const adminHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admin — Abhimanyu Dwivedi</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Dancing+Script:wght@700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#060612;--sidebar:#0a0a1a;--card:#0d0d20;
  --border:rgba(123,47,190,.25);--accent:#00D2FF;--purple:#7B2FBE;
  --text:#e2e8f0;--muted:#94a3b8;
  --grad1:linear-gradient(135deg,#00D2FF,#7B2FBE);
}
body{background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh}

/* LOGIN */
#loginPage{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}
.login-box{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2.5rem;width:100%;max-width:420px}
.login-brand{font-family:'Dancing Script',cursive;font-size:1.8rem;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-align:center;margin-bottom:.3rem}
.login-sub{text-align:center;color:var(--muted);font-size:.85rem;margin-bottom:2rem}
.lf-group{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem}
.lf-group label{font-size:.82rem;font-weight:600;color:var(--muted)}
.lf-group input{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;padding:.65rem .9rem;color:#fff;font-size:.9rem;outline:none;transition:.3s;font-family:inherit}
.lf-group input:focus{border-color:var(--accent)}
.btn-login{width:100%;background:var(--grad1);color:#fff;border:none;padding:.8rem;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:.5rem;transition:.3s}
.btn-login:hover{opacity:.85}
.login-err{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;padding:.6rem 1rem;border-radius:8px;font-size:.85rem;margin-top:.8rem;display:none}
.login-back{text-align:center;margin-top:1.2rem;font-size:.83rem;color:var(--muted)}
.login-back a{color:var(--accent);text-decoration:none;font-weight:600}

/* ADMIN LAYOUT */
#adminApp{display:none}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:210px;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:50;transition:transform .3s}
.sb-brand{font-family:'Dancing Script',cursive;font-size:1.4rem;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;padding:1.3rem 1.2rem;border-bottom:1px solid var(--border)}
.sb-nav{flex:1;padding:1rem 0}
.sb-link{display:flex;align-items:center;gap:.7rem;padding:.7rem 1.2rem;color:var(--muted);cursor:pointer;font-size:.88rem;font-weight:500;transition:.3s;position:relative;text-decoration:none}
.sb-link:hover,.sb-link.active{color:#fff;background:rgba(123,47,190,.15)}
.sb-badge{background:#ef4444;color:#fff;font-size:.65rem;font-weight:700;padding:.1rem .45rem;border-radius:50px;min-width:18px;text-align:center}
.sb-bottom{padding:1rem 1.2rem;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:.6rem}
.sb-site{color:var(--accent);text-decoration:none;font-size:.84rem;font-weight:600}
.sb-logout{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;padding:.5rem 1rem;border-radius:8px;font-size:.84rem;cursor:pointer;transition:.3s;font-family:inherit}
.sb-logout:hover{background:rgba(239,68,68,.2)}
.main-content{margin-left:210px;padding:2rem;min-height:100vh}
.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem}
.topbar h1{font-size:1.5rem;font-weight:800}
.ham-admin{display:none;background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}
.overlay.show{display:block}

/* PAGES */
.page{display:none}
.page.active{display:block}

/* STAT CARDS */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.2rem;margin-bottom:2rem}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.4rem}
.stat-card h4{font-size:.8rem;color:var(--muted);font-weight:600;margin-bottom:.5rem}
.stat-card .val{font-size:2rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* TABLES */
.table-wrap{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:.85rem}
thead{border-bottom:1px solid var(--border)}
th{padding:.8rem 1rem;text-align:left;color:var(--muted);font-weight:600;white-space:nowrap}
td{padding:.75rem 1rem;border-bottom:1px solid rgba(123,47,190,.1);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(123,47,190,.05)}
.status-badge{display:inline-block;padding:.2rem .6rem;border-radius:50px;font-size:.72rem;font-weight:700}
.s-New{background:rgba(0,210,255,.15);color:var(--accent)}
.s-Contacted{background:rgba(234,179,8,.15);color:#fde68a}
.s-Converted{background:rgba(34,197,94,.15);color:#86efac}
.s-Closed{background:rgba(148,163,184,.15);color:var(--muted)}
.action-btn{background:none;border:1px solid var(--border);color:var(--muted);padding:.3rem .55rem;border-radius:6px;cursor:pointer;font-size:.8rem;transition:.3s}
.action-btn:hover{border-color:var(--accent);color:var(--accent)}
.action-btn.del:hover{border-color:#ef4444;color:#ef4444}

/* FILTER TABS */
.filter-tabs{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.2rem}
.ftab{background:rgba(13,13,32,.8);border:1px solid var(--border);color:var(--muted);padding:.4rem 1rem;border-radius:50px;font-size:.82rem;font-weight:600;cursor:pointer;transition:.3s}
.ftab.active{background:var(--grad1);border-color:transparent;color:#fff}

/* FORMS */
.form-section{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.8rem;margin-bottom:1.5rem}
.form-section h3{font-size:1rem;font-weight:700;margin-bottom:1.2rem}
.fg{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem}
.fg label{font-size:.8rem;font-weight:600;color:var(--muted)}
.fg input,.fg textarea{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:.6rem .85rem;color:#fff;font-size:.88rem;outline:none;font-family:inherit}
.fg input:focus,.fg textarea:focus{border-color:var(--accent)}
.fg textarea{resize:vertical;min-height:120px}
.btn-pub{background:var(--grad1);color:#fff;border:none;padding:.65rem 1.5rem;border-radius:50px;font-weight:700;cursor:pointer;font-size:.9rem;transition:.3s}
.btn-pub:hover{opacity:.85}
.pub-msg{margin-top:.6rem;font-size:.85rem;display:none}

/* BLOG ADMIN CARDS */
.blog-admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.2rem}
.bac{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.bac-img{width:100%;height:150px;object-fit:cover;background:rgba(123,47,190,.2)}
.bac-body{padding:1rem}
.bac-date{font-size:.75rem;color:var(--muted);margin-bottom:.3rem}
.bac-title{font-size:.95rem;font-weight:700;margin-bottom:.7rem}
.btn-del-blog{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;padding:.35rem .7rem;border-radius:6px;font-size:.78rem;cursor:pointer;transition:.3s;font-family:inherit}
.btn-del-blog:hover{background:rgba(239,68,68,.2)}

/* MODAL */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;align-items:center;justify-content:center;padding:1rem}
.modal-bg.show{display:flex}
.modal{background:var(--card);border:1px solid var(--border);border-radius:20px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:2rem}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
.modal-header h3{font-size:1.1rem;font-weight:700}
.close-modal{background:none;border:none;color:var(--muted);font-size:1.3rem;cursor:pointer}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
.dg-item label{font-size:.75rem;color:var(--muted);font-weight:600;display:block;margin-bottom:.2rem}
.dg-item p{font-size:.9rem;font-weight:500}
.msg-box{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:.8rem;font-size:.85rem;color:var(--muted);margin-bottom:1rem;white-space:pre-wrap}
.modal-actions{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.2rem}
.btn-wa{background:#25D366;color:#fff;border:none;padding:.55rem 1.1rem;border-radius:50px;font-size:.85rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.4rem}
.btn-call{background:rgba(0,210,255,.15);color:var(--accent);border:1px solid rgba(0,210,255,.3);padding:.53rem 1.1rem;border-radius:50px;font-size:.85rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.4rem}
.btn-save{background:var(--grad1);color:#fff;border:none;padding:.55rem 1.3rem;border-radius:50px;font-size:.85rem;font-weight:700;cursor:pointer;margin-left:auto}

/* CHANGE PW */
.pw-form{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.8rem;max-width:420px}
.pw-msg{margin-top:.8rem;padding:.6rem 1rem;border-radius:8px;font-size:.85rem;display:none}

/* RESPONSIVE */
@media(max-width:768px){
  .sidebar{transform:translateX(-100%)}
  .sidebar.open{transform:translateX(0)}
  .main-content{margin-left:0}
  .ham-admin{display:block}
  .detail-grid{grid-template-columns:1fr}
}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="loginPage">
  <div class="login-box">
    <div class="login-brand">Abhimanyu Dwivedi</div>
    <p class="login-sub">Admin Panel — Sign In</p>
    <div class="lf-group"><label>Username</label><input type="text" id="lu" placeholder="Username" onkeydown="if(event.key==='Enter')doLogin()"/></div>
    <div class="lf-group"><label>Password</label><input type="password" id="lp" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()"/></div>
    <button class="btn-login" onclick="doLogin()">Sign In</button>
    <div class="login-err" id="loginErr">Invalid username or password</div>
    <p class="login-back"><a href="/">← Back to main site</a></p>
  </div>
</div>

<!-- ADMIN APP -->
<div id="adminApp">
  <div class="overlay" id="overlay" onclick="closeSidebar()"></div>
  <div class="sidebar" id="sidebar">
    <div class="sb-brand">Abhimanyu</div>
    <nav class="sb-nav">
      <a class="sb-link active" onclick="showPage('dashboard',this)">📊 Dashboard</a>
      <a class="sb-link" onclick="showPage('inquiries',this)">📩 Inquiries <span class="sb-badge" id="newBadge" style="display:none">0</span></a>
      <a class="sb-link" onclick="showPage('blog',this)">✍️ Blog / Vlogs</a>
      <a class="sb-link" onclick="showPage('password',this)">🔑 Password</a>
    </nav>
    <div class="sb-bottom">
      <a href="/" class="sb-site">🌐 View Site</a>
      <button class="sb-logout" onclick="logout()">🚪 Logout</button>
    </div>
  </div>

  <div class="main-content">
    <div class="topbar">
      <button class="ham-admin" onclick="openSidebar()">☰</button>
      <h1 id="pageTitle">Dashboard</h1>
    </div>

    <!-- DASHBOARD -->
    <div class="page active" id="page-dashboard">
      <div class="stats-grid" id="dashStats"></div>
      <h3 style="margin-bottom:1rem;font-size:1rem">Recent Leads</h3>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Service</th><th>Status</th><th>Date</th></tr></thead><tbody id="recentTbl"></tbody></table></div>
    </div>

    <!-- INQUIRIES -->
    <div class="page" id="page-inquiries">
      <div class="filter-tabs" id="filterTabs">
        <button class="ftab active" data-s="">All</button>
        <button class="ftab" data-s="New">New</button>
        <button class="ftab" data-s="Contacted">Contacted</button>
        <button class="ftab" data-s="Converted">Converted</button>
        <button class="ftab" data-s="Closed">Closed</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Service</th><th>Budget</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody id="inqTbl"></tbody></table></div>
    </div>

    <!-- BLOG -->
    <div class="page" id="page-blog">
      <div class="form-section">
        <h3>✍️ Write New Post</h3>
        <div class="fg"><label>Title *</label><input type="text" id="bTitle" placeholder="Post title"/></div>
        <div class="fg"><label>Cover Image URL</label><input type="text" id="bImg" placeholder="https://..."/></div>
        <div class="fg"><label>Tag</label><input type="text" id="bTag" placeholder="e.g. Marketing, Web Dev"/></div>
        <div class="fg"><label>Content *</label><textarea id="bContent" placeholder="Write your post here..."></textarea></div>
        <button class="btn-pub" onclick="publishPost()">Publish Post</button>
        <div class="pub-msg" id="pubMsg"></div>
      </div>
      <div class="blog-admin-grid" id="blogAdminGrid"></div>
    </div>

    <!-- PASSWORD -->
    <div class="page" id="page-password">
      <div class="pw-form">
        <h3 style="margin-bottom:1.2rem;font-size:1rem">🔑 Change Password</h3>
        <div class="fg"><label>Current Password</label><input type="password" id="pwCur" placeholder="Current password"/></div>
        <div class="fg"><label>New Password</label><input type="password" id="pwNew" placeholder="New password"/></div>
        <div class="fg"><label>Confirm New Password</label><input type="password" id="pwCon" placeholder="Confirm new password"/></div>
        <button class="btn-pub" onclick="changePassword()">Update Password</button>
        <div class="pw-msg" id="pwMsg"></div>
      </div>
    </div>
  </div>
</div>

<!-- INQUIRY MODAL -->
<div class="modal-bg" id="inqModal">
  <div class="modal">
    <div class="modal-header">
      <h3>Inquiry Details</h3>
      <button class="close-modal" onclick="closeModal()">✕</button>
    </div>
    <div class="detail-grid" id="detailGrid"></div>
    <div class="msg-box" id="detailMsg"></div>
    <div class="fg"><label>Status</label><select id="detailStatus"><option>New</option><option>Contacted</option><option>Converted</option><option>Closed</option></select></div>
    <div class="fg"><label>Notes</label><textarea id="detailNotes" placeholder="Add your notes..."></textarea></div>
    <div class="modal-actions">
      <a href="#" class="btn-wa" id="detailWa">💬 WhatsApp</a>
      <a href="#" class="btn-call" id="detailCall">📞 Call</a>
      <button class="btn-save" onclick="saveInquiry()">Save & Close</button>
    </div>
  </div>
</div>

<script>
var TOKEN = localStorage.getItem('abhi_token');
var currentInqId = null;
var currentFilter = '';

function authHeaders() { return { 'Content-Type':'application/json', 'Authorization':'Bearer '+TOKEN }; }

async function doLogin() {
  var u=document.getElementById('lu').value.trim(), p=document.getElementById('lp').value;
  if(!u||!p) return;
  var err = document.getElementById('loginErr');
  err.style.display='none';
  try {
    var res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    var data = await res.json();
    if(res.ok && data.token) {
      TOKEN = data.token; localStorage.setItem('abhi_token', TOKEN);
      document.getElementById('loginPage').style.display='none';
      document.getElementById('adminApp').style.display='block';
      loadDashboard();loadInquiries();loadBlogAdmin();
    } else { err.style.display='block'; }
  } catch(e) { err.style.display='block'; }
}

function logout() { localStorage.removeItem('abhi_token'); location.reload(); }

function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }

function showPage(id, el) {
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.sb-link').forEach(function(l){l.classList.remove('active')});
  if(el) el.classList.add('active');
  var titles = {dashboard:'Dashboard',inquiries:'Inquiries',blog:'Blog / Vlogs',password:'Change Password'};
  document.getElementById('pageTitle').textContent = titles[id]||'';
  if(id==='inquiries') loadInquiries();
  if(id==='blog') loadBlogAdmin();
  closeSidebar();
}

/* DASHBOARD */
async function loadDashboard() {
  try {
    var res = await fetch('/api/inquiries',{headers:authHeaders()});
    if(res.status===401){logout();return;}
    var list = await res.json();
    var total=list.length, nw=list.filter(i=>i.status==='New').length,
        ct=list.filter(i=>i.status==='Contacted').length, cv=list.filter(i=>i.status==='Converted').length;
    document.getElementById('dashStats').innerHTML =
      card('Total Leads',total)+card('New Leads',nw)+card('Contacted',ct)+card('Converted',cv);
    var recent = list.slice(0,5);
    document.getElementById('recentTbl').innerHTML = recent.map(function(i){
      return '<tr><td>'+i.fullName+'</td><td>'+i.phone+'</td><td>'+i.service+'</td><td><span class="status-badge s-'+i.status+'">'+i.status+'</span></td><td>'+fmtDate(i.createdAt)+'</td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:1.5rem">No leads yet</td></tr>';
    if(nw>0){ document.getElementById('newBadge').textContent=nw; document.getElementById('newBadge').style.display=''; }
    else document.getElementById('newBadge').style.display='none';
  } catch(e){}
}
function card(l,v){return '<div class="stat-card"><h4>'+l+'</h4><div class="val">'+v+'</div></div>';}

/* INQUIRIES */
document.getElementById('filterTabs').addEventListener('click',function(e){
  var tab=e.target.closest('.ftab'); if(!tab) return;
  document.querySelectorAll('.ftab').forEach(function(t){t.classList.remove('active')});
  tab.classList.add('active');
  currentFilter=tab.dataset.s;
  loadInquiries();
});

async function loadInquiries() {
  var url='/api/inquiries'+(currentFilter?'?status='+currentFilter:'');
  try {
    var res=await fetch(url,{headers:authHeaders()});
    if(res.status===401){logout();return;}
    var list=await res.json();
    document.getElementById('inqTbl').innerHTML = list.map(function(i,idx){
      return '<tr><td>'+(idx+1)+'</td><td>'+i.fullName+'</td><td>'+i.phone+'</td><td>'+i.service+'</td><td>'+(i.budget||'—')+'</td>'
        +'<td><span class="status-badge s-'+i.status+'">'+i.status+'</span></td>'
        +'<td>'+fmtDate(i.createdAt)+'</td>'
        +'<td><button class="action-btn" onclick="viewInq('+i.id+')">👁</button> <button class="action-btn del" onclick="delInq('+i.id+')">🗑</button></td></tr>';
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:1.5rem">No inquiries</td></tr>';
  } catch(e){}
}

var inqCache = {};
async function viewInq(id) {
  var res=await fetch('/api/inquiries',{headers:authHeaders()});
  var list=await res.json();
  var i=list.find(function(x){return x.id===id});
  if(!i) return;
  currentInqId=id;
  document.getElementById('detailGrid').innerHTML =
    dg('Name',i.fullName)+dg('Phone',i.phone)+dg('Service',i.service)+dg('Budget',i.budget||'—')+dg('Email',i.email||'—')+dg('Date',fmtDate(i.createdAt));
  document.getElementById('detailMsg').textContent=i.message||'';
  document.getElementById('detailStatus').value=i.status;
  document.getElementById('detailNotes').value=i.notes||'';
  document.getElementById('detailWa').href='https://wa.me/91'+i.phone.replace(/\D/g,'');
  document.getElementById('detailCall').href='tel:'+i.phone;
  document.getElementById('inqModal').classList.add('show');
}
function dg(l,v){return '<div class="dg-item"><label>'+l+'</label><p>'+v+'</p></div>';}
function closeModal(){document.getElementById('inqModal').classList.remove('show');currentInqId=null;}

async function saveInquiry() {
  if(!currentInqId) return;
  var status=document.getElementById('detailStatus').value;
  var notes=document.getElementById('detailNotes').value;
  await fetch('/api/inquiries/'+currentInqId,{method:'PUT',headers:authHeaders(),body:JSON.stringify({status,notes})});
  closeModal(); loadInquiries(); loadDashboard();
}

async function delInq(id) {
  if(!confirm('Delete this inquiry?')) return;
  await fetch('/api/inquiries/'+id,{method:'DELETE',headers:authHeaders()});
  loadInquiries(); loadDashboard();
}

/* BLOG */
async function loadBlogAdmin() {
  var res=await fetch('/api/blogs');
  var list=await res.json();
  var grid=document.getElementById('blogAdminGrid');
  if(!list.length){grid.innerHTML='<p style="color:var(--muted);font-size:.85rem">No posts published yet.</p>';return;}
  grid.innerHTML=list.map(function(b){
    var img=b.coverImage?'<img class="bac-img" src="'+b.coverImage+'" onerror="this.style.display=\'none\'">':'';
    return '<div class="bac">'+img+'<div class="bac-body"><div class="bac-date">'+fmtDate(b.createdAt)+'</div><div class="bac-title">'+b.title+'</div><button class="btn-del-blog" onclick="delBlog('+b.id+')">🗑 Delete</button></div></div>';
  }).join('');
}

async function publishPost() {
  var title=document.getElementById('bTitle').value.trim();
  var coverImage=document.getElementById('bImg').value.trim();
  var tag=document.getElementById('bTag').value.trim();
  var content=document.getElementById('bContent').value.trim();
  var msg=document.getElementById('pubMsg');
  msg.style.display='none';
  if(!title||!content){msg.textContent='⚠️ Title and content are required.';msg.style.cssText='display:block;color:#fca5a5';return;}
  var res=await fetch('/api/blogs',{method:'POST',headers:authHeaders(),body:JSON.stringify({title,coverImage,tag,content})});
  if(res.ok){
    msg.textContent='✅ Post published!';msg.style.cssText='display:block;color:#86efac';
    document.getElementById('bTitle').value='';document.getElementById('bImg').value='';
    document.getElementById('bTag').value='';document.getElementById('bContent').value='';
    loadBlogAdmin();
  } else { msg.textContent='❌ Failed to publish.';msg.style.cssText='display:block;color:#fca5a5'; }
}

async function delBlog(id) {
  if(!confirm('Delete this post?')) return;
  await fetch('/api/blogs/'+id,{method:'DELETE',headers:authHeaders()});
  loadBlogAdmin();
}

/* PASSWORD */
async function changePassword() {
  var cur=document.getElementById('pwCur').value;
  var nw=document.getElementById('pwNew').value;
  var cn=document.getElementById('pwCon').value;
  var msg=document.getElementById('pwMsg');
  msg.style.display='none';
  if(!cur||!nw||!cn){msg.textContent='⚠️ All fields required.';msg.style.cssText='display:block;color:#fca5a5';return;}
  if(nw!==cn){msg.textContent='⚠️ New passwords do not match.';msg.style.cssText='display:block;color:#fca5a5';return;}
  var res=await fetch('/api/auth/change-password',{method:'PUT',headers:authHeaders(),body:JSON.stringify({currentPassword:cur,newPassword:nw})});
  if(res.ok){
    msg.textContent='✅ Password updated successfully!';msg.style.cssText='display:block;color:#86efac';
    document.getElementById('pwCur').value='';document.getElementById('pwNew').value='';document.getElementById('pwCon').value='';
  } else {
    var d=await res.json();
    msg.textContent='❌ '+(d.error||'Failed');msg.style.cssText='display:block;color:#fca5a5';
  }
}

/* UTILS */
function fmtDate(s){return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}

/* Init */
async function init() {
  if(!TOKEN){return;}
  var res=await fetch('/api/auth/verify',{headers:authHeaders()});
  if(!res.ok){localStorage.removeItem('abhi_token');return;}
  document.getElementById('loginPage').style.display='none';
  document.getElementById('adminApp').style.display='block';
  loadDashboard();loadBlogAdmin();
}
init();
</script>
</body>
</html>`;

/* ═══════════════════════════════════════
   SERVE HTML ROUTES
═══════════════════════════════════════ */
app.get('/', (_, res) => res.send(mainHTML));
app.get('/admin', (_, res) => res.send(adminHTML));

/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`✅ Abhimanyu Dwivedi Portfolio running on http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin`);
});
