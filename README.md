# Madrid trip guide

Static neighborhood map based at Thompson Madrid (Plaza del Carmen / Sol–Gran Vía). Chamberí, Malasaña, and nearby markets — not San Miguel. Built as a **pocket guide**: short rows, a collapsed day plan, and details on the map pin.

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

- Four-day accordion (Sol, Chamberí, Malasaña / Barceló, Sunday / La Latina), **collapsed by default**, one day open at a time
- Compact place rows: name, neighborhood, hours, **Directions** + **Note**
- Map popups hold the rest: photo (when we have a Commons file), hours, official or Maps link, badges, short blurb
- **Note** opens a small sheet (closed by default). Notes, hide/show, and “Add a place” live in **this browser only** (`localStorage`)
- **Add** is a small control, not a form always on screen
- Skip and paid tours sit in collapsed footers
- Phone layout: day plan, then a full-width map (~40vh, sticky) plus **Back to map**; category and neighborhood chips stay on one scrollable row each
- Tap a row to pan the map and open that pin (and the other way around)
- Desktop: two columns with a sticky map
- Filters: Stay, Eat, Markets, See — plus Sol, Chamberí, Malasaña/Chueca, La Latina, Other (Recoletos / Salamanca / Ibiza stay on Other)
- **Open in Google Maps** / **Download KML** from the current pins (built-in plus places added on this phone). Import the KML into Google My Maps or Saved → Maps
- A one-line Madrid rhythm strip (breakfast / vermouth-lunch / shop siesta / dinner)
- One-line “how to use” on a few tapas and market rows, taken from the existing takeaway — not new writeups
- Gold hotel pin for Thompson Madrid
- Tourist-heavy / busy-weekend / **Closed** / **likely** badges where noted
- Museo Sorolla marked **Closed** (expansion since Oct 2024)
- No San Miguel as a recommendation

Jamón stalls (Jamonera Castellana, Jamonería de Juan, Casa Tere) sit on the Mercado de Chamberí popup. Barceló lists Walk and Eat first names (Daniel, Gemma, Roberto) without unpublished stall trade names. La Comunal is a confirmed olive-oil shop; a few other tour-adjacent spots are marked **likely / not confirmed**.

## Hours

Hours come from official venue pages, Turismo Madrid, or Ayuntamiento listings. If the schedule is unknown, seasonal, or conflicting, the page says **Hours: check site** and keeps the official or Google Maps link. Schedules are not invented.

## Photos

At most one thumbnail per place. Only Wikimedia Commons files that can be hotlinked, with credit on the image and in the footer. Thompson Madrid has no freely licensable press/Commons photo, so it is skipped. No generated or stock stand-ins.

## Sources

Places and flags come from the trip brief plus visitor-tested eats (our notes, not copied pin text). Coordinates: provided where given; otherwise Wikipedia or OSM Nominatim. Walking times are rough from Thompson.

Explicitly omitted: Mercado de San Miguel and Plaza Mayor-as-destination framing. Also skipped as low-value / chain terrace: Faborit, Cañas y Tapas Plaza Mayor.
