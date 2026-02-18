// Open camera or file picker
function openScanner() {
  document.getElementById("medicineImage").click();
}

// Handle image selection
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Show loading in search box
  const searchBox = document.getElementById("searchBox");
  searchBox.value = "🔍 Scanning medicine name...";

  try {
    const text = await extractTextFromImage(file);
    const medicineName = cleanMedicineText(text);

    if (!medicineName) {
      alert("Could not detect medicine name. Try a clearer image.");
      searchBox.value = "";
      return;
    }

    // Put detected name in search box
    searchBox.value = medicineName;

    // Automatically search
    showMedicineDetails();
  } catch (err) {
    console.error(err);
    alert("OCR failed. Try aga  in.");
    searchBox.value = "";
  }
}

// Run OCR using Tesseract.js
async function extractTextFromImage(file) {
  const worker = await Tesseract.createWorker("eng");

  const { data } = await worker.recognize(file);
  await worker.terminate();

  return data.text;
}

// Clean OCR text to extract likely medicine name
function cleanMedicineText(text) {
  console.log("Raw OCR Text:", text);

  // Convert to lines
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  // Try to find a medicine-like line
  for (let line of lines) {
    // Ignore numbers, dates, batch no, etc.
    if (/^\d+$/.test(line)) continue;
    if (line.toLowerCase().includes("batch")) continue;
    if (line.toLowerCase().includes("mfg")) continue;
    if (line.toLowerCase().includes("exp")) continue;

    // Assume first valid line is medicine name
    return line;
  }

  return null;
}
