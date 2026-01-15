const { getMedicineByName } = require("../services/medicine.service");
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
