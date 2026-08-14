(function () {
  const { places: builtInPlaces, categories, map: mapConfig, days, tours } = window.GUIDE;
  const CAT_LABEL = Object.fromEntries(categories.map((c) => [c.id, c.label]));
  const STORAGE_KEY = "madrid-guide-edits-v1";

  const map = L.map("map", {
    scrollWheelZoom: true,
    tapTolerance: 24,
  }).setView(mapConfig.center, mapConfig.zoom);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  const markers = new Map();
  let activeId = null;
  let activeFilter = "all";
  let activeDay = days[0].id;
  let edits = loadEdits();

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
          ? `<a href="${escapeHtml(s.link)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`
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
          `<a class="card-link" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
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

  function popupHtml(place) {
    const warn = touristLabel(place);
    const closed = place.closed ? `<span class="badge badge-closed">Closed</span>` : "";
    const warnBadge = warn ? `<span class="badge badge-warn">${warn}</span>` : "";
    const yours = place.custom ? `<span class="badge badge-yours">Yours</span>` : "";
    const link = place.link
      ? `<a href="${escapeHtml(place.link)}" target="_blank" rel="noopener">${escapeHtml(place.linkLabel || "Link")}</a>`
      : "";
    const note = edits.notes[place.id];
    return `
      <div class="popup">
        <div class="badges">
          <span class="badge badge-cat ${place.category}">${CAT_LABEL[place.category] || place.category}</span>
          ${confidenceBadge(place)}
          ${yours}
          ${warnBadge}${closed}
        </div>
        <h3>${escapeHtml(place.name)}</h3>
        <p class="meta">${escapeHtml(place.neighborhood || "")}${place.address ? " · " + escapeHtml(place.address) : ""}</p>
        ${place.confidenceNote ? `<p class="confidence">${escapeHtml(place.confidenceNote)}</p>` : ""}
        <p>${escapeHtml(place.takeaway || "")}</p>
        ${place.walk ? `<p class="walk">${escapeHtml(place.walk)}</p>` : ""}
        ${shopList(place)}
        ${place.unnamed ? `<p class="unnamed">${escapeHtml(place.unnamed)}</p>` : ""}
        ${note ? `<p class="walk">Note: ${escapeHtml(note)}</p>` : ""}
        ${link}
        ${extraLinksHtml(place)}
        ${directionsButton(place)}
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

  function visiblePlaces() {
    return visibleCatalog().filter((p) => matchesFilter(p, activeFilter));
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
      marker.bindPopup(popupHtml(place), { maxWidth: 340, minWidth: 260, className: "place-popup" });
      marker.on("click", () => selectPlace(place.id, { fromMap: true }));
      markers.set(place.id, marker);
      if (matchesFilter(place, activeFilter)) marker.addTo(map);
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
    if (marker && place.lat != null && place.lng != null) {
      map.invalidateSize();
      if (!opts.fromMap) {
        document.querySelector(".map-panel").scrollIntoView({ behavior: "smooth", block: "center" });
        map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 16), { duration: 0.45 });
      }
      marker.setPopupContent(popupHtml(place));
      marker.openPopup();
    }
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (card && opts.fromMap) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function applyFilter(filter, opts = {}) {
    activeFilter = filter;
    document.querySelectorAll(".filter").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.cat === filter);
    });
    markers.forEach((marker, id) => {
      const place = findPlace(id);
      if (place && matchesFilter(place, filter) && !isHidden(id)) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    renderCards();
    const shown = visiblePlaces();
    const countEl = document.getElementById("places-count");
    const label = filter === "all" ? "all" : CAT_LABEL[filter] || filter;
    countEl.textContent = `${shown.length} place${shown.length === 1 ? "" : "s"} · ${label}`;
    if (!opts.skipFit) fitVisible(filter);
    map.invalidateSize();
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
  }

  function renderCards() {
    const wrap = document.getElementById("cards");
    wrap.innerHTML = visiblePlaces()
      .map((place) => {
        const warn = touristLabel(place);
        const link = place.link
          ? `<a class="card-link" href="${escapeHtml(place.link)}" target="_blank" rel="noopener">${escapeHtml(place.linkLabel || "Source")}</a>`
          : "";
        const note = edits.notes[place.id] || "";
        const removeBtn = place.custom
          ? `<button class="btn-quiet" type="button" data-delete="${escapeHtml(place.id)}">Delete</button>`
          : `<button class="btn-quiet" type="button" data-hide="${escapeHtml(place.id)}">Hide</button>`;
        return `
          <article class="card${place.closed ? " is-closed" : ""}${place.id === activeId ? " is-active" : ""}" data-id="${escapeHtml(place.id)}">
            <div class="card-top">
              <h3>${escapeHtml(place.name)}</h3>
              <div class="badges">
                <span class="badge badge-cat ${place.category}">${CAT_LABEL[place.category] || place.category}</span>
                ${confidenceBadge(place)}
                ${place.custom ? `<span class="badge badge-yours">Yours</span>` : ""}
                ${warn ? `<span class="badge badge-warn">${warn}</span>` : ""}
                ${place.closed ? `<span class="badge badge-closed">Closed</span>` : ""}
              </div>
            </div>
            <p class="meta">${escapeHtml(place.neighborhood || "")}${place.walk ? " · " + escapeHtml(place.walk) : ""}</p>
            ${place.confidenceNote ? `<p class="confidence">${escapeHtml(place.confidenceNote)}</p>` : ""}
            <p class="takeaway">${escapeHtml(place.takeaway || "")}</p>
            ${shopList(place)}
            ${place.unnamed ? `<p class="unnamed">${escapeHtml(place.unnamed)}</p>` : ""}
            ${link}
            ${extraLinksHtml(place)}
            <div class="card-actions">
              ${directionsButton(place)}
              ${removeBtn}
            </div>
            <label class="note-label">Note on this phone
              <textarea class="place-note" data-note-for="${escapeHtml(place.id)}" rows="2" placeholder="Hours, who liked it, what to order…">${escapeHtml(note)}</textarea>
            </label>
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
    const tabs = document.getElementById("day-tabs");
    tabs.innerHTML = days
      .map(
        (day) => `
        <button class="day-tab${day.id === activeDay ? " is-on" : ""}" type="button" role="tab" aria-selected="${day.id === activeDay}" data-day="${day.id}">
          ${escapeHtml(day.title)}
          <small>${escapeHtml(day.subtitle)}</small>
        </button>`
      )
      .join("");
    renderDaySlots();
  }

  function renderDaySlots() {
    const day = days.find((d) => d.id === activeDay) || days[0];
    document.getElementById("day-transit").textContent = day.transit;
    const wrap = document.getElementById("day-slots");
    wrap.innerHTML = day.slots
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
            <div class="day-slot__picks">${picks}</div>
            <label class="note-label">Note for this slot
              <textarea class="slot-note" data-day-note="${escapeHtml(noteKey)}" rows="2" placeholder="Only on this phone">${escapeHtml(edits.dayNotes[noteKey] || "")}</textarea>
            </label>
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

  document.getElementById("day-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".day-tab");
    if (!btn) return;
    activeDay = btn.dataset.day;
    renderDays();
  });

  document.getElementById("day-slots").addEventListener("click", (e) => {
    if (e.target.closest("textarea")) return;
    const pick = e.target.closest("[data-focus]");
    if (pick) {
      applyFilter("all", { skipFit: true });
      selectPlace(pick.dataset.focus);
      return;
    }
    const slot = e.target.closest(".day-slot");
    if (!slot) return;
    applyFilter("all", { skipFit: true });
    selectPlace(slot.dataset.placeId);
  });

  document.getElementById("day-slots").addEventListener("input", (e) => {
    const area = e.target.closest("[data-day-note]");
    if (!area) return;
    edits.dayNotes[area.dataset.dayNote] = area.value;
    saveEdits();
  });

  document.getElementById("cards").addEventListener("click", (e) => {
    if (e.target.closest("a, textarea, button")) return;
    const card = e.target.closest(".card");
    if (card) selectPlace(card.dataset.id);
  });

  document.getElementById("cards").addEventListener("input", (e) => {
    const area = e.target.closest("[data-note-for]");
    if (!area) return;
    edits.notes[area.dataset.noteFor] = area.value;
    saveEdits();
    const marker = markers.get(area.dataset.noteFor);
    const place = findPlace(area.dataset.noteFor);
    if (marker && place) marker.setPopupContent(popupHtml(place));
  });

  document.getElementById("places").addEventListener("click", (e) => {
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
      return;
    }
    const unhideBtn = e.target.closest("[data-unhide]");
    if (unhideBtn) {
      edits.hidden = edits.hidden.filter((x) => x !== unhideBtn.dataset.unhide);
      saveEdits();
      rebuildMarkers();
      applyFilter(activeFilter, { skipFit: true });
      renderHidden();
    }
  });

  document.getElementById("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("add-name").value.trim();
    const category = document.getElementById("add-category").value;
    const address = document.getElementById("add-address").value.trim();
    const latRaw = document.getElementById("add-lat").value.trim();
    const lngRaw = document.getElementById("add-lng").value.trim();
    const note = document.getElementById("add-note").value.trim();
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
      takeaway: note || "Added on this phone.",
      custom: true,
    };
    edits.custom.push(place);
    if (note) edits.notes[id] = note;
    saveEdits();
    e.target.reset();
    document.getElementById("add-category").value = "food";
    rebuildMarkers();
    applyFilter("all", { skipFit: true });
    renderHidden();
    selectPlace(id);
  });

  document.getElementById("reset-view").addEventListener("click", () => {
    applyFilter("all");
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

  renderFilters();
  renderDays();
  renderTours();
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
