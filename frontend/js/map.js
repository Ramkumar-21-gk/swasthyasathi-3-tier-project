let map;
let markers = [];

function initMap() {
  map = L.map("map").setView([19.076, 72.8777], 14); // Mumbai

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  map.on("click", (e) => {
    fetchMedicalStores(e.latlng.lat, e.latlng.lng);
  });


  fetchMedicalStores(19.076, 72.8777);
}
// Search location using OpenStreetMap Nominatim (FREE)
function searchLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data.length) {
        alert("Location not found");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      map.setView([lat, lng], 14);
      fetchMedicalStores(lat, lng);
    })
    .catch(() => {
      alert("Search failed. Try again.");
    });
}

// Handle search form submit (Enter or button)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchBox");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    searchLocation(query);
  });
});


// Get user location
function getUserLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    map.setView([lat, lng], 14);
    fetchMedicalStores(lat, lng);
  });
}

// Fetch pharmacies using Overpass API
function fetchMedicalStores(lat, lng) {
  clearMarkers();
  document.getElementById("storeList").innerHTML = "";

  const query = `
    [out:json];
    (
      node["amenity"="pharmacy"](around:3000,${lat},${lng});
      way["amenity"="pharmacy"](around:3000,${lat},${lng});
    );
    out center;
  `;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  })
    .then((res) => res.json())
    .then((data) => {
      data.elements.forEach((place) => {
        const pLat = place.lat || place.center.lat;
        const pLng = place.lon || place.center.lon;

        const name = place.tags.name || "Medical Store";
        const address = buildAddress(place.tags);

        const marker = L.marker([pLat, pLng]).addTo(map);

        // 👉 Popup with name + address
        marker.bindPopup(`
          <strong>${name}</strong><br>
          <small>${address}</small>
        `);

        markers.push(marker);

        addStoreToList(name, address, pLat, pLng);

      });
    });
}

// Store list UI
function addStoreToList(name, address, lat, lng) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    name
  )}&query_place_id=${lat},${lng}`;

  const div = document.createElement("div");
  div.className = "card mb-2 store-card";
  div.style.cursor = "pointer";

  div.innerHTML = `
    <div class="card-body">
      <h6 class="mb-1">${name}</h6>
      <small class="text-muted">${address}</small>
    </div>
  `;

  div.addEventListener("click", () => {
    window.open(
      `https://www.google.com/maps?q=${encodeURIComponent(name)}@${lat},${lng}`,
      "_blank"
    );
  });

  document.getElementById("storeList").appendChild(div);
}



// Clear markers
function clearMarkers() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
}

function buildAddress(tags = {}) {
  const parts = [];

  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);

  return parts.length ? parts.join(", ") : "Address not available";
}
