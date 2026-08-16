(function () {
  const { places: builtInPlaces, categories, barrios, map: mapConfig, days, tours } = window.GUIDE;
  const CAT_LABEL = Object.fromEntries(categories.map((c) => [c.id, c.label]));
  const BARRIO_LABEL = Object.fromEntries((barrios || []).map((b) => [b.id, b.label]));
  const STORAGE_KEY = "madrid-guide-edits-v1";

  const map = L.map("map", {
    scrollWheelZoom: true,
    tapTolerance: 24,
    zoomControl: false,
  }).setView(mapConfig.center, mapConfig.zoom);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  const markers = new Map();
  let activeId = null;
  let activeFilter = "all";
  let activeBarrio = "all";
  let openDayId = null;
  let edits = loadEdits();
  let noteTarget = null;

  function loadEdits() {
    const empty = { notes: {}, hidden: [], custom: [], dayNotes: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const data = JSON.parse(raw);
      return {
        notes: data.notes && typeof data.notes === "object" ? data.notes : {},
        hidden: Array.isArray(data.hidden) ? data.hidden : [],
        custom: Array.isArray(data.custom) ? data.custom : [],
        dayNotes: data.dayNotes && typeof data.dayNotes === "object" ? data.dayNotes : {},
      };
    } catch {
      return empty;
    }
  }

  function saveEdits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function allPlaces() {
    return builtInPlaces.concat(edits.custom);
  }

  function findPlace(id) {
    return allPlaces().find((p) => p.id === id);
  }

  function isHidden(id) {
    return edits.hidden.indexOf(id) !== -1;
  }

  function visibleCatalog() {
    return allPlaces().filter((p) => !isHidden(p.id));
  }

  function touristLabel(place) {
    if (place.tourist === "heavy") return "Tourist-heavy";
    if (place.tourist === "soft") return "A bit touristy";
    if (place.tourist === "soft-weekends") return "Busy weekends";
    return "";
  }

  function shopList(place) {
    if (!place.shops || !place.shops.length) return "";
    return `<ul class="shops">${place.shops
      .map((s) => {
        const name = s.link
          ? `<a class="tap-link" href="${escapeHtml(s.link)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`
          : `<strong>${escapeHtml(s.name)}</strong>`;
        return `<li>${name} — ${escapeHtml(s.note)}</li>`;
      })
      .join("")}</ul>`;
  }

  function extraLinksHtml(place) {
    if (!place.extraLinks || !place.extraLinks.length) return "";
    return place.extraLinks
      .map(
        (l) =>
          `<a class="site-link" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
      )
      .join(" ");
  }

  function confidenceBadge(place) {
    if (place.confidence === "confirmed") {
      return `<span class="badge badge-confirmed">Confirmed</span>`;
    }
    if (place.confidence === "likely") {
      return `<span class="badge badge-likely">Likely</span>`;
    }
    return "";
  }

  function hoursText(place) {
    return place.hours || "Hours: check site";
  }

  function placeLink(place) {
    if (place.link) return { href: place.link, label: place.linkLabel || "Site" };
    if (place.address || place.name) {
      const q = [place.name, place.address].filter(Boolean).join(" ");
      return {
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
        label: "Google Maps",
      };
    }
    return null;
  }

  function hoursLine(place) {
    const site = placeLink(place);
    const siteHtml = site
      ? ` <a class="site-link" href="${escapeHtml(site.href)}" target="_blank" rel="noopener">${escapeHtml(site.label)}</a>`
      : "";
    return `<p class="hours-line">${escapeHtml(hoursText(place))}${siteHtml}</p>`;
  }

  function directionsUrl(place) {
    if (place.lat != null && place.lng != null && place.lat !== "" && place.lng !== "") {
      return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    }
    if (place.address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`;
    }
    return "";
  }

  function directionsButton(place) {
    const href = directionsUrl(place);
    if (!href) return "";
    return `<a class="btn-dir" href="${escapeHtml(href)}" target="_blank" rel="noopener">Directions</a>`;
  }

  function noteButton(kind, key) {
    const has =
      kind === "day" ? Boolean((edits.dayNotes[key] || "").trim()) : Boolean((edits.notes[key] || "").trim());
    return `<button class="btn-note${has ? " has-note" : ""}" type="button" data-open-note="${escapeHtml(key)}" data-note-kind="${kind}">Note</button>`;
  }

  function photoHtml(place, className) {
    if (!place.photo || !place.photo.src) return "";
    return `<img class="${className}" src="${escapeHtml(place.photo.src)}" alt="${escapeHtml(place.photo.alt || place.name)}" loading="lazy" width="400" height="220" />`;
  }

  function popupHtml(place) {
    const warn = touristLabel(place);
    const closed = place.closed ? `<span class="badge badge-closed">Closed</span>` : "";
    const warnBadge = warn ? `<span class="badge badge-warn">${warn}</span>` : "";
    const yours = place.custom ? `<span class="badge badge-yours">Yours</span>` : "";
    const note = edits.notes[place.id];
    const blurb = place.confidenceNote || place.takeaway || "";
    const credit = place.photo
      ? `<p class="popup-credit"><a href="${escapeHtml(place.photo.page)}" target="_blank" rel="noopener">${escapeHtml(place.photo.credit)}</a>${place.photo.license ? " · " + escapeHtml(place.photo.license) : ""}</p>`
      : "";
    const hideBtn = place.custom
      ? `<button class="btn-quiet" type="button" data-delete="${escapeHtml(place.id)}">Delete</button>`
      : `<button class="btn-quiet" type="button" data-hide="${escapeHtml(place.id)}">Hide</button>`;
    return `
      <div class="popup">
        ${photoHtml(place, "popup-photo")}
        ${credit}
        <div class="badges">
          <span class="badge badge-cat ${place.category}">${CAT_LABEL[place.category] || place.category}</span>
          ${confidenceBadge(place)}
          ${yours}
          ${warnBadge}${closed}
        </div>
        <h3>${escapeHtml(place.name)}</h3>
        <p class="meta">${escapeHtml(place.neighborhood || "")}</p>
        ${hoursLine(place)}
        ${place.use ? `<p class="use-line">${escapeHtml(place.use)}</p>` : ""}
        ${extraLinksHtml(place)}
        <div class="popup-actions">
          ${directionsButton(place)}
          ${noteButton("place", place.id)}
        </div>
        ${blurb ? `<p class="popup-blurb">${escapeHtml(blurb)}</p>` : ""}
        ${shopList(place)}
        ${place.unnamed ? `<p class="walk">${escapeHtml(place.unnamed)}</p>` : ""}
        ${note ? `<p class="walk">Note: ${escapeHtml(note)}</p>` : ""}
        ${hideBtn}
      </div>
    `;
  }

  function markerIcon(place) {
    const extra = place.closed ? " is-closed" : "";
    const custom = place.custom ? " marker-custom" : "";
    if (place.category === "stay") {
      return L.divIcon({
        className: "",
        html: `<div class="marker-stay${custom}" title="${escapeHtml(place.name)}">⌂</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 26],
        popupAnchor: [0, -22],
      });
    }
    return L.divIcon({
      className: "",
      html: `<div class="marker marker-${place.category}${extra}${custom}" title="${escapeHtml(place.name)}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
  }

  function matchesFilter(place, filter) {
    if (filter === "all") return true;
    if (filter === "markets") return place.category === "markets" || Boolean(place.shops);
    return place.category === filter;
  }

  function barrioOf(place) {
    if (place.custom) return "other";
    const n = (place.neighborhood || "").toLowerCase();
    if (/sol|gran v[ií]a|behind gran/.test(n)) return "sol";
    if (/malasaña|chueca|justicia|barceló|conde duque/.test(n)) return "malasana";
    if (/chamberí|almagro|bilbao/.test(n)) return "chamberi";
    return "other";
  }

  function matchesBarrio(place, barrio) {
    if (barrio === "all") return true;
    return barrioOf(place) === barrio;
  }

  function isShown(place) {
    return matchesFilter(place, activeFilter) && matchesBarrio(place, activeBarrio);
  }

  function visiblePlaces() {
    return visibleCatalog().filter(isShown);
  }

  function exportPlaces() {
    return visibleCatalog().filter((p) => p.lat != null && p.lng != null && p.lat !== "" && p.lng !== "");
  }

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildKml(list) {
    const marks = list
      .map((p) => {
        const bits = [p.neighborhood, p.address, p.hours || "", p.use || "", p.takeaway || ""]
          .filter(Boolean)
          .join(" — ");
        return `    <Placemark>
      <name>${xmlEscape(p.name)}</name>
      <description>${xmlEscape(bits)}</description>
      <Point><coordinates>${Number(p.lng)},${Number(p.lat)},0</coordinates></Point>
    </Placemark>`;
      })
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Madrid pocket guide</name>
    <description>Existing pins from the Thompson Madrid pocket guide. Import into Google My Maps or Saved → Maps.</description>
${marks}
  </Document>
</kml>
`;
  }

  function googleMapsDirUrl(list) {
    if (!list.length) return "https://www.google.com/maps/@40.4282,-3.7024,14z";
    const path = list.map((p) => `${p.lat},${p.lng}`).join("/");
    return `https://www.google.com/maps/dir/${path}`;
  }

  function refreshExportLinks() {
    const list = exportPlaces();
    const link = document.getElementById("open-gmaps");
    if (link) link.href = googleMapsDirUrl(list);
  }

  function downloadKml() {
    const list = exportPlaces();
    const blob = new Blob([buildKml(list)], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "madrid-pocket-guide.kml";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clearMarkers() {
    markers.forEach((marker) => {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    markers.clear();
  }

  function rebuildMarkers() {
    clearMarkers();
    visibleCatalog().forEach((place) => {
      if (place.lat == null || place.lng == null) return;
      const marker = L.marker([place.lat, place.lng], {
        icon: markerIcon(place),
        title: place.name,
        zIndexOffset: place.category === "stay" ? 1000 : 0,
        riseOnHover: true,
      });
      marker.bindPopup(popupHtml(place), {
        maxWidth: 280,
        minWidth: 200,
        maxHeight: 220,
        autoPan: true,
        autoPanPaddingTopLeft: [12, 12],
        autoPanPaddingBottomRight: [56, 64],
        keepInView: true,
        className: "place-popup",
      });
      marker.on("click", () => selectPlace(place.id, { fromMap: true }));
      markers.set(place.id, marker);
      if (isShown(place)) marker.addTo(map);
    });
  }

  function highlightActive() {
    document.querySelectorAll(".card").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === activeId);
    });
    document.querySelectorAll(".day-slot").forEach((el) => {
      const ids = [el.dataset.placeId, el.dataset.altId];
      el.classList.toggle("is-active", ids.indexOf(activeId) !== -1);
    });
  }

  function cardEl(id) {
    return document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  }

  function openPlacePopup(place, marker) {
    map.invalidateSize();
    map.setView([place.lat, place.lng], Math.max(map.getZoom(), 16), { animate: false });
    marker.setPopupContent(popupHtml(place));
    marker.openPopup();
    const popupEl = marker.getPopup() && marker.getPopup().getElement();
    const extra = popupEl ? Math.max(0, popupEl.offsetHeight / 2 + 12 - map.getSize().y * 0.28) : 0;
    if (extra > 0) {
      map.panBy([0, extra], { animate: false });
    }
  }

  function selectPlace(id, opts = {}) {
    const place = findPlace(id);
    if (!place) return;
    activeId = id;
    if (isHidden(id)) {
      edits.hidden = edits.hidden.filter((x) => x !== id);
      saveEdits();
      rebuildMarkers();
      renderCards();
      renderHidden();
    }
    highlightActive();
    const marker = markers.get(id);
    const revealMap = () => {
      if (marker && place.lat != null && place.lng != null) {
        openPlacePopup(place, marker);
      }
    };
    if (!opts.fromMap) {
      document.getElementById("map-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(revealMap, 280);
    } else {
      revealMap();
      const card = cardEl(id);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function applyFilter(filter, opts = {}) {
    activeFilter = filter;
    document.querySelectorAll("#filters .filter").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.cat === filter);
    });
    applyVisibility(opts);
  }

  function applyBarrio(barrio, opts = {}) {
    activeBarrio = barrio;
    document.querySelectorAll("#barrios .filter").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.barrio === barrio);
    });
    applyVisibility(opts);
  }

  function applyVisibility(opts = {}) {
    markers.forEach((marker, id) => {
      const place = findPlace(id);
      if (place && isShown(place) && !isHidden(id)) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    renderCards();
    refreshExportLinks();
    const shown = visiblePlaces();
    const countEl = document.getElementById("places-count");
    const cat = activeFilter === "all" ? "all" : CAT_LABEL[activeFilter] || activeFilter;
    const hood = activeBarrio === "all" ? "all barrios" : BARRIO_LABEL[activeBarrio] || activeBarrio;
    countEl.textContent = `${shown.length} · ${cat} · ${hood}`;
    if (!opts.skipFit) fitVisible();
    map.invalidateSize();
  }

  function fitVisible() {
    if (activeFilter === "all" && activeBarrio === "all") {
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
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
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
    const hoods = document.getElementById("barrios");
    const barrioItems = barrios && barrios.length ? barrios : [{ id: "all", label: "All" }];
    hoods.innerHTML = barrioItems
      .map(
        (b) =>
          `<button class="filter${b.id === "all" ? " is-on" : ""}" type="button" data-barrio="${b.id}">${b.label}</button>`
      )
      .join("");
    hoods.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      applyBarrio(btn.dataset.barrio);
    });
  }

  function renderCards() {
    const wrap = document.getElementById("cards");
    wrap.innerHTML = visiblePlaces()
      .map((place) => {
        const warn = touristLabel(place);
        const thumb = place.photo ? photoHtml(place, "card-thumb") : "";
        return `
          <article class="card${place.photo ? " has-thumb" : ""}${place.closed ? " is-closed" : ""}${place.id === activeId ? " is-active" : ""}" data-id="${escapeHtml(place.id)}" tabindex="0">
            ${thumb}
            <div class="card-body">
              <div class="card-top">
                <h3>${escapeHtml(place.name)}</h3>
                <div class="badges">
                  ${place.custom ? `<span class="badge badge-yours">Yours</span>` : ""}
                  ${warn ? `<span class="badge badge-warn">${warn}</span>` : ""}
                  ${place.closed ? `<span class="badge badge-closed">Closed</span>` : ""}
                  ${confidenceBadge(place)}
                </div>
              </div>
              <p class="meta">${escapeHtml(place.neighborhood || "")}</p>
              ${hoursLine(place)}
              ${place.use ? `<p class="use-line">${escapeHtml(place.use)}</p>` : ""}
              <div class="card-actions">
                ${directionsButton(place)}
                ${noteButton("place", place.id)}
              </div>
            </div>
          </article>
        `;
      })
      .join("");
    highlightActive();
  }

  function renderHidden() {
    const wrap = document.getElementById("hidden-wrap");
    const list = document.getElementById("hidden-list");
    const hiddenPlaces = allPlaces().filter((p) => isHidden(p.id));
    if (!hiddenPlaces.length) {
      wrap.hidden = true;
      list.innerHTML = "";
      return;
    }
    wrap.hidden = false;
    list.innerHTML = hiddenPlaces
      .map(
        (p) => `
        <div class="hidden-row">
          <span>${escapeHtml(p.name)}</span>
          <button class="btn-quiet" type="button" data-unhide="${escapeHtml(p.id)}">Show again</button>
        </div>`
      )
      .join("");
  }

  function renderDays() {
    const wrap = document.getElementById("day-acc");
    wrap.innerHTML = days
      .map((day) => {
        const open = day.id === openDayId;
        const slots = day.slots
          .map((slot) => {
            const primary = findPlace(slot.placeId);
            const alt = slot.altId ? findPlace(slot.altId) : null;
            const noteKey = `${day.id}:${slot.id}`;
            const picks = [primary, alt]
              .filter(Boolean)
              .map(
                (p) =>
                  `<button class="pick" type="button" data-focus="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`
              )
              .join("");
            return `
              <div class="day-slot" data-place-id="${escapeHtml(slot.placeId)}" data-alt-id="${escapeHtml(slot.altId || "")}">
                <div class="day-slot__when">${escapeHtml(slot.when)}</div>
                <p class="day-slot__text">${escapeHtml(slot.text)}</p>
                <div class="day-slot__picks">${picks}${noteButton("day", noteKey)}</div>
              </div>`;
          })
          .join("");
        return `
          <div class="day-item${open ? " is-open" : ""}" data-day="${day.id}">
            <button class="day-item__head" type="button" aria-expanded="${open}" data-day-toggle="${day.id}">
              <span>${escapeHtml(day.title)}<small>${escapeHtml(day.subtitle)}</small></span>
            </button>
            <div class="day-item__body"${open ? "" : " hidden"}>
              <p class="transit">${escapeHtml(day.transit)}</p>
              <div class="day-slots">${slots}</div>
            </div>
          </div>`;
      })
      .join("");
    highlightActive();
  }

  function renderTours() {
    document.getElementById("tours").innerHTML = tours
      .map(
        (t) => `
        <a href="${escapeHtml(t.link)}" target="_blank" rel="noopener">
          <strong>${escapeHtml(t.name)}</strong>
          <span>${escapeHtml(t.detail)}</span>
        </a>`
      )
      .join("");
  }

  function renderPhotoCredits() {
    const seen = new Set();
    const bits = [];
    builtInPlaces.forEach((p) => {
      if (!p.photo) return;
      const key = p.photo.page || p.photo.src;
      if (seen.has(key)) return;
      seen.add(key);
      bits.push(
        `<a href="${escapeHtml(p.photo.page)}" target="_blank" rel="noopener">${escapeHtml(p.name)}</a>: ${escapeHtml(p.photo.credit)}${p.photo.license ? " (" + escapeHtml(p.photo.license) + ")" : ""}`
      );
    });
    document.getElementById("photo-credits").innerHTML = bits.length
      ? "Photo credits — " + bits.join(" · ")
      : "";
  }

  function openNoteSheet(key, kind, title) {
    noteTarget = { key, kind };
    const sheet = document.getElementById("note-sheet");
    const area = document.getElementById("note-sheet-text");
    document.getElementById("note-sheet-title").textContent = title || "Note";
    area.value = kind === "day" ? edits.dayNotes[key] || "" : edits.notes[key] || "";
    sheet.hidden = false;
    area.focus();
  }

  function closeNoteSheet() {
    document.getElementById("note-sheet").hidden = true;
    noteTarget = null;
  }

  function saveNoteSheet() {
    if (!noteTarget) return;
    const value = document.getElementById("note-sheet-text").value;
    if (noteTarget.kind === "day") {
      edits.dayNotes[noteTarget.key] = value;
      saveEdits();
      renderDays();
    } else {
      edits.notes[noteTarget.key] = value;
      saveEdits();
      renderCards();
      const marker = markers.get(noteTarget.key);
      const place = findPlace(noteTarget.key);
      if (marker && place) marker.setPopupContent(popupHtml(place));
    }
    closeNoteSheet();
  }

  document.getElementById("day-acc").addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-day-toggle]");
    if (toggle) {
      const id = toggle.dataset.dayToggle;
      openDayId = openDayId === id ? null : id;
      renderDays();
      return;
    }
    const pick = e.target.closest("[data-focus]");
    if (pick) {
      applyFilter("all", { skipFit: true });
      selectPlace(pick.dataset.focus);
      return;
    }
    if (e.target.closest("[data-open-note]")) return;
    const slot = e.target.closest(".day-slot");
    if (!slot) return;
    applyFilter("all", { skipFit: true });
    selectPlace(slot.dataset.placeId);
  });

  function activateCard(card) {
    if (!card || !card.dataset.id) return;
    applyFilter("all", { skipFit: true });
    selectPlace(card.dataset.id);
  }

  document.getElementById("cards").addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const card = e.target.closest(".card");
    if (card) activateCard(card);
  });
  document.getElementById("cards").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest("a, button")) return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    activateCard(card);
  });

  document.addEventListener("click", (e) => {
    const noteBtn = e.target.closest("[data-open-note]");
    if (noteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const kind = noteBtn.dataset.noteKind || "place";
      const key = noteBtn.dataset.openNote;
      const title = kind === "day" ? "Note for this slot" : "Note";
      openNoteSheet(key, kind, title);
      return;
    }
    const hideBtn = e.target.closest("[data-hide]");
    if (hideBtn) {
      const id = hideBtn.dataset.hide;
      if (edits.hidden.indexOf(id) === -1) edits.hidden.push(id);
      saveEdits();
      if (activeId === id) activeId = null;
      rebuildMarkers();
      applyFilter(activeFilter, { skipFit: true });
      renderHidden();
      return;
    }
    const delBtn = e.target.closest("[data-delete]");
    if (delBtn) {
      const id = delBtn.dataset.delete;
      edits.custom = edits.custom.filter((p) => p.id !== id);
      delete edits.notes[id];
      edits.hidden = edits.hidden.filter((x) => x !== id);
      saveEdits();
      if (activeId === id) activeId = null;
      rebuildMarkers();
      applyFilter(activeFilter, { skipFit: true });
      renderHidden();
    }
  });

  document.getElementById("places").addEventListener("click", (e) => {
    const unhideBtn = e.target.closest("[data-unhide]");
    if (unhideBtn) {
      edits.hidden = edits.hidden.filter((x) => x !== unhideBtn.dataset.unhide);
      saveEdits();
      rebuildMarkers();
      applyFilter(activeFilter, { skipFit: true });
      renderHidden();
    }
  });

  document.getElementById("toggle-add").addEventListener("click", () => {
    const form = document.getElementById("add-form");
    const btn = document.getElementById("toggle-add");
    const open = form.hidden;
    form.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) document.getElementById("add-name").focus();
  });

  document.getElementById("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("add-name").value.trim();
    const category = document.getElementById("add-category").value;
    const address = document.getElementById("add-address").value.trim();
    const latRaw = document.getElementById("add-lat").value.trim();
    const lngRaw = document.getElementById("add-lng").value.trim();
    if (!name) return;
    const lat = latRaw === "" ? null : Number(latRaw);
    const lng = lngRaw === "" ? null : Number(lngRaw);
    if (latRaw && !Number.isFinite(lat)) return;
    if (lngRaw && !Number.isFinite(lng)) return;
    if (!address && (lat == null || lng == null)) {
      document.getElementById("add-address").focus();
      return;
    }
    const id = `custom-${Date.now()}`;
    const place = {
      id,
      name,
      category,
      neighborhood: "Added on this phone",
      address,
      lat,
      lng,
      hours: "Hours: check site",
      takeaway: "Added on this phone.",
      custom: true,
    };
    edits.custom.push(place);
    saveEdits();
    e.target.reset();
    document.getElementById("add-category").value = "food";
    document.getElementById("add-form").hidden = true;
    document.getElementById("toggle-add").setAttribute("aria-expanded", "false");
    rebuildMarkers();
    applyFilter("all", { skipFit: true });
    renderHidden();
    selectPlace(id);
  });

  document.getElementById("note-sheet-save").addEventListener("click", saveNoteSheet);
  document.getElementById("note-sheet-close").addEventListener("click", closeNoteSheet);
  document.querySelector(".note-sheet__backdrop").addEventListener("click", closeNoteSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("note-sheet").hidden) {
      closeNoteSheet();
    }
  });

  document.getElementById("download-kml").addEventListener("click", downloadKml);

  document.getElementById("reset-view").addEventListener("click", () => {
    applyFilter("all", { skipFit: true });
    applyBarrio("all");
    selectPlace("thompson");
  });

  document.getElementById("reset-edits").addEventListener("click", () => {
    const ok = window.confirm("Clear notes, hidden places, and places you added on this phone?");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    edits = { notes: {}, hidden: [], custom: [], dayNotes: {} };
    activeId = null;
    rebuildMarkers();
    renderDays();
    applyFilter("all");
    renderHidden();
  });

  const backToMap = document.getElementById("back-to-map");
  const mapPanel = document.getElementById("map-panel");
  function goToMap() {
    mapPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => map.invalidateSize(), 280);
  }
  backToMap.addEventListener("click", goToMap);
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(
      ([entry]) => {
        backToMap.hidden = entry.isIntersecting;
      },
      { threshold: 0.35 }
    );
    io.observe(mapPanel);
  }

  renderFilters();
  renderDays();
  renderTours();
  renderPhotoCredits();
  rebuildMarkers();
  applyFilter("all");
  renderHidden();

  const resize = () => map.invalidateSize();
  window.addEventListener("load", resize);
  window.addEventListener("resize", resize);
  setTimeout(resize, 200);
  setTimeout(resize, 800);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(document.getElementById("map"));
  }
})();
