(function () {
  const { places, categories, map: mapConfig, route, tours } = window.GUIDE;
  const CAT_LABEL = Object.fromEntries(categories.map((c) => [c.id, c.label]));

  const map = L.map("map", { scrollWheelZoom: true }).setView(
    mapConfig.center,
    mapConfig.zoom
  );

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  const markers = new Map();
  let activeId = null;
  let activeFilter = "all";

  function touristLabel(place) {
    if (place.tourist === "heavy") return "Tourist-heavy";
    if (place.tourist === "soft") return "A bit touristy";
    if (place.tourist === "soft-weekends") return "Touristy weekends";
    return "";
  }

  function popupHtml(place) {
    const warn = touristLabel(place);
    const closed = place.closed ? `<span class="badge badge-closed">Closed</span>` : "";
    const warnBadge = warn ? `<span class="badge badge-warn">${warn}</span>` : "";
    const link = place.link
      ? `<a href="${place.link}" target="_blank" rel="noopener">${place.linkLabel || "Link"}</a>`
      : "";
    const shops =
      place.shops && place.shops.length
        ? `<ul class="shops">${place.shops
            .map(
              (s) =>
                `<li><a href="${s.link}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`
            )
            .join("")}</ul>`
        : "";
    return `
      <div class="popup">
        <div class="badges">
          <span class="badge badge-cat ${place.category}">${CAT_LABEL[place.category]}</span>
          ${warnBadge}${closed}
        </div>
        <h3>${place.name}</h3>
        <p class="meta">${place.neighborhood}${place.address ? " · " + place.address : ""}</p>
        <p>${place.takeaway}</p>
        ${place.walk ? `<p class="walk">${place.walk}</p>` : ""}
        ${shops}
        ${link}
      </div>
    `;
  }

  function markerIcon(place) {
    const extra = place.closed ? " is-closed" : "";
    if (place.category === "stay") {
      return L.divIcon({
        className: "",
        html: `<div class="marker-stay" title="${place.name}">⌂</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 24],
        popupAnchor: [0, -22],
      });
    }
    return L.divIcon({
      className: "",
      html: `<div class="marker marker-${place.category}${extra}" title="${place.name}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });
  }

  function matchesFilter(place, filter) {
    if (filter === "all") return true;
    if (filter === "shops") return Boolean(place.shops && place.shops.length);
    return place.category === filter;
  }

  function visiblePlaces() {
    return places.filter((p) => matchesFilter(p, activeFilter));
  }

  places.forEach((place) => {
    if (place.lat == null || place.lng == null) return;
    const marker = L.marker([place.lat, place.lng], {
      icon: markerIcon(place),
      title: place.name,
      zIndexOffset: place.category === "stay" ? 1000 : 0,
      riseOnHover: true,
    });
    marker.bindPopup(popupHtml(place), { maxWidth: 300 });
    marker.on("click", () => selectPlace(place.id, { fromMap: true }));
    markers.set(place.id, marker);
    marker.addTo(map);
  });

  function selectPlace(id, opts = {}) {
    activeId = id;
    const place = places.find((p) => p.id === id);
    const marker = markers.get(id);
    document.querySelectorAll(".card").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === id);
    });
    document.querySelectorAll(".route-step").forEach((el) => {
      el.classList.toggle(
        "is-active",
        el.dataset.placeId === id || el.dataset.altId === id
      );
    });
    if (marker && !opts.fromMap) {
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 16), { duration: 0.45 });
      marker.openPopup();
    } else if (marker && opts.fromMap) {
      marker.openPopup();
    }
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (card && !opts.fromMap) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function applyFilter(filter, opts = {}) {
    activeFilter = filter;
    document.querySelectorAll(".filter").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.cat === filter);
    });
    const shown = visiblePlaces();
    markers.forEach((marker, id) => {
      const place = places.find((p) => p.id === id);
      if (matchesFilter(place, filter)) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    renderCards();
    const countEl = document.getElementById("places-count");
    const label = filter === "all" ? "all categories" : CAT_LABEL[filter] || "Shops";
    countEl.textContent = `${shown.length} pin${shown.length === 1 ? "" : "s"} · ${label}`;
    if (!opts.skipFit) fitVisible(filter);
  }

  function fitVisible(filter) {
    if (filter === "all") {
      map.setView(mapConfig.center, mapConfig.zoom);
      return;
    }
    const shown = visiblePlaces().filter((p) => p.lat != null && p.lng != null);
    if (!shown.length) return;
    if (shown.length === 1) {
      map.setView([shown[0].lat, shown[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(shown.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }

  function renderFilters() {
    const wrap = document.getElementById("filters");
    const items = [{ id: "all", label: "All" }, ...categories];
    wrap.innerHTML = items
      .map(
        (c) =>
          `<button class="filter${c.id === "all" ? " is-on" : ""}" type="button" data-cat="${c.id}">${c.label}</button>`
      )
      .join("");
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      applyFilter(btn.dataset.cat);
    });
  }

  function renderCards() {
    const wrap = document.getElementById("cards");
    wrap.innerHTML = visiblePlaces()
      .map((place) => {
        const warn = touristLabel(place);
        const shops =
          place.shops && place.shops.length
            ? `<ul class="shops">${place.shops
                .map(
                  (s) =>
                    `<li><a href="${s.link}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`
                )
                .join("")}</ul>`
            : "";
        const link = place.link
          ? `<a class="card-link" href="${place.link}" target="_blank" rel="noopener">${place.linkLabel || "Source"}</a>`
          : "";
        return `
          <article class="card${place.closed ? " is-closed" : ""}${place.id === activeId ? " is-active" : ""}" data-id="${place.id}" tabindex="0">
            <div class="card-top">
              <h3>${place.name}</h3>
              <div class="badges">
                <span class="badge badge-cat ${place.category}">${CAT_LABEL[place.category]}</span>
                ${warn ? `<span class="badge badge-warn">${warn}</span>` : ""}
                ${place.closed ? `<span class="badge badge-closed">Closed</span>` : ""}
              </div>
            </div>
            <p class="meta">${place.neighborhood}${place.walk ? " · " + place.walk : ""}</p>
            <p class="takeaway">${place.takeaway}</p>
            ${shops}
            ${link}
          </article>
        `;
      })
      .join("");
  }

  document.getElementById("cards").addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const card = e.target.closest(".card");
    if (card) selectPlace(card.dataset.id);
  });
  document.getElementById("cards").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    selectPlace(card.dataset.id);
  });

  function renderRoute() {
    const wrap = document.getElementById("route-steps");
    wrap.innerHTML = route
      .map(
        (step) => `
        <button class="route-step" type="button" data-place-id="${step.placeId}" data-alt-id="${step.altId || ""}">
          <b>${step.when}</b>
          <div>
            <strong>Step ${step.step}</strong>
            <p>${step.text}</p>
          </div>
        </button>`
      )
      .join("");
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".route-step");
      if (!btn) return;
      applyFilter("all", { skipFit: true });
      selectPlace(btn.dataset.placeId);
    });
  }

  function renderTours() {
    document.getElementById("tours").innerHTML = tours
      .map(
        (t) => `
        <a href="${t.link}" target="_blank" rel="noopener">
          <strong>${t.name}</strong>
          <span>${t.detail}</span>
        </a>`
      )
      .join("");
  }

  document.getElementById("reset-view").addEventListener("click", () => {
    map.setView(mapConfig.center, mapConfig.zoom);
    applyFilter("all");
    const hotel = markers.get("thompson");
    if (hotel) hotel.openPopup();
    activeId = "thompson";
    document.querySelectorAll(".card").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === "thompson");
    });
  });

  renderFilters();
  renderRoute();
  renderTours();
  applyFilter("all");

  window.addEventListener("load", () => map.invalidateSize());
  setTimeout(() => map.invalidateSize(), 200);
})();
