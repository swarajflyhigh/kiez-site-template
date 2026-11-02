"""
Turn the café or salon demo into a real shop's site in one step.

    python3 new_client.py client.json            # writes ../clients/<slug>/, ready to `npm run build`
    python3 new_client.py --example > client.json

The template is this folder (café) or ../kiez-salon (salon), chosen by "type" in client.json.
Only text is replaced; layout, motion and the forms stay as they are. Stdlib only.
"""

import json
import re
import shutil
import sys
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATES = {"cafe": HERE, "salon": HERE.parent / "kiez-salon"}
OUT_ROOT = HERE.parent / "clients"
SKIP = {"node_modules", "dist", ".git", ".netlify", ".claude"}
DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]          # JS weekday order
DAY_DE = {"sun": "So", "mon": "Mo", "tue": "Di", "wed": "Mi", "thu": "Do", "fri": "Fr", "sat": "Sa"}

EXAMPLE = {
    "type": "cafe",
    "name": "Café Beispiel",
    "district": "Neukölln",
    "street": "Weserstraße 50",
    "postcode": "12045",
    "lat": 52.4872, "lon": 13.4295,
    "whatsapp": "4915112345678",
    "email": "hallo@cafe-beispiel.de",
    "owner": "Vorname Nachname",
    "phone": "030 1234567",
    "vat": "",
    "instagram": "cafebeispiel",
    "tagline": "Guter Kaffee, frische Kuchen, und <em>kein Anruf nötig</em>.",
    "lede": "Vorbestellen per WhatsApp, Tisch reservieren mit zwei Fingertipps, und immer sehen, ob wir gerade offen haben.",
    "about": ["Ein paar Sätze über den Laden, seit wann es ihn gibt und was ihn besonders macht."],
    "hours": {"mon": None, "tue": ["8:00", "18:00"], "wed": ["8:00", "18:00"], "thu": ["8:00", "18:00"],
              "fri": ["8:00", "18:00"], "sat": ["9:00", "17:00"], "sun": ["9:00", "16:00"]},
    "menu": [
        {"group": "Gebäck", "items": [["Croissant", "Jeden Morgen frisch.", "2,50 €"]]},
        {"group": "Kuchen", "items": [["Käsekuchen", "Nach Hausrezept.", "4,00 €"]]},
        {"group": "Kaffee", "items": [["Cappuccino", "Hafermilch ohne Aufpreis.", "3,40 €"]]},
    ],
}


def slug(name: str) -> str:
    s = name.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss").replace("é", "e")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def hm(t: str) -> tuple[int, int]:
    h, m = t.split(":")
    return int(h), int(m)


def hours_summary(hours: dict) -> str:
    open_days = [d for d in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] if hours.get(d)]
    return f"{DAY_DE[open_days[0]]} bis {DAY_DE[open_days[-1]]}" if open_days else "Nach Vereinbarung"


