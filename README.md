# Madrid trip guide

Static neighborhood map for **Jeremy Turner**, based at Thompson Madrid (Plaza del Carmen / Sol–Gran Vía). Chamberí, Malasaña, and nearby markets — not San Miguel.

## Run locally

Any static server works. From this directory:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Or open `index.html` directly. Map tiles need a network connection (OpenStreetMap / CARTO via Leaflet). No API key, no build step, no booking.

## Live site (GitHub Pages)

Intended URL: [https://webgophers.github.io/travel/](https://webgophers.github.io/travel/)

`index.html` is at the repo root. A GitHub Actions workflow (`.github/workflows/pages.yml`) deploys that root (plus `css/`, `js/`, `docs/`) on push to `main` or this guide branch.

This repository is **private**. GitHub Pages on a private repo needs GitHub Pro (or a public repo). The workflow cannot flip repo visibility; enable Pages after the repo is public or the account has Pro, then re-run **Deploy GitHub Pages** under Actions.

## What’s on the page

- Leaflet map centered so Sol/Gran Vía and Chamberí/Malasaña are both in view
- Gold hotel pin for Thompson Madrid; category-colored pins for everything else
- Filters: Stay, Food, Cafe, Markets, Shops, Entertainment
- Cards sync with pins (click either side)
- DIY half-day food route as the main callout
- Tourist-heavy / soft-touristy badges where the source notes say so
- Museo Sorolla marked **Closed** (expansion since Oct 2024) and not suggested as open
- Short optional-tour sidebar with published prices only

Shops (Jamonera Castellana, Jamonería de Juan, Casa Tere) sit on the Mercado de Chamberí card rather than as extra stacked pins.

## Sources

Places, takeaways, and flags come from the trip brief. Coordinates: provided where given; otherwise Wikipedia or OSM Nominatim for the listed address. Walking times are rough from Thompson, not turn-by-turn.

Explicitly omitted: Mercado de San Miguel and Plaza Mayor-as-destination framing.
