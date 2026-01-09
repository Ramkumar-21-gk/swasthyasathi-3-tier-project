const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const avatar = document.querySelector("lottie-player");

function sendMessage() {
  if (!userInput.value.trim()) return;

  addMessage(userInput.value, "user");
  userInput.value = "";

  setTimeout(() => {
    addMessage(
      "I can provide general medical information. Please describe your symptoms or upload an image.",
      "bot"
    );
  }, 700);
}

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerText = text;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

/* Voice input */
function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice recognition not supported");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";

  avatar.setAttribute("speed", "1.3");
  recognition.start();

  recognition.onresult = (event) => {
    userInput.value = event.results[0][0].transcript;
  };

  recognition.onend = () => {
    avatar.setAttribute("speed", "1");
  };
}

/* Image upload */
document.getElementById("imageUpload").addEventListener("change", () => {
  addMessage("📷 Medical image uploaded for analysis.", "user");
});
