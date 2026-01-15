const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    medicineName: {
      type: String,
      required: true
    },
    genericName: String,
    category: String,
    uses: [String],
    symptoms: [String],
    howToUse: String,
    warnings: [String],
    sideEffects: [String],
    alternatives: [
      {
        name: String,
        type: {
          type: String,
          enum: ["generic", "branded"]
        }
      }
    ],
    source: {
      type: String,
      default: "gemini"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
