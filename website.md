# Section 8 — Implementation and Code

This section contains important, representative code snippets used in the SwasthyaSathi project. Each snippet is followed by a concise technical explanation suitable for a blackbook (final year project) documentation.

## 8.1 Backend — Server Setup (Express)

```javascript
// backend/src/app.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import chatbotProxyRoutes from "./routes/chatbot.routes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// Infrastructure middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));

// Connect to MongoDB
await connectDB(process.env.MONGODB_URI);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api/chatbot", chatbotProxyRoutes);

// Health check
app.get("/api/hello", (req, res) => res.json({ ok: true, time: Date.now() }));

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
```

Explanation

- Bootstraps an Express server with common security and utility middleware: `helmet`, `cors`, `morgan`, `cookie-parser`. Connection to MongoDB is established via `connectDB`. Routes are modularized into `auth`, `medicine`, and `chatbot` sections; `errorHandler` consolidates error-to-response mapping. Body size limits and CORS origin are configured for safety and predictable behavior.

## 8.2 Routes — Auth and Medicine (representative)

```javascript
// backend/src/routes/auth.routes.js
import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.js";

const router = Router();

router.post("/register", validate("register"), register);
router.post("/login", validate("login"), login);
router.post("/logout", logout);
router.get("/me", validate("auth"), me); // JWT auth middleware

export default router;
```

```javascript
// backend/src/routes/medicine.routes.js
import { Router } from "express";
import multer from "multer";
import {
  scanPrescription,
  getMedicines,
} from "../controllers/medicine.controller.js";
import { storage, fileFilter } from "../config/multer.js";

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
const router = Router();

router.get("/", getMedicines);
router.post("/scan", upload.single("image"), scanPrescription);

export default router;
```

Explanation

- Routes are thin and declarative. Validation middleware centralizes schema enforcement. Multer is configured in `config/multer.js` to control upload storage, filename policy, allowed types and size limits. Controllers receive normalized inputs and handle HTTP response responsibilities.

## 8.3 Controllers — Auth & Medicine

```javascript
// backend/src/controllers/auth.controller.js
import * as authService from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, userId: user._id });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body,
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    res.json({
      accessToken,
      expiresIn: 3600,
      user: { id: user._id, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
```

```javascript
// backend/src/controllers/medicine.controller.js
import * as medService from "../services/medicine.service.js";

export async function scanPrescription(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    const result = await medService.scanPrescription(req.file, req.user?.id);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

export async function getMedicines(req, res, next) {
  try {
    const list = await medService.listMedicines(req.query);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}
```

Explanation

- Controllers handle HTTP-level semantics and error propagation. Business logic is delegated to services for testability and separation of concerns. File uploads are passed as `req.file` (Multer) for processing.

## 8.4 Services — Auth (bcrypt + JWT)

```javascript
// backend/src/services/auth.service.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TTL = "1h";
const REFRESH_TTL = "30d";

export async function register({ name, email, password }) {
  const exists = await User.findOne({ email }).lean();
  if (exists) throw new Error("Email already exists");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    roles: ["user"],
  });
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  const payload = { sub: user._id.toString(), roles: user.roles };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign(
    { jti: uuidv4(), sub: user._id.toString() },
    JWT_SECRET,
    { expiresIn: REFRESH_TTL },
  );
  return { accessToken, refreshToken, user };
}
```

Explanation

- Uses `bcrypt` to hash passwords (adaptive cost via `SALT_ROUNDS`). Issues a short-lived access JWT and a longer-lived refresh JWT. Services should persist refresh token identifiers (`jti`) when rotation/revocation is required.

## 8.5 MongoDB Schemas (Mongoose)

```javascript
// backend/src/models/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ["user"] },
    isVerified: { type: Boolean, default: false },
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
```

```javascript
// backend/src/models/medicine.model.js
import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    genericName: { type: String, index: true },
    brandAliases: { type: [String], default: [] },
    dosagePatterns: { type: [String], default: [] },
    indications: { type: [String], default: [] },
    price: { type: Number },
    availability: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medicineSchema.index({ name: "text", brandAliases: "text" });

export default mongoose.model("Medicine", medicineSchema);
```

```javascript
// backend/src/models/prescription.model.js
import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: { type: String, required: true },
    extractedText: { type: String },
    medicines: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
        name: String,
        dosage: String,
        quantity: Number,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Prescription", prescriptionSchema);
```

