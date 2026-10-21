# Kiez Café demo

A one-page café website for Neukölln, built to show shop owners on a phone. German, no framework,
Vite build, deploys to Netlify.

What it shows: WhatsApp pre-order buttons with the message pre-written, a table reservation form
(Netlify Forms, no backend), a live open/closed pill, the menu, hours and map.

Per client: change `WHATSAPP_NUMBER` in `src/main.js`, the hours table in `src/main.js` and
`index.html` (keep both in sync), the address, menu and photos. Images are Unsplash hotlinks for
the demo only; use the shop's own photos for a real site.

```
npm install
npm run dev
npm run build
```

Based on the croissanterie template.