def render(html: str, js: str, c: dict, brand: str, old_street: str) -> tuple[str, str]:
    name, street, pc, district = c["name"], c["street"], c["postcode"], c.get("district", "Neukölln")
    street_name = re.sub(r"\s*\d.*$", "", street)
    # names and demo markers
    html = html.replace(f"{brand}, Neukölln (Demo)", f"{name}, {district}")
    html = html.replace(f"{brand} (Demo)", name).replace(brand, name)
    html = re.sub(r"\S+, Neukölln · Demo", f"{street_name}, {district}", html)
    html = html.replace(" So könnte eure Website aussehen.", "")
    html = html.replace(f"<em>{old_street}</em>", f"<em>{street_name}</em>")
    # address block, map link, map embed, footer
    html = re.sub(r"(<address>\s*).*?<br />\s*.*?<br />\s*.*?(\s*</address>)",
                  lambda m: f"{m.group(1)}{name}<br />\n                  {street}<br />\n                  {pc} Berlin, {district}{m.group(2)}",
                  html, count=1, flags=re.S)
    html = re.sub(r"query=[^\"&]+", "query=" + urllib.parse.quote(f"{street}, {pc} Berlin"), html)
    html = re.sub(r'title="Karte: [^"]*"', f'title="Karte: {street}, {district}"', html)
    if c.get("lat") and c.get("lon"):
        la, lo = float(c["lat"]), float(c["lon"])
        html = re.sub(r"mlat=[^&]+&amp;mlon=[^#]+#map=17/[^\"]+", f"mlat={la:.4f}&amp;mlon={lo:.4f}#map=17/{la:.4f}/{lo:.4f}", html)
        html = re.sub(r"bbox=[^&]+&amp;layer=mapnik&amp;marker=[^\"]+",
                      f"bbox={lo - .0065:.4f}%2C{la - .0032:.4f}%2C{lo + .0065:.4f}%2C{la + .0032:.4f}"
                      f"&amp;layer=mapnik&amp;marker={la:.4f}%2C{lo:.4f}", html)
    html = re.sub(r'<p class="footer-line">.*?</p>', f'<p class="footer-line">{name}, {street}, {pc} Berlin.</p>', html, flags=re.S)
    html = re.sub(r"(<p class=\"footer-meta\">\s*<span>)[^<]*(</span>)", lambda m: f"{m.group(1)}{street}, {pc} Berlin{m.group(2)}", html)
    js = re.sub(r"const WHATSAPP_NUMBER = '\d+';", f"const WHATSAPP_NUMBER = '{c['whatsapp']}';", js)  # salon template
    # contact lines; WhatsApp links are plain wa.me links in the markup, so they work without JS
    html = html.replace("wa.me/491700000000", f"wa.me/{c['whatsapp']}")
    html = re.sub(r"hallo@beispiel-(cafe|salon)\.de", c.get("email", ""), html)
    if c.get("instagram"):
        html = re.sub(r'<span class="text-link" aria-disabled="true">@kiez\w+ \(Platzhalter\)</span>',
                      f'<a class="text-link" href="https://www.instagram.com/{c["instagram"]}/" target="_blank" rel="noopener">@{c["instagram"]}</a>', html)
    # copy
    if c.get("tagline"):
        html = re.sub(r'(<p class="tagline"[^>]*>\s*).*?(\s*</p>)', lambda m: m.group(1) + c["tagline"] + m.group(2), html, count=1, flags=re.S)
    if c.get("lede"):
        html = re.sub(r'(<p class="lede"[^>]*>\s*).*?(\s*</p>)', lambda m: m.group(1) + c["lede"] + m.group(2), html, count=1, flags=re.S)
    if c.get("about"):
        paras = "\n".join(f'              <p data-reveal style="--i: {i + 1}">\n                {p}\n              </p>'
                          for i, p in enumerate(c["about"]))
        html = re.sub(r'(<div class="prose">\s*).*?(\s*</div>)', lambda m: m.group(1) + paras.strip() + m.group(2), html, count=1, flags=re.S)
    # hours: HTML table, hero summary, JS table
    hours = c["hours"]
    for i, d in enumerate(DAYS):
        v = hours.get(d)
        text = f"{v[0]} bis {v[1]}" if v else "Geschlossen"
        html = re.sub(rf'(<div data-day="{i}"><dt>[^<]+</dt><dd>)[^<]*(</dd>)', lambda m: m.group(1) + text + m.group(2), html)
    html = re.sub(r"(<dd data-hours-summary>)[^<]*(</dd>)", lambda m: m.group(1) + hours_summary(hours) + m.group(2), html)
    rows = []
    for i, d in enumerate(DAYS):
        v = hours.get(d)
        rows.append(f"  {i}: " + (f"[[{hm(v[0])[0]}, {hm(v[0])[1]}], [{hm(v[1])[0]}, {hm(v[1])[1]}]]," if v else "null,"))
    js = re.sub(r"const HOURS = \{.*?\n\};", "const HOURS = {\n" + "\n".join(rows) + "\n};", js, count=1, flags=re.S)
    js = js.replace(f"{brand} demo", f"{name} site")
    # menu or price list, group by group in page order
    groups = c.get("menu", [])
    uls = list(re.finditer(r'<ul class="menu-list">.*?</ul>', html, flags=re.S))
    for g, ul in reversed(list(zip(groups, uls))):
        items = "\n".join(
            f'                  <li>\n                    <div class="item-text">\n'
            f'                      <span class="item-name">{n}</span>\n'
            f'                      <span class="item-desc">{d}</span>\n'
            f'                    </div>\n                    <span class="item-price">{p}</span>\n                  </li>'
            for n, d, p in g["items"])
        html = html[:ul.start()] + f'<ul class="menu-list">\n{items}\n                </ul>' + html[ul.end():]
    h3s = list(re.finditer(r'(<h3 id="m-[a-z]+">)[^<]*(</h3>)', html))
    for g, h in reversed(list(zip(groups, h3s))):
        html = html[:h.start()] + f'{h.group(1)}{g["group"]}{h.group(2)}' + html[h.end():]
    return html, js


