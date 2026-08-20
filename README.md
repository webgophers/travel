# Madrid trip guide

Static neighborhood map for **22 Aug–3 Sep 2026**. Home base is Thompson Madrid (Plaza del Carmen) **22–30 Aug**, then Hotel Montera Madrid (Calle de la Montera 47) **31 Aug–4 Sep**. Chamberí, Malasaña, and nearby markets — not San Miguel. Built as a **pocket guide**: four picture tiles (Food / Shopping / Sites / Landmarks), photo-first cards with a one-line why, a dated day accordion (one day open), and details behind **More** or the map pin.

## Run locally

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Or open `index.html` directly. Map tiles need a network connection (OpenStreetMap / CARTO via Leaflet). Commons thumbnails need a network connection too. No API key, no build step.

## Live site (GitHub Pages)

Intended URL: [https://webgophers.github.io/travel/](https://webgophers.github.io/travel/)

`index.html` is at the repo root. The repo is **public**. Creating the Pages site still needs one owner click (Actions cannot enable Pages: `403 Resource not accessible by integration`):

1. Open **Settings → Pages**
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save

Or set Source to **GitHub Actions** and re-run **Actions → Deploy GitHub Pages**. After that, the map is at the URL above.

## What’s on the page

- Dated accordion **Sat 22 Aug–Thu 3 Sep** (13 days), **one day open at a time**. Each open day has 3–4 picture slots with a short why — not a 13-day wall
- Walk notes say **from Thompson** through 30 Aug and **from Montera** from 31 Aug
- Two stay pins: Thompson and Hotel Montera. Reset map prefers Thompson or fits both
- Phone default is **Food**, not every pin. Four picture tiles switch groups; **All** is a chip, not the landing view
- Place cards lead with a full-bleed photo (or a category color + icon if Commons has no file). Then name, neighborhood / walk, one short why, and a sourced rating when we have one
- Hours, site link, Maps, and **Note** sit behind **More** (and still on the map popup)
- Map popups hold the rest: photo (when we have a Commons file), hours, official or Maps link, badges, short blurb
- **Note** opens a small sheet (closed by default). Notes, hide/show, and “Add a place” live in **this browser only** (`localStorage`)
- **Add** is a small control, not a form always on screen
- Skip and paid tours sit in collapsed footers
- Phone layout: day plan, then a full-width map (~40vh, sticky) plus **Back to map**; category and neighborhood chips stay on one scrollable row each
- Tap a row to pan the map and open that pin (and the other way around)
- Desktop: two columns with a sticky map
- Filters: Food, Shopping, Sites, Landmarks — plus Sol, Chamberí, Malasaña/Chueca, La Latina, Other (Recoletos / Salamanca / Ibiza stay on Other). Map pins still use the old stay / eat / markets / see colors
- **Open in Google Maps** / **Download KML** from the current pins (built-in plus places added on this phone). Import the KML into Google My Maps or Saved → Maps
- A one-line Madrid rhythm strip (breakfast / vermouth-lunch / shop siesta / dinner)
- One-line “how to use” on a few tapas and market rows, taken from the existing takeaway — not new writeups
- Gold hotel pins for Thompson and Montera
- Tourist-heavy / busy-weekend / **likely** badges where noted
- Places closed for this window are off the visible list (no Closed cards)
- No San Miguel as a recommendation

Jamón stalls (Jamonera Castellana, Jamonería de Juan, Casa Tere) sit on the Mercado de Chamberí popup. Barceló lists Walk and Eat first names (Daniel, Gemma, Roberto) without unpublished stall trade names. La Comunal is a confirmed olive-oil shop (August mornings only, 10:00–14:00). A few other tour-adjacent spots are marked **likely / not confirmed**.

## Hours

Hours come from official venue pages, Turismo Madrid, or Ayuntamiento listings. If the schedule is unknown, seasonal, or conflicting, the page says **Hours: check site** and keeps the official or Google Maps link. Schedules are not invented.

This window: Reina Sofía is closed Tuesdays (not on 25 Aug or 1 Sep). El Rastro is Sundays only (23 Aug and 30 Aug). Andén 0 is Fri afternoon plus Sat/Sun. Markets are typical Mon–Sat. Palacio de Velázquez is a Retiro extra if you want it.

## Photos

At most one photo per place. Only Wikimedia Commons files that can be hotlinked, with credit on the image and in the footer. If there is no Commons file, the card uses a solid category color and a single icon — never a broken image. The two hotels have no freely licensable press/Commons photo, so they use that fallback. No generated or stock stand-ins.

## Why and ratings

Each place has a `why` line rewritten from the existing takeaway (about 12 words max). `rating` is only stored when a Google figure could be checked; obscure stalls are left unrated. Do not invent scores.

## Sources

Places and flags come from the trip brief plus visitor-tested eats (our notes, not copied pin text). Coordinates: provided where given; otherwise Wikipedia or OSM Nominatim. Walking times are rough from the hotel in use that day.

Explicitly omitted: Mercado de San Miguel and Plaza Mayor-as-destination framing. Also skipped as low-value / chain terrace: Faborit, Cañas y Tapas Plaza Mayor.
