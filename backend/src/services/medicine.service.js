const Medicine = require("../models/medicine.model");
const ai = require("../config/gemini");
const { log } = require("../utils/logger");
const { normalizeMedicineWithAI } = require("./medicineNormalizer.service");


const buildGeminiPrompt = (medicineName) => `
You are a medical information extractor.

Return ONLY valid JSON in the following structure:

{
  "medicineName": "",
  "genericName": "",
  "category": "",
  "uses": [],
  "symptoms": [],
  "howToUse": "",
  "warnings": [],
  "sideEffects": [],
  "alternatives": [
    { "name": "", "type": "generic" }
  ]
}

Rules:
- Simple, non-technical language
- No dosage numbers
- No medical advice
- If unknown, use "Information not available"
- JSON only, no markdown

Medicine name: ${medicineName}
`;

const sanitizeAlternatives = (alternatives = []) => {
  if (!Array.isArray(alternatives)) return [];

  return alternatives
    .filter(a => a && typeof a.name === "string")
    .map(a => ({
      name: a.name.trim(),
      type: a.type === "branded" ? "branded" : "generic"
    }));
};


const getMedicineByName = async (inputName) => {

  // 1️⃣ AI normalization
  const normalized = await normalizeMedicineWithAI(inputName);

  if (!normalized) {
    throw new Error("Medicine not recognized");
  }

  const canonicalName =
  normalized.genericName || normalized.canonicalName;

  const normalizedKey = canonicalName.toLowerCase();

  log("🔹 Canonical name:", canonicalName);
  log("🔹 Normalized key:", normalizedKey);

  // 2️⃣ DB lookup
  const existing = await Medicine.findOne({ normalizedName: normalizedKey });
  if (existing) {
    log("🟢 Medicine served from DB cache:", normalizedKey);
    return existing;
  }

  // 3️⃣ Gemini full medicine generation (your existing logic)
  const prompt = buildGeminiPrompt(canonicalName);
  log("🔹 Gemini data prompt:", prompt);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text;
  log("🔹 Gemini raw response:", text);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON in Gemini medicine response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.medicineName) {
    throw new Error("Incomplete medicine data");
  }

  // 4️⃣ Store once, correctly
  const medicine = await Medicine.create({
    normalizedName: normalizedKey,
    medicineName: parsed.medicineName,
    genericName: parsed.genericName,
    category: parsed.category,
    uses: parsed.uses || [],
    symptoms: parsed.symptoms || [],
    howToUse: parsed.howToUse,
    warnings: parsed.warnings || [],
    sideEffects: parsed.sideEffects || [],
    alternatives: sanitizeAlternatives(parsed.alternatives),
  });

  return medicine;
};


module.exports = { getMedicineByName };
