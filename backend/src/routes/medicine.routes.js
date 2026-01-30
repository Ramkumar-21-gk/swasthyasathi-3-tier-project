const express = require("express");
const multer = require("multer");
const { getMedicine, scanPrescription } = require("../controllers/medicine.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getMedicine);

// Upload field name should be 'image'
router.post("/scan", upload.single("image"), scanPrescription);

module.exports = router;