Explanation

- Schemas are designed for common query patterns. Indexes (unique email, text on medicine names) improve read performance. `Prescription` denormalizes identified medicine details for historical traceability.

## 8.6 OCR Implementation (Tesseract.js)

```javascript
// backend/src/services/ocr.service.js
import Tesseract from "tesseract.js";

export async function runOCR(filePath) {
  const worker = await Tesseract.createWorker({
    logger: (m) => console.debug("ocr", m),
  });
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  const { data } = await worker.recognize(filePath);
  await worker.terminate();
  return { text: data.text, words: data.words, confidence: data.confidence };
}
```

```javascript
// backend/src/services/medicine.service.js (excerpt)
import { runOCR } from "./ocr.service.js";
import Prescription from "../models/prescription.model.js";
import { normalizeTextToMedicines } from "./medicineNormalizer.service.js";

export async function scanPrescription(file, userId) {
  const ocrResult = await runOCR(file.path);
  const medicines = await normalizeTextToMedicines(ocrResult.text);
  const prescription = await Prescription.create({
    userId,
    imageUrl: `/uploads/${file.filename}`,
    extractedText: ocrResult.text,
    medicines,
  });
  return {
    prescriptionId: prescription._id,
    medicines,
    ocrConfidence: ocrResult.confidence,
  };
}
```

Explanation

- `tesseract.js` is used for server-side OCR; it exposes worker-based recognition. The OCR output (raw text and per-word confidence) is passed to a normalization service to map tokens to canonical medicine records. For production, consider cloud OCR services for higher accuracy and scalability.

## 8.7 AI Chatbot Integration (FastAPI + Groq)

```python
# AIChatbot/app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import httpx

app = FastAPI()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_ENDPOINT = 'https://api.groq.com/v1/engines/llama-3.1-8b-instant/completions'

class ChatRequest(BaseModel):
		user_id: str | None = None
		message: str

@app.post('/chat')
async def chat(req: ChatRequest):
		prompt = f"""You are SwasthyaSathi assistant. Provide educational non-diagnostic advice.\nUser: {req.message}\nAssistant:"""
		headers = {'Authorization': f'Bearer {GROQ_API_KEY}', 'Content-Type': 'application/json'}
		payload = {"prompt": prompt, "max_tokens": 512, "temperature": 0.2}
		async with httpx.AsyncClient(timeout=30) as client:
				r = await client.post(GROQ_ENDPOINT, headers=headers, json=payload)
		if r.status_code != 200:
				raise HTTPException(status_code=502, detail='LLM provider error')
		data = r.json()
		text = data.get('choices', [{}])[0].get('text', '').strip()
		return {"reply": text}
```

Explanation

- FastAPI exposes a `/chat` endpoint that constructs a controlled system prompt and forwards requests to the Groq LLM. Use low `temperature` to reduce hallucination; implement output safety checks and PII redaction before returning results. The Node backend may act as a proxy to centralize auth and rate-limiting.

## 8.8 Frontend — Fetch Examples

```javascript
// frontend/js/auth.js
async function login(email, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}
```

```javascript
// frontend/js/medicine.js
async function uploadPrescription(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/medicine/scan", {
    method: "POST",
    body: fd,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
```

Explanation

- `credentials: 'include'` is required if the server sets httpOnly cookies (refresh tokens). Access tokens may be set in `localStorage` (less secure) or stored in-memory; document trade-offs in your blackbook.

## 8.9 File Upload (Multer config)

```javascript
// backend/src/config/multer.js
import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(12).toString("hex");
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error("Invalid file type"), false);
  cb(null, true);
}

export { storage, fileFilter };
```

Explanation

- Disk storage with randomized filenames prevents collisions. File filter enforces image-only uploads. For production, store files in object storage (S3/GCS) and retain only references in DB.

## 8.10 Testing & Run Commands (concise)

```bash
# backend
cd backend
npm install
npm run dev

# AI service
cd AIChatbot
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# frontend
serve static files or open index.html locally
```

Explanation

- Use unit tests (`jest`, `pytest`) and integration tests (`supertest`, `httpx`) for API behavior. Use an isolated test database or in-memory MongoDB for CI.

---

End of Section 8.
