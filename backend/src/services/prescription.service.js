const Tesseract = require("tesseract.js");
const ai = require("../config/gemini");
const { log } = require("../utils/logger");
const { checkDBorAI } = require("./medicine.service");

const buildExtractionPrompt = (ocrText) => `
You are a medical prescription analyzer.

Task: From the following OCR extracted text of a PRINTED prescription (not handwritten), extract all medicine names present. Normalize them to their base names (no dosage numbers, no forms like tablet/syrup/capsule), and return ONLY a single line of comma-separated medicine names.

Rules:
- Include only valid medicine names that appear in the text
- Remove dosage and form information (e.g., 500 mg, tablet, syrup)
- If a brand appears, return its normalized base/generic medicine name
- Do not explain anything else
- If none present, return an empty string

OCR Text:
"""
${ocrText}
"""
`;

const extractJSONorText = (text) => {
  if (!text) return "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.medicines === "string") return parsed.medicines;
    } catch (_) {
      // fallthrough
    }
  }
  return String(text).trim();
};

const splitCSVNames = (line) => {
  if (!line) return [];
  return line
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((v, i, a) => a.indexOf(v) === i);
};

const ocrExtractText = async (buffer) => {
    try {
      const { data } = await Tesseract.recognize(buffer, "eng");
      return data.text || "";
  } catch (err) {
    console.error("OCR FAILED:", err);
    throw err;
  }

};

const processPrescriptionImage = async (buffer) => {
  log("🟣 OCR: Starting text extraction from image");
  const text = await ocrExtractText(buffer);
  log("🟣 OCR: Extracted text length:", text.length);

  const prompt = buildExtractionPrompt(text);
  log("🟣 Extraction prompt built");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const raw = response.text;
  log("🟣 Extraction raw response:", raw);

  const line = extractJSONorText(raw);
  const names = splitCSVNames(line);
  log("🟣 Normalized medicine names:", names);

  const medicines = [];
  for (const name of names) {
    try {
      const med = await checkDBorAI(name, name);
      medicines.push(med);
    } catch (err) {
      log("⚠️ Failed to resolve medicine:", name, err.message);
    }
  }

  return { text, names, medicines };
};

module.exports = { processPrescriptionImage };
