const express = require("express");
const router = express.Router();

// Symptom knowledge base
const symptoms = {
  "back pain": {
    causes: [
      "Muscle strain",
      "Poor posture",
      "Lack of exercise",
      "Disc problems",
    ],
    tips: [
      "Apply ice for 48 hours",
      "Use heat therapy after",
      "Do gentle stretches",
      "Maintain good posture",
    ],
    warning: [
      "Pain > 2 weeks",
      "Severe pain",
      "Leg numbness",
      "Fever with pain",
    ],
  },
  cough: {
    causes: ["Cold/flu", "Allergies", "Asthma", "Acid reflux"],
    tips: [
      "Stay hydrated",
      "Honey tea",
      "Gargle salt water",
      "Steam inhalation",
    ],
    warning: ["Cough > 3 weeks", "Blood in cough", "Chest pain", "High fever"],
  },
  headache: {
    causes: ["Stress", "Dehydration", "Eye strain", "Lack of sleep"],
    tips: [
      "Rest in dark room",
      "Cold compress",
      "Stay hydrated",
      "Sleep regularly",
    ],
    warning: [
      "Sudden severe headache",
      "Fever with headache",
      "Vision changes",
      "After head injury",
    ],
  },
  fever: {
    causes: ["Viral infection", "Bacterial infection", "Heat exhaustion"],
    tips: [
      "Rest well",
      "Drink lots of water",
      "Lukewarm bath",
      "Light clothing",
    ],
    warning: [
      "Temp > 103°F",
      "Fever > 3 days",
      "Difficulty breathing",
      "Severe headache",
    ],
  },
  "stomach pain": {
    causes: ["Indigestion", "Food poisoning", "Gastritis", "Constipation"],
    tips: [
      "Drink clear fluids",
      "Ginger tea",
      "Bland foods",
      "Avoid spicy food",
    ],
    warning: ["Severe pain", "Blood in stool", "Fever", "Hard abdomen"],
  },
  cold: {
    causes: ["Viral infection", "Weak immunity", "Weather changes"],
    tips: ["Rest well", "Warm fluids", "Steam inhalation", "Vitamin C foods"],
    warning: [
      "Symptoms > 10 days",
      "High fever",
      "Ear pain",
      "Breathing difficulty",
    ],
  },
  "sore throat": {
    causes: ["Viral infection", "Bacterial infection", "Allergies", "Dry air"],
    tips: ["Gargle salt water", "Honey tea", "Stay hydrated", "Use humidifier"],
    warning: ["Severe pain", "Fever > 101°F", "White patches", "Swollen neck"],
  },
};

// Find symptom in message
function findSymptom(message) {
  const msg = message.toLowerCase();

  for (let symptom in symptoms) {
    if (msg.includes(symptom)) return symptom;
  }

  // Check alternatives
  if (
    msg.includes("pain") &&
    (msg.includes("spine") || msg.includes("lower back"))
  )
    return "back pain";
  if (msg.includes("nose") || msg.includes("sneez")) return "cold";
  if (msg.includes("temperature") || msg.includes("bukhar")) return "fever";
  if (msg.includes("belly") || msg.includes("pet")) return "stomach pain";
  if (msg.includes("throat")) return "sore throat";

  return null;
}

// Generate response
function createResponse(symptom) {
  const info = symptoms[symptom];

  let response = `I understand you have ${symptom}. Here's what I can tell you:\n\n`;

  response += `🔍 Possible Causes:\n`;
  info.causes.forEach((c, i) => (response += `${i + 1}. ${c}\n`));

  response += `\n💡 Self-Care Tips:\n`;
  info.tips.forEach((t, i) => (response += `${i + 1}. ${t}\n`));

  response += `\n⚠️ See a Doctor If:\n`;
  info.warning.forEach((w, i) => (response += `${i + 1}. ${w}\n`));

  response += `\n🏥 Important: This is general advice only. Please consult a doctor for proper diagnosis.\n\nCan I help with anything else?`;

  return response;
}

// POST /api/chatbot/chat
router.post("/chat", (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const symptom = findSymptom(message);

    let response;
    if (symptom) {
      response = createResponse(symptom);
    } else {
      response = `I can help with these symptoms:\n\n• Back pain\n• Cough\n• Headache\n• Fever\n• Stomach pain\n• Cold\n• Sore throat\n\nPlease describe your symptoms in detail.\n\nFor serious issues, please consult a doctor immediately.`;
    }

    res.json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
