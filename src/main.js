/* Kiez Café demo: progressive enhancement only.
   Everything below adds motion or live data. The page reads fine without it. */

window.__kiez = 1; /* the 4 s no-JS fallback in index.html checks this */
const doc = document;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1. Reveal on scroll ------------------------------------------------ */

const revealEls = doc.querySelectorAll('[data-reveal], [data-clip]');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

/* 2. Header border once the page has scrolled ----------------------- */

const header = doc.querySelector('[data-header]');
const sentinel = doc.querySelector('.nav-sentinel');

if (header && sentinel && 'IntersectionObserver' in window) {
  new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting),
    { threshold: 0 },
  ).observe(sentinel);
}

/* 3. Scrollspy: the section under the reading line owns its nav link */

const navLinks = [...doc.querySelectorAll('.nav a, .mobile-menu a')];
const spied = [...new Set(navLinks.map((a) => a.getAttribute('href')))]
  .map((href) => (href && href.length > 1 ? doc.querySelector(href) : null))
  .filter(Boolean);

if (spied.length && 'IntersectionObserver' in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        for (const a of navLinks) {
          if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );
  spied.forEach((section) => spy.observe(section));
}

/* 4. Mobile menu ---------------------------------------------------- */

const menuButton = doc.querySelector('[data-menu-button]');
const menuLabel = doc.querySelector('[data-menu-label]');
const menuPanel = doc.querySelector('[data-mobile-menu]');
let menuOpen = false;

function setMenu(open, { instant = false } = {}) {
  if (!menuPanel || !menuButton) return;
  menuOpen = open;
  menuButton.setAttribute('aria-expanded', String(open));
  if (menuLabel) menuLabel.textContent = open ? 'Schließen' : 'Menü';
  if (instant) {
    menuPanel.setAttribute('data-instant', '');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => menuPanel.removeAttribute('data-instant')),
    );
  }
  menuPanel.setAttribute('data-open', String(open));
}

if (menuPanel && menuButton) {
  menuPanel.hidden = false; /* visibility is handled in CSS from here on */
  menuButton.addEventListener('click', () => setMenu(!menuOpen));
  menuPanel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  doc.addEventListener('keydown', (e) => {
    /* keyboard actions never animate */
    if (e.key === 'Escape' && menuOpen) setMenu(false, { instant: true });
  });
  doc.addEventListener('pointerdown', (e) => {
    if (menuOpen && !header.contains(e.target)) setMenu(false);
  });
}

/* 5. Opening hours, computed in Europe/Berlin ----------------------- */

/* [open, close] as [hour, minute]; null means closed. Index is JS weekday. */
const HOURS = {
  0: [[8, 30], [16, 0]],
  1: null,
  2: [[7, 30], [18, 0]],
  3: [[7, 30], [18, 0]],
  4: [[7, 30], [18, 0]],
  5: [[7, 30], [18, 0]],
  6: [[8, 30], [17, 0]],
};
const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function berlinNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const day = DAY_SHORT.indexOf(get('weekday'));
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return { day: day < 0 ? new Date().getDay() : day, minutes: hour * 60 + minute };
}

const toMinutes = ([h, m]) => h * 60 + m;
const fmt = ([h, m]) => `${h}:${String(m).padStart(2, '0')}`;

function openingStatus() {
  const { day, minutes } = berlinNow();
  const today = HOURS[day];

  if (today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1])) {
    return { day, open: true, text: `Geöffnet bis ${fmt(today[1])}`, short: 'Offen' };
  }
  if (today && minutes < toMinutes(today[0])) {
    return { day, open: false, text: `Öffnet um ${fmt(today[0])}`, short: 'Zu' };
  }
  for (let i = 1; i <= 7; i++) {
    const next = (day + i) % 7;
    if (!HOURS[next]) continue;
    const when = i === 1 ? 'morgen' : DAY_NAMES[next];
    return { day, open: false, text: `Öffnet ${when} um ${fmt(HOURS[next][0])}`, short: 'Zu' };
  }
  return { day, open: false, text: 'Geschlossen', short: 'Zu' };
}

try {
  const status = openingStatus();

  const pill = doc.querySelector('[data-status]');
  if (pill) {
    pill.dataset.open = String(status.open);
    pill.querySelector('.status-text').textContent = status.text;
    pill.querySelector('.status-short').textContent = status.short;
    pill.hidden = false;
    requestAnimationFrame(() => pill.classList.add('is-ready'));
  }

  const row = doc.querySelector(`[data-hours] [data-day="${status.day}"]`);
  if (row) row.classList.add('is-today');

  const summary = doc.querySelector('[data-hours-summary]');
  if (summary) {
    const today = HOURS[status.day];
    summary.previousElementSibling.textContent = 'Heute';
    summary.textContent = today ? `${fmt(today[0])} bis ${fmt(today[1])}` : 'Geschlossen';
  }
} catch {
  /* leave the static markup as it is */
}

/* 6. Photos: keep the designed tile if an image never arrives ------- */

