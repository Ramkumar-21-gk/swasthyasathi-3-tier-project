// GLOBAL STATE

let originalMedicineData = null;
let lastPrescriptionResults = [];

//UI HELPERS

function disableLanguageControls() {
  document.getElementById("langSelect").disabled = true;
  document.getElementById("listenBtn").disabled = true;
}

function enableLanguageControls() {
  document.getElementById("langSelect").disabled = false;
  document.getElementById("listenBtn").disabled = false;
}

function updateScanLimitUI() {
  const warning = document.getElementById("scanLimitWarning");
  const counter = document.getElementById("scanCountDisplay");

  if (!AuthConfig.isLoggedIn) {
    warning.style.display = "block";
    counter.textContent = AuthConfig.scanCount;
  } else {
    warning.style.display = "none";
  }
}

//LIBRETRANSLATE (SELF-HOSTED)

async function translateTextLibre(text, targetLang) {
  const res = await fetch("http://localhost:5001/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: "auto",
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

//BUILD TRANSLATION PAYLOAD

function buildTranslationPayload(med) {
  return {
    genericName: med.genericName || "N/A",
    category: med.category || "N/A",
    howToUse: med.howToUse || "N/A",
    uses: med.uses || [],
    symptoms: med.symptoms || [],
    warnings: med.warnings || [],
    sideEffects: med.sideEffects || [],
  };
}

async function translateArray(arr) {
  return Promise.all(arr.map((item) => translateTextLibre(item, "hi")));
}

//MAIN SEARCH FUNCTION
async function showMedicineDetails() {
  // Check scan limit for non-logged-in users
  if (!AuthConfig.isLoggedIn) {
    if (!AuthConfig.canScan) {
      alert(
        "🔒 You have reached your free scan limit (3 scans).\n\nLogin or register for unlimited scans and see medicine alternatives!"
      );
      return;
    }
  }

  disableLanguageControls();

  const name = document.getElementById("searchBox").value.trim();
  if (!name) {
    alert("Enter medicine name");
    enableLanguageControls();
    return;
  }

  document.getElementById("detailsContent").style.display = "block";
  document.getElementById("multiResults").style.display = "none";
  document.getElementById("medName").innerText = name;
  document.getElementById("medInfo").innerHTML =
    "Fetching medicine information...";

  try {
    const res = await fetch(
      `http://localhost:5000/api/medicine?name=${encodeURIComponent(name)}`
    );

    if (!res.ok) {
      throw new Error("Medicine not found");
    }

    const data = await res.json();

    // ⭐ Store original structured data
    originalMedicineData = data;

    await renderMedicineDetails(data, "en");
    renderAlternatives(data.alternatives || []);

    // Increment scan count and update UI
    if (!AuthConfig.isLoggedIn) {
      AuthConfig.incrementScan();
      updateScanLimitUI();
    }
  } catch (err) {
    document.getElementById("medInfo").innerHTML =
      "<span class='text-danger'>Medicine information not available. Please consult a doctor.</span>";
  }

  enableLanguageControls();
}

//PRESCRIPTION SCAN (IMAGE UPLOAD)

function openPrescriptionPicker() {
  const input = document.getElementById("prescriptionImage");
  if (input) input.click();
}

async function handlePrescriptionUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!AuthConfig.isLoggedIn && !AuthConfig.canScan) {
    alert(
      "🔒 You have reached your free scan limit (3 scans).\n\nLogin or register for unlimited scans and see medicine alternatives!"
    );
    event.target.value = "";
    return;
  }

  disableLanguageControls();
  document.getElementById("detailsContent").style.display = "none";
  const multi = document.getElementById("multiResults");
  multi.style.display = "block";
  multi.innerHTML = `<div class="text-muted">Uploading and scanning prescription...</div>`;
    const backBtn = document.getElementById("backToListBtn");
    if (backBtn) backBtn.style.display = "none";

  try {
    const form = new FormData();
    form.append("image", file);

    const res = await fetch("http://localhost:5000/api/medicine/scan", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error("Scan failed");
    const data = await res.json();
    // data = { text, names, medicines }
    lastPrescriptionResults = data.medicines || [];

    renderMultipleMedicinesList(lastPrescriptionResults);

    if (!AuthConfig.isLoggedIn) {
      AuthConfig.incrementScan();
      updateScanLimitUI();
    }
  } catch (err) {
    console.error(err);
    multi.innerHTML = `<div class='text-danger'>Failed to scan prescription. Please try again with a clearer image.</div>`;
  }

  // Reset file input so the same file can be chosen again later
  event.target.value = "";
  enableLanguageControls();
}

function renderMultipleMedicinesList(medicines) {
  const multi = document.getElementById("multiResults");
  if (!medicines || medicines.length === 0) {
    multi.innerHTML = `<div class='text-warning'>No medicines detected.</div>`;
    return;
  }

  const items = medicines
    .map((m, idx) => {
      const title = m.medicineName || m.normalizedName || `Medicine ${idx + 1}`;
      const sub = m.genericName ? ` <small class='text-secondary'>(Generic: ${m.genericName})</small>` : "";
      return `
        <div class="card mb-2" style="border-radius:12px;">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <strong>${title}</strong>${sub}
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="viewPrescriptionMedicine(${idx})">View details</button>
          </div>
        </div>`;
    })
    .join("");

  multi.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <h6 class="fw-bold mb-0">Detected Medicines</h6>
      <button class="btn btn-sm btn-link" onclick="document.getElementById('multiResults').style.display='none'" title="Hide list">Hide</button>
    </div>
    ${items}
  `;
}

async function viewPrescriptionMedicine(index) {
  const med = lastPrescriptionResults[index];
  if (!med) return;
  originalMedicineData = med;
  // Hide the list to focus on details view
  document.getElementById("multiResults").style.display = "none";
    const backBtn = document.getElementById("backToListBtn");
    if (backBtn) backBtn.style.display = "inline-block";
  document.getElementById("detailsContent").style.display = "block";
  document.getElementById("medName").innerText = med.medicineName || med.normalizedName || "Medicine";
  await renderMedicineDetails(med, document.getElementById("langSelect").value || "en");
  renderAlternatives(med.alternatives || []);
}

  function backToDetectedList() {
    const multi = document.getElementById("multiResults");
    const details = document.getElementById("detailsContent");
    const backBtn = document.getElementById("backToListBtn");
    if (multi) multi.style.display = "block";
    if (details) details.style.display = "none";
    if (backBtn) backBtn.style.display = "none";
  }

/***********************
 * RENDER MEDICINE DETAILS
 ***********************/
async function renderMedicineDetails(med, lang = "en") {
  let genericName = med.genericName || "N/A";
  let category = med.category || "N/A";
  let howToUse = med.howToUse || "N/A";
  let uses = med.uses || [];
  let symptoms = med.symptoms || [];
  let warnings = med.warnings || [];
  let sideEffects = med.sideEffects || [];

  if (lang === "hi") {
    genericName = await translateTextLibre(genericName, "hi");
    category = await translateTextLibre(category, "hi");
    howToUse = await translateTextLibre(howToUse, "hi");

    uses = await translateArray(uses);
    symptoms = await translateArray(symptoms);
    warnings = await translateArray(warnings);
    sideEffects = await translateArray(sideEffects);
  }
  if (lang === "ur") {
    genericName = await translateTextLibre(genericName, "ur");
    category = await translateTextLibre(category, "ur");
    howToUse = await translateTextLibre(howToUse, "ur");

    uses = await translateArray(uses);
    symptoms = await translateArray(symptoms);
    warnings = await translateArray(warnings);
    sideEffects = await translateArray(sideEffects);
  }

  const html = `
    <div class="mb-3">
      <strong>Generic Name:</strong>
      <span>${genericName}</span>
    </div>

    <div class="mb-3">
      <strong>Category:</strong>
      <span>${category}</span>
    </div>

    <div class="mb-3">
      <strong>Uses:</strong>
      <ul>${listItems(uses)}</ul>
    </div>

    <div class="mb-3">
      <strong>Symptoms:</strong>
      <ul>${listItems(symptoms)}</ul>
    </div>

    <div class="mb-3">
      <strong>How to use:</strong>
      <p>${howToUse}</p>
    </div>

    <div class="mb-3 text-warning">
      <strong>Warnings:</strong>
      <ul>${listItems(warnings)}</ul>
    </div>

    <div class="mb-3">
      <strong>Side Effects:</strong>
      <ul>${listItems(sideEffects)}</ul>
    </div>
  `;

  document.getElementById("medInfo").innerHTML = html;
}

// LANGUAGE SWITCH
async function changeLanguage() {
  const lang = document.getElementById("langSelect").value;

  if (!originalMedicineData) return;

  disableLanguageControls();

  try {
    await renderMedicineDetails(originalMedicineData, lang);
  } catch (err) {
    alert("Translation failed. Please try again.");
    console.error(err);
  }

  enableLanguageControls();
}

//ALTERNATIVES
function renderAlternatives(alternatives) {
  const container = document.querySelector(".row.g-3.mt-1");
  const section = document.getElementById("alternativesSection");

  // Hide alternatives section for non-logged-in users
  if (!AuthConfig.isLoggedIn) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
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

//UTILS
function listItems(arr = []) {
  if (!arr.length) return "<li>Not available</li>";
  return arr.map((i) => `<li>${i}</li>`).join("");
}

// TEXT TO SPEECH
function speakDetails() {
  const lang = document.getElementById("langSelect").value;
  const text = document.getElementById("medInfo").innerText;

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = lang === "hi" ? "hi-IN" : "en-IN";

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}
