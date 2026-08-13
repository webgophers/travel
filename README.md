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

`index.html` is at the repo root. GitHub Actions (`.github/workflows/pages.yml`) deploys that root on push to `main` or the guide branch. The repo must be **public** (or GitHub Pro) for Pages to serve.

## What’s on the page

- Mobile-first layout: food walk first, then a full-width map, then the list
- Filters: Stay, Eat, Markets, See
- Gold hotel pin for Thompson Madrid
- Cards sync with pins
- Tourist-heavy / busy-weekend badges where noted
- Museo Sorolla marked **Closed** (expansion since Oct 2024)
- Short skip note for Mercado de San Miguel
- Optional paid-tour links with published prices only

Jamón stalls (Jamonera Castellana, Jamonería de Juan, Casa Tere) sit on the Mercado de Chamberí card.

## Sources

Places and flags come from the trip brief. Coordinates: provided where given; otherwise Wikipedia or OSM Nominatim. Walking times are rough from Thompson.

Explicitly omitted: Mercado de San Miguel and Plaza Mayor-as-destination framing.
