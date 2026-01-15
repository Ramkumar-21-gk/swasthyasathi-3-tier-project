const express = require("express");
const { getMedicine } = require("../controllers/medicine.controller");

const router = express.Router();

router.get("/", getMedicine);

module.exports = router;
