const { getMedicineByName } = require("../services/medicine.service");
const { processPrescriptionImage } = require("../services/prescription.service");
const { log } = require("../utils/logger");

const getMedicine = async (req, res) => {
  try {
    const { name } = req.query;
    log("🔹 Requested medicine name:", name);

    if (!name) {
      return res.status(400).json({ message: "Medicine name is required" });
    }

    const medicine = await getMedicineByName(name);
    res.json(medicine);
  } catch (error) {
  console.error("❌ Medicine fetch error STACK:", error.stack);
  res.status(500).json({
    message: error.message,
  });
}

};

module.exports = { getMedicine };
 
// POST /api/medicine/scan
const scanPrescription = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Image file is required (field: image)" });
    }

    log("🔹 Received prescription image:", {
      fieldname: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const result = await processPrescriptionImage(req.file.buffer);
    // result = { text, names: [..], medicines: [..] }
    return res.json(result);
  } catch (error) {
    console.error("❌ Prescription scan error STACK:", error.stack);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMedicine, scanPrescription };
