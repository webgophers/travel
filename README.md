# Madrid trip guide

Static neighborhood map based at Thompson Madrid (Plaza del Carmen / Sol–Gran Vía). Chamberí, Malasaña, and nearby markets — not San Miguel.

## Run locally

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Or open `index.html` directly. Map tiles need a network connection (OpenStreetMap / CARTO via Leaflet). No API key, no build step.

## Live site (GitHub Pages)

Intended URL: [https://webgophers.github.io/travel/](https://webgophers.github.io/travel/)

`index.html` is at the repo root. The repo is **public**. Creating the Pages site still needs one owner click (Actions cannot enable Pages: `403 Resource not accessible by integration`):

1. Open **Settings → Pages**
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save

Or set Source to **GitHub Actions** and re-run **Actions → Deploy GitHub Pages**. After that, the map is at the URL above.

## What’s on the page

- Three tappable days (Sol, Chamberí, Malasaña / Barceló) built from existing pins only
- **Directions** on every card and map popup (Google Maps; no API key)
- Notes, hide/show, and “Add a place” live in **this browser only** (`localStorage`) — nothing is written back to the repo
- **Reset my edits** clears those local changes
- Phone layout: day plan, then a full-width map (~40vh, sticky) plus **Back to map**; one scrollable filter row
- Tap a place card to pan the map and open that pin (and the other way around)
- Desktop: two columns with a sticky map
- Filters: Stay, Eat, Markets, See
- Gold hotel pin for Thompson Madrid
- Tourist-heavy / busy-weekend badges where noted
- Museo Sorolla marked **Closed** (expansion since Oct 2024)
- Short skip note for Mercado de San Miguel
- Optional paid-tour links with published prices only

Jamón stalls (Jamonera Castellana, Jamonería de Juan, Casa Tere) sit on the Mercado de Chamberí card. Barceló lists Walk and Eat first names (Daniel, Gemma, Roberto) without unpublished stall trade names. La Comunal is a confirmed olive-oil shop; a few other tour-adjacent spots are marked **likely / not confirmed**.

## Sources

Places and flags come from the trip brief. Coordinates: provided where given; otherwise Wikipedia or OSM Nominatim. Walking times are rough from Thompson.

Explicitly omitted: Mercado de San Miguel and Plaza Mayor-as-destination framing.
