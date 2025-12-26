// store text copies for language switching
let medDetails = { en: "", hi: "" };

function showMedicineDetails() {
  const name = document.getElementById("searchBox").value.trim();

  if (name === "") {
    alert("Enter medicine name");
    return;
  }

  // show content panel
  document.getElementById("detailsContent").style.display = "block";

  // heading
  document.getElementById("medName").innerText = name;

  // English text
  medDetails.en = `${name}. This medicine is used for fever and pain relief. 
    Do not exceed the recommended dose. Consult a doctor if symptoms persist.`;

  // Hindi text
  medDetails.hi = `${name}। यह दवा बुखार और दर्द के इलाज में प्रयोग की जाती है।
    सुझाई गई मात्रा से अधिक न लें। यदि लक्षण बने रहें तो डॉक्टर से सलाह लें।`;

  // show English by default
  document.getElementById("medInfo").innerText = medDetails.en;

  // enable controls
  document.getElementById("langSelect").disabled = false;
  document.getElementById("listenBtn").disabled = false;
}

// language switch
function changeLanguage() {
  const lang = document.getElementById("langSelect").value;

  document.getElementById("medInfo").innerText =
    lang === "hi" ? medDetails.hi : medDetails.en;
}

// text-to-speech
function speakDetails() {
  const text = document.getElementById("medInfo").innerText;
  const lang = document.getElementById("langSelect").value;

  const speech = new SpeechSynthesisUtterance(text);

  speech.lang = lang === "hi" ? "hi-IN" : "en-IN";
  speech.rate = 1;
  speech.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}
