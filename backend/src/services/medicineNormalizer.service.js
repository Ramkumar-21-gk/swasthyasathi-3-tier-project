const ai = require("../config/gemini");
const { log } = require("../utils/logger");

/**
 * Build prompt ONLY for medicine name normalization
 */
const buildNormalizationPrompt = (input) => `
You are a medicine name normalizer.

Analyze the user input and return ONLY valid JSON.

Input may contain:
- spelling mistakes
- dosage numbers (500, 650 mg)
- brand names
- extra words like tablet, capsule
- casing differences

Return JSON in this exact format:

{
  "canonicalName": "",
  "genericName": "",
  "confidence": "high | medium | low"
}

Rules:
- canonicalName must be the base medicine name (no dosage, no form)
- Use standard medical naming
- Do NOT include dosage numbers
- Do NOT explain anything outside JSON
- If not a medicine, use "unknown" and confidence "low"

User input: "${input}"
`;

/**
 * Extract JSON safely from Gemini output
 */
const extractJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
};

/**
 * Normalize medicine name using Gemini
 */
const normalizeMedicineWithAI = async (input) => {
  log("🟣 Normalizing medicine input:", input);

  const prompt = buildNormalizationPrompt(input);
  log("🟣 Normalization prompt:", prompt);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text;
  log("🟣 Normalization raw response:", text);

  const parsed = extractJSON(text);
  if (!parsed) {
    throw new Error("Failed to parse normalization response");
  }

  if (
    !parsed.canonicalName ||
    parsed.canonicalName === "unknown" ||
    parsed.confidence === "low"
  ) {
    return null;
  }

  return {
    canonicalName: parsed.canonicalName.trim(),
    genericName: parsed.genericName?.trim() || "",
  };
};

module.exports = { normalizeMedicineWithAI };
