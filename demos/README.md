# Restaurant demos

Three demo sites for Neukölln restaurants, built to show an owner on a call: "this is what yours
would look like". Every business here is invented. Names, addresses, phone numbers, emails and
menus are placeholders, and there are no photos of any real place (the hero art is inline SVG).

| Folder | Kind | Main action | Feel |
| --- | --- | --- | --- |
| `trattoria-esempio/` | Italian, evenings | Book a table (date, time slot, party size, sent via WhatsApp) and call | Dark, warm, serif |
| `pho-beispiel/` | Vietnamese, lunch rush | Call and collect, order by dish number | Bright, bold, system fonts |
| `cafe-muster/` | Austrian cafe, breakfast and cake | Call for a table, pre-order a whole cake on WhatsApp | Cream and bordeaux, serif |

Each one has: German first with an EN toggle (remembered in the browser, or force it with
`?lang=en`), menu, opening hours with a live "open now" pill computed in Berlin time, a map
placeholder, call and WhatsApp buttons, a sticky action bar on phones, and Impressum and
Datenschutz stubs marked as placeholders.

## How they are built

Each folder stands alone: plain HTML, one `site.css`, a small inline script (about 6 kB, no
libraries), and for the two serif designs the Instrument Serif font files (SIL OFL). No external
requests at all: no Google Fonts, no image CDN, no map until one is added.

- Open `index.html` straight from disk, or drag the folder onto Netlify Drop. No build needed.
- `npm run build` at the repo root also builds them (see `vite.config.js`), so a Netlify deploy
  of this repo serves them at `/demos/trattoria-esempio/`, `/demos/pho-beispiel/` and
  `/demos/cafe-muster/`.
- Without JavaScript the page still works in German with static hours. The script only adds the
  language toggle, the open/closed pill, today's row in the hours table and the booking message.

## Swap in a real business (about 15 minutes)

Do this in a private copy, never in this public repo.

```bash
cp -r demos/trattoria-esempio ../clients/real-restaurant
```

**1. Find and replace (5 min).** Run each replacement across the three HTML files in the copy
(`index.html`, `impressum.html`, `datenschutz.html`). Your editor's "replace in folder" does it.

| Placeholder | Replace with | Where it shows |
| --- | --- | --- |
| `Trattoria Esempio` / `Pho Beispiel` / `Cafe Muster` | Real name | Title, footer, address, legal pages |
| `Trattoria <em>Esempio</em>`, `Pho <span>Beispiel</span>`, `Cafe <em>Muster</em>` | Real name, split the same way | Header wordmark, footer mark |
| `Trattoria<br /><em>Esempio</em>` (and the Cafe one) | Real name | Big hero heading |
| `data-title-en="..."` on `<html>` | English page title | Tab title in EN mode |
| `Beispielstraße 12` / `Musterweg 3` / `Platzhalterallee 7` | Street and number | Address block, legal pages |
| `12043` / `12045` / `12047` | Postcode | Address block, legal pages |
| `030 0000 0000` | Phone as people read it | Contact list, call note |
| `+493000000000` | Phone for `tel:` links, digits only after `+49` | Every call button |
| `4915200000000` | WhatsApp number, country code, no `+` or spaces | `data-wa`, `data-booking`, `wa.me` links, form action |
| `...@...example` email | Real email | Contact list, legal pages |
| `Vorname Nachname (Platzhalter)` | Owner's name | Impressum, Datenschutz |
| `DE000000000 (Platzhalter)` | USt-IdNr., or delete the whole Umsatzsteuer block for a Kleinunternehmer | Impressum |

Then delete every ` <span lang="de">(Platzhalter)</span><span lang="en">(placeholder)</span>`
after the street.

**2. Hours (2 min).** In `index.html`, each `<tr data-day="...">` in the hours table is one day,
with `data-day` as `0` Sunday, `1` Monday up to `6` Saturday. Change `data-open` and
`data-close` (24 h, like `17:30`) and the visible times in the same row. A closed day has no
`data-open` or `data-close` and says `Ruhetag`. The pill and "today" highlight read these
attributes, so there is nothing to change in the script. Fix the headline above the table
("Montag Ruhetag", "Jeden Tag geöffnet.") and the note under it to match.

**3. Menu (5 min).** Each dish is one `<li>` in a `<ul class="menu-list">`: name, then a German
and an English description, then the price. Copy a `<li>`, edit, delete the rest. Group
headings are the `<h3>` above each list. Tags: `<span class="tag">veg</span>` (Pho also has
`tag-veg` and `tag-hot`). Pho's dish numbers are `<span class="no">10</span>`.

**4. Remove the demo markers (2 min).**

- `index.html`: delete the `<p class="demo-note">` at the top, the "Demo mit erfundenem Betrieb"
  line in the footer, `<meta name="robots" content="noindex" />`, and the
  `<figcaption class="art-label">` ("Platz für euer Foto").
- `impressum.html` and `datenschutz.html`: delete the `<p class="placeholder">` banner and the
  `<meta name="robots">` line. The `<mark>` tags only underline the swapped fields; remove them
  or leave them, then delete the `mark { ... }` style rule.

**5. Optional, if there is time.**

- Photo: replace the `<svg>` inside `<figure class="hero-art">` with the owner's own photo,
  saved next to `index.html`:
  `<img src="hero.jpg" alt="..." width="1200" height="960" fetchpriority="high" />`. Use their
  photo, never one from Google Maps or a review site.
- Colours: the `:root` block at the top of `site.css` holds every colour of the design.
- Map: either replace the `<div class="map-placeholder">` with a plain link (no data leaves the
  page until someone taps it):
  `<a class="btn btn-ghost" href="https://www.openstreetmap.org/?mlat=52.48&mlon=13.43#map=17/52.48/13.43">Karte öffnen</a>`,
  or copy the click-to-load OpenStreetMap block from the main template (`index.html` `.map`
  and `src/main.js` section 7). Either way, rewrite the "Karte" paragraph in
  `datenschutz.html`; the main template's `public/datenschutz.html` has the OSM wording.
- Booking slots (Trattoria): the time chips are the `<label class="chip">` lines in the form.

**6. Check before sending the link (1 min).** From inside the copy:

```bash
grep -rnE "Platzhalter|placeholder|0000 0000|4915200000000|493000000000|\.example|Esempio|Beispiel|Muster" --include=*.html .
```

```bash
python3 -c "import pathlib,sys; bad=[str(p) for p in pathlib.Path('.').rglob('*.html') if any(c in p.read_text() for c in (chr(0x2013), chr(0x2014)))]; print(bad or 'no dashes'); sys.exit(bool(bad))"
```

The first one should print nothing; the class names `map-placeholder` and `placeholder` only
remain if you skipped step 4 or 5. Then open the page on a phone, tap Call and WhatsApp once,
and toggle EN.

The legal pages are a starting text, not legal advice. The owner checks them before going live.