def render_page(page: str, c: dict, brand: str) -> str:
    """danke, impressum, datenschutz: brand name plus the data-f fields from client.json."""
    page = page.replace(brand, c["name"])
    fields = {"name": c["name"], "owner": c.get("owner", ""), "street": c["street"], "postcode": c["postcode"],
              "phone": c.get("phone", ""), "email": c.get("email", "")}
    for k, v in fields.items():
        page = re.sub(rf'(<span data-f="{k}">)[^<]*(</span>)', lambda m: m.group(1) + v + m.group(2), page)
    if c.get("vat"):
        page = re.sub(r'(<p data-f="vat">)[^<]*(</p>)', lambda m: f"{m.group(1)}Umsatzsteuer-Identifikationsnummer nach § 27a UStG: {c['vat']}{m.group(2)}", page)
    else:  # Kleinunternehmer without a USt-IdNr.
        page = re.sub(r'\s*<h2>Umsatzsteuer</h2>\s*<p data-f="vat">[^<]*</p>', "", page)
    return page


def build(c: dict) -> Path:
    kind = c.get("type", "cafe")
    src = TEMPLATES[kind]
    brand = "Kiez Café" if kind == "cafe" else "Kiez Salon"
    old_street = "Weserstraße" if kind == "cafe" else "Hermannstraße"
    out = OUT_ROOT / slug(c["name"])
    if out.exists():
        sys.exit(f"{out} exists already; move it away first")
    shutil.copytree(src, out, symlinks=True, ignore=lambda d, names: [n for n in names if n in SKIP])
    html, js = render((out / "index.html").read_text(), (out / "src/main.js").read_text(), c, brand, old_street)
    (out / "index.html").write_text(html)
    (out / "src/main.js").write_text(js)
    pages = ""
    for f in ("danke.html", "impressum.html", "datenschutz.html"):
        if (out / "public" / f).exists():
            page = render_page((out / "public" / f).read_text(), c, brand)
            (out / "public" / f).write_text(page)
            pages += page
    (out / "client.json").write_text(json.dumps(c, ensure_ascii=False, indent=1))
    # reuse the template's pinned dependencies; without this `npx vite` would fetch a different vite
    (out / "node_modules").symlink_to(src / "node_modules")
    pkg = out / "package.json"
    pkg.write_text(re.sub(r'"name": "[^"]+"', f'"name": "{slug(c["name"])}"', pkg.read_text(), count=1))
    left = [w for w in ("Kiez Café", "Kiez Salon", "(Demo)", "Demo-Seite", "Demo:", "Swaraj", "491700000000",
                        "beispiel-cafe", "beispiel-salon", "(Beispiel)", "unsplash", 'data-f="owner"></span>',
                        'data-f="phone"></span>')
            if w in html + js + pages]
    print(f"wrote {out}" + (f"\nstill in the page, edit by hand: {left}" if left else ""))
    return out


if __name__ == "__main__":
    if "--example" in sys.argv:
        print(json.dumps(EXAMPLE, ensure_ascii=False, indent=1)); sys.exit(0)
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    build(json.loads(Path(sys.argv[1]).read_text()))
