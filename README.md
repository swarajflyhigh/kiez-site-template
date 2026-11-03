# Kiez Café demo

A one-page café website for Neukölln, built to show shop owners on a phone. German, no framework,
Vite build, deploys to Netlify.

What it shows: WhatsApp pre-order buttons with the message pre-written, a table reservation form
(Netlify Forms, no backend), a live open/closed pill, the menu, hours and map.

Per client: `python3 new_client.py client.json` (`--example` prints the fields). It writes the
WhatsApp number into the `wa.me` links in the markup (they work without JavaScript), the hours,
address, menu, and the Impressum and Datenschutz pages (`public/`, linked from every footer).
Fonts are self-hosted from `public/fonts/` (SIL OFL, licence files next to them); nothing loads
from Google. Images are Unsplash hotlinks for the demo only; use the shop's own photos, self-hosted,
for a real site (the generator warns while any are left). The legal pages are a starting text, not
legal advice: the owner checks them before going live.

```
npm install
npm run dev
npm run build
```

Built as a reusable template: swap name, hours, menu, photos and the WhatsApp number per shop.

## Restaurant demos

`demos/` holds three standalone restaurant demos with invented businesses (Italian, Vietnamese,
Austrian cafe), German first with an English toggle, no libraries. `npm run build` includes them
under `/demos/<slug>/`. How to swap in a real business: `demos/README.md`.