doc.querySelectorAll('[data-photo]').forEach((figure) => {
  const img = figure.querySelector('img');
  if (!img) return;
  const ok = () => figure.classList.add('has-img');
  const fail = () => img.remove();
  if (img.complete) {
    img.naturalWidth > 0 ? ok() : fail();
  } else {
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', fail, { once: true });
  }
});

/* 7. Map loads only after a click (no request to OpenStreetMap before) */

const map = doc.querySelector('[data-map]');
const mapLoad = map?.querySelector('[data-map-load]');
if (map && mapLoad) {
  const frame = map.querySelector('iframe');
  mapLoad.addEventListener('click', (e) => {
    e.preventDefault();
    const show = () => map.classList.add('is-loaded');
    frame.addEventListener('load', show, { once: true });
    setTimeout(show, reduceMotion ? 0 : 4000);
    frame.src = frame.dataset.src;
    mapLoad.hidden = true;
  });
}

/* 8. Footer year ---------------------------------------------------- */

const year = doc.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* 10. Sticky bar hides while the hero is on screen ------------------ */

const sticky = doc.querySelector('[data-sticky]');
const hero = doc.querySelector('.hero');
if (sticky && hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(
    ([entry]) => sticky.classList.toggle('is-visible', !entry.isIntersecting),
    { threshold: 0.2 },
  ).observe(hero);
}

/* 11. Reservation form: date defaults to today, min today ----------- */

const dateInput = doc.querySelector('.reserve-form input[type="date"]');
if (dateInput) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  dateInput.min = today;
  if (!dateInput.value) dateInput.value = today;
}

/* 12. Motion: smooth scroll (Lenis) and springs (Motion) ----------- */
/* Both off under prefers-reduced-motion; the CSS reveals above still run reduced. */

import Lenis from 'lenis';
import { animate, inView, scroll, spring } from 'motion';

if (!reduceMotion && 'IntersectionObserver' in window) {
  /* Smooth scroll, with anchor links routed through it so the header offset is kept. */
  const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  doc.querySelectorAll('a[href^="#"]').forEach((a) => {
    const target = a.getAttribute('href');
    if (target === '#' || !doc.querySelector(target)) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72, duration: 1.1, easing: (x) => 1 - Math.pow(1 - x, 4) });
      history.replaceState(null, '', target);
      if (target === '#main') doc.querySelector(target).focus({ preventScroll: true });
    });
  });

  /* Load: hero copy settles in with a spring, one element after the other. */
  const heroBits = [...doc.querySelectorAll('.hero-copy [data-reveal]')];
  heroBits.forEach((el) => el.classList.add('is-in', 'motion-owned'));
  animate(
    heroBits,
    { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] },
    { delay: (i) => 0.08 + i * 0.07, type: spring, duration: 0.7, bounce: 0.18 },
  );

  /* Hero photo: a touch of parallax while it scrolls off, transform only. */
  const heroPhoto = doc.querySelector('.hero-photo img');
  if (heroPhoto) {
    scroll(animate(heroPhoto, { transform: ['translateY(0px)', 'translateY(60px)'] }, { ease: 'linear' }),
           { target: doc.querySelector('.hero'), offset: ['start start', 'end start'] });
  }

  /* Order cards: stagger in once, then spring on press and release. */
  doc.querySelectorAll('.order-card').forEach((c) => (c.style.opacity = '0'));
  inView('.order-grid', ({ target }) => {
    animate(
      target.querySelectorAll('.order-card'),
      { opacity: [0, 1], transform: ['translateY(16px) scale(0.98)', 'translateY(0px) scale(1)'] },
      { delay: (i) => i * 0.08, type: spring, duration: 0.6, bounce: 0.2 },
    );
  }, { amount: 0.3 });

  const press = (el) => {
    const down = () => animate(el, { transform: 'scale(0.97)' }, { duration: 0.1 });
    const up = () => animate(el, { transform: 'scale(1)' }, { type: spring, duration: 0.4, bounce: 0.3 });
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  };
  doc.querySelectorAll('.order-card, .button').forEach(press);

  /* Sticky bar: spring in and out instead of the CSS slide. */
  if (sticky && hero) {
    sticky.classList.add('motion-owned');
    let shown = false;
    new IntersectionObserver(([entry]) => {
      const next = !entry.isIntersecting;
      if (next === shown) return;
      shown = next;
      animate(sticky, { transform: next ? 'translateY(0%)' : 'translateY(110%)' },
              { type: spring, duration: next ? 0.55 : 0.35, bounce: next ? 0.22 : 0 });
    }, { threshold: 0.2 }).observe(hero);
  }

  /* Status pill: pops in once the hours are known. */
  const pillEl = doc.querySelector('[data-status]');
  if (pillEl && !pillEl.hidden) {
    animate(pillEl, { opacity: [0, 1], transform: ['scale(0.92)', 'scale(1)'] }, { type: spring, duration: 0.5, bounce: 0.25, delay: 0.4 });
  }
}
