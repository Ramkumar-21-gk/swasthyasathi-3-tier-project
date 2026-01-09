function disableLanguageControls() {
  document.getElementById("langSelect").disabled = true;
  document.getElementById("listenBtn").disabled = true;
}

function enableLanguageControls() {
  document.getElementById("langSelect").disabled = false;
  document.getElementById("listenBtn").disabled = false;
}

function translateToHindi(text) {
  const map = {
    "Generic Name": "सामान्य नाम",
    Category: "श्रेणी",
    Uses: "उपयोग",
    Symptoms: "लक्षण",
    "How to use": "कैसे लें",
    Warnings: "चेतावनी",
    "Side Effects": "दुष्प्रभाव",
    "Not available": "उपलब्ध नहीं",
  };

  let translated = text;
  for (let key in map) {
    translated = translated.replaceAll(key, map[key]);
  }
  return translated;
}

// Store raw API data (for future language support)
let currentMedicine = null;

async function showMedicineDetails() {
  disableLanguageControls();
  const name = document.getElementById("searchBox").value.trim();

  if (!name) {
    alert("Enter medicine name");
    return;
  }

  // UI reset
  document.getElementById("detailsContent").style.display = "block";
  document.getElementById("medName").innerText = name;
  document.getElementById("medInfo").innerHTML =
    "Fetching medicine information...";
  document.getElementById("langSelect").disabled = true;
  document.getElementById("listenBtn").disabled = true;

  try {
    const res = await fetch(
      `http://localhost:5000/api/medicine?name=${encodeURIComponent(name)}`
    );

    if (!res.ok) {
      throw new Error("Medicine not found");
    }

    const data = await res.json();
    currentMedicine = data;

    renderMedicineDetails(data);
    enableLanguageControls();
    renderAlternatives(data.alternatives || []);

    document.getElementById("langSelect").disabled = false;
    document.getElementById("listenBtn").disabled = false;
  } catch (err) {
    document.getElementById("medInfo").innerHTML =
      "<span class='text-danger'>Medicine information not available. Please consult a doctor.</span>";
    enableLanguageControls();
  }
}

function renderMedicineDetails(med) {
  document.getElementById("medName").innerText = med.medicineName;

  const html = `
    <div class="mb-3">
      <strong>Generic Name:</strong>
      <span>${med.genericName || "N/A"}</span>
    </div>

    <div class="mb-3">
      <strong>Category:</strong>
      <span>${med.category || "N/A"}</span>
    </div>

    <div class="mb-3">
      <strong>Uses:</strong>
      <ul>${listItems(med.uses)}</ul>
    </div>

    <div class="mb-3">
      <strong>Symptoms:</strong>
      <ul>${listItems(med.symptoms)}</ul>
    </div>

    <div class="mb-3">
      <strong>How to use:</strong>
      <p>${med.howToUse || "N/A"}</p>
    </div>

    <div class="mb-3 text-warning">
      <strong>Warnings:</strong>
      <ul>${listItems(med.warnings)}</ul>
    </div>

    <div class="mb-3">
      <strong>Side Effects:</strong>
      <ul>${listItems(med.sideEffects)}</ul>
    </div>
  `;

  document.getElementById("medInfo").innerHTML = html;
}

function renderAlternatives(alternatives) {
  const container = document.querySelector(".row.g-3.mt-1");
  container.innerHTML = "";

  if (!alternatives.length) {
    container.innerHTML = "<p class='text-muted'>No alternatives available</p>";
    return;
  }

  alternatives.forEach((alt) => {
    const card = document.createElement("div");
    card.className = "col-md-3";

    card.innerHTML = `
      <div class="alt-card">
        <img src="https://via.placeholder.com/200x140" class="alt-img">
        <h6 class="fw-bold mt-2">${alt.name}</h6>
        <small class="text-secondary">${alt.type} alternative</small>
      </div>
    `;

    container.appendChild(card);
  });
}

function listItems(arr = []) {
  if (!arr.length) return "<li>Not available</li>";
  return arr.map((i) => `<li>${i}</li>`).join("");
}

// Language switch (future-ready)
function changeLanguage() {
  if (!currentMedicine) return;

  const lang = document.getElementById("langSelect").value;
  renderMedicineDetails(currentMedicine);

  if (lang === "hi") {
    const content = document.getElementById("medInfo").innerHTML;
    document.getElementById("medInfo").innerHTML = translateToHindi(content);
  }
}

// Text-to-speech
function speakDetails() {
  const lang = document.getElementById("langSelect").value;
  const text = document.getElementById("medInfo").innerText;

  const speech = new SpeechSynthesisUtterance(text);

  speech.lang = lang === "hi" ? "hi-IN" : "en-IN";

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}
