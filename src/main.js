/* Kiez Café demo: progressive enhancement only.
   Everything below adds motion or live data. The page reads fine without it. */

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
  .map((href) => doc.querySelector(href))
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
  if (img.complete && img.naturalWidth > 0) {
    ok();
  } else {
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', fail, { once: true });
  }
});

/* 7. Map fades in once the embed has painted ------------------------ */

const map = doc.querySelector('[data-map]');
if (map) {
  const frame = map.querySelector('iframe');
  const show = () => map.classList.add('is-loaded');
  frame?.addEventListener('load', show, { once: true });
  setTimeout(show, reduceMotion ? 0 : 4000);
}

/* 8. Footer year ---------------------------------------------------- */

const year = doc.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* 9. WhatsApp pre-order links ------------------------------------- */

/* One number per client. The demo uses a placeholder; the real number goes here. */
const WHATSAPP_NUMBER = '491700000000';

doc.querySelectorAll('[data-wa]').forEach((a) => {
  const text = encodeURIComponent(a.dataset.wa);
  a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  a.target = '_blank';
  a.rel = 'noopener';
});

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
  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;
  if (!dateInput.value) dateInput.value = today;
}
