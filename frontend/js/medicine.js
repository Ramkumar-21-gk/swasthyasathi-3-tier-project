let originalEnglishHTML = "";

function disableLanguageControls() {
  document.getElementById("langSelect").disabled = true;
  document.getElementById("listenBtn").disabled = true;
}

function enableLanguageControls() {
  document.getElementById("langSelect").disabled = false;
  document.getElementById("listenBtn").disabled = false;
}

async function translateTextLibre(text, targetLang) {
  const res = await fetch("http://localhost:5000/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: "en",
      target: targetLang,
      format: "text",
    }),
  });

  if (!res.ok) {
    throw new Error("Translation failed");
  }

  const data = await res.json();
  return data.translatedText;
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

  originalEnglishHTML = html; // ⭐ store original
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
async function changeLanguage() {
  const lang = document.getElementById("langSelect").value;
  const medInfo = document.getElementById("medInfo");

  // Always restore English first
  medInfo.innerHTML = originalEnglishHTML;

  if (lang === "en") return;

  disableLanguageControls();

  try {
    const plainText = medInfo.innerText;
    const translated = await translateTextLibre(plainText, "hi");
    medInfo.innerText = translated;
  } catch (err) {
    alert("Hindi translation failed. Please try again.");
  }

  enableLanguageControls();
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
