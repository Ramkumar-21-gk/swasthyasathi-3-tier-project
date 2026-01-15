const express = require("express");
const cors = require("cors");

const helloRoutes = require("./routes/hello.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/hello", helloRoutes);


const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);


const medicineRoutes = require("./routes/medicine.routes");
app.use("/api/medicine", medicineRoutes);


module.exports = app;
