# Swasthya Sathi - Software Requirements Specification (SRS)

## Document Information

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| **Project Name**  | Swasthya Sathi (Your Digital Health Partner) |
| **Document Type** | Software Requirements Specification          |
| **Version**       | 1.0                                          |
| **Date**          | February 2026                                |
| **Status**        | Complete                                     |
| **Prepared By**   | Development Team                             |
| **Reviewed By**   | Project Manager                              |

---

## 1. Executive Summary

Swasthya Sathi is a comprehensive, multi-tier healthcare web application designed to empower users with accessible digital health management tools. The system provides symptom assessment, medicine information retrieval, prescription analysis via OCR, location-based medical store discovery, and AI-powered health chatbot services. This SRS defines all functional and non-functional requirements for the complete system.

---

## 2. Document Purpose and Scope

### 2.1 Purpose

This SRS document defines:

- Functional requirements for each system component
- Non-functional requirements (performance, security, usability)
- System constraints and dependencies
- Acceptance criteria for testing
- User interfaces and interactions

### 2.2 Scope

**In Scope:**

- Web-based frontend application
- RESTful backend API (Node.js + Express)
- AI chatbot service (Python + FastAPI)
- User authentication and authorization
- Medicine database management
- Prescription scanning with OCR
- Location-based services (nearby stores)

**Out of Scope:**

- Mobile native applications (future release)
- Telemedicine/video consultation features
- Prescription generation
- Insurance claim processing
- Doctor appointment scheduling

---

## 3. Overview

### 3.1 Product Vision

To create an accessible, secure, and intelligent healthcare platform that:

- Provides symptom guidance and health information
- Helps users identify and access medicines
- Leverages AI for personalized health conversations
- Maintains user privacy and data security
- Offers intuitive, responsive user interfaces

### 3.2 Key Features

1. User authentication and profile management
2. Symptom-based health chatbot
3. Medicine database and search
4. Prescription image scanning (OCR)
5. Nearby medical stores location finder
6. Multi-modal input (text, audio, images)
7. Responsive design (desktop/mobile)

---

## 4. Functional Requirements

### 4.1 User Management Module

#### FR 4.1.1 User Registration

- **Description:** New users can create an account with email and password
- **Actors:** Unauthenticated user
- **Precondition:** User is on the registration page
- **Steps:**
  1. User enters name, email, and password
  2. System validates email format (RFC 5322)
  3. System checks email uniqueness in database
  4. System hashes password using bcrypt (salt rounds: 10)
  5. System stores user record in MongoDB
- **Postcondition:** User account is created; user can login
- **Error Handling:**
  - Duplicate email → Display "Email already registered"
  - Invalid email format → Display "Invalid email format"
  - Weak password → Display password requirements
  - Database connection error → Display "Server error, please try again"
- **Acceptance Criteria:**
  - User can register with valid credentials
  - Password is securely hashed (bcrypt)
  - Email validation enforced
  - Duplicate email prevention
  - User redirected to login page after success

#### FR 4.1.2 User Login

- **Description:** Registered users can authenticate and access the system
- **Actors:** Registered user
- **Precondition:** User has valid credentials
- **Steps:**
  1. User enters email and password on login page
  2. System queries MongoDB for matching user
  3. System compares provided password with stored hash
  4. On match: Create session/token and redirect to dashboard
  5. On mismatch: Display error message
- **Postcondition:** User is authenticated and logged in
- **Error Handling:**
  - User not found → Display "Invalid email or password"
  - Password mismatch → Display "Invalid email or password"
  - Database error → Display "Login service unavailable"
- **Acceptance Criteria:**
  - Successful login with valid credentials
  - Failure on invalid credentials
  - Session persistence across browser refresh
  - Logout clears session

#### FR 4.1.3 User Profile Management

- **Description:** Users can view and edit their profile information
- **Actors:** Authenticated user
- **Precondition:** User is logged in
- **Functions:**
  - View name, email, registration date
  - Update name (optional)
  - Option to reset password
- **Acceptance Criteria:**
  - Users can view profile data
  - Profile updates are persisted
  - Password reset link sent to email (future)

#### FR 4.1.4 OAuth Integration (Google)

- **Description:** Users can sign in using Google account
- **Actors:** Unauthenticated user
- **Steps:**
  1. User clicks "Sign In with Google" button
  2. Redirects to Google OAuth consent screen
  3. User grants permissions
  4. System receives authorization code
  5. Backend exchanges code for tokens
  6. System checks/creates user in database
  7. User is logged in and redirected to dashboard
- **Error Handling:**
  - OAuth failure → Redirect to login with error message
  - User creation failure → Attempt re-authentication
- **Acceptance Criteria:**
  - OAuth login flow completes successfully
  - User is created if first-time login
  - Existing users are recognized
  - Session established post-OAuth

---

### 4.2 Medicine Module

#### FR 4.2.1 Medicine Database Retrieval

- **Description:** System provides access to a comprehensive medicine database
- **Actors:** Authenticated user
- **API Endpoint:** `GET /api/medicine`
- **Query Parameters:** (optional)
  - `name` - Search by medicine name (case-insensitive, partial match)
  - `page` - Pagination (default: 1)
  - `limit` - Results per page (default: 20, max: 100)
- **Response:** JSON array with medicine objects
  ```json
  {
    "medicines": [
      {
        "id": "med_123",
        "name": "Paracetamol 500mg",
        "genericName": "Acetaminophen",
        "manufacturer": "XYZ Pharma",
        "dosage": "500mg tablet",
        "indication": "Pain, fever relief",
        "sideEffects": ["Allergic reaction", "Liver damage (overdose)"],
        "price": 25.5,
        "availability": true
      }
    ],
    "total": 1500,
    "page": 1,
    "limit": 20
  }
  ```
- **Error Handling:**
  - Invalid query → Ignore invalid parameters
  - Database error → Return 500 with error message
- **Acceptance Criteria:**
  - Database contains ≥500 medicines
  - Search is case-insensitive
  - Pagination works correctly
  - Response time < 500ms

#### FR 4.2.2 Prescription Image Scanning (OCR)

- **Description:** Users can upload prescription images to extract medicine information
- **Actors:** Authenticated user
- **API Endpoint:** `POST /api/medicine/scan`
- **Input:** Multipart form data with image file
  - Accepted formats: JPG, PNG, JPEG (max 5MB)
- **Processing:**
  1. Server receives image via Multer
  2. Tesseract.js extracts text from image
  3. Medicine Normalizer Service parses extracted text
  4. System queries medicine database for matches
  5. Returns matched medicines with confidence scores
- **Response:**
  ```json
  {
    "extractedText": "Paracetamol 500mg twice daily\nAmoxicillin 250mg thrice daily",
    "medicines": [
      {
        "name": "Paracetamol 500mg",
        "confidence": 0.95,
        "dosage": "Twice daily",
        "medicineId": "med_123"
      },
      {
        "name": "Amoxicillin 250mg",
        "confidence": 0.92,
        "dosage": "Thrice daily",
        "medicineId": "med_456"
      }
    ],
    "processingTime": 2500
  }
  ```
- **Error Handling:**
  - File too large → "File must be ≤5MB"
  - Invalid format → "Only JPG/PNG/JPEG supported"
  - OCR failure → "Could not read prescription, please try clearer image"
  - No medicine detected → "No medicines recognized in image"
- **Acceptance Criteria:**
  - Image upload and validation works
  - OCR accuracy ≥85% on clear images
  - Processing time < 5 seconds
  - Extracted text is editable by user
  - Matches medicines from database

#### FR 4.2.3 Medicine Information Display

- **Description:** System displays detailed information for each medicine
- **Actors:** Any user (authenticated or guest)
- **Information Displayed:**
  - Generic name, brand name, manufacturer
  - Dosage forms and strengths
  - Indications (uses)
  - Side effects
  - Contraindications
  - Price range
  - Availability status
  - User reviews (future enhancement)
- **Acceptance Criteria:**
  - All medicine fields display correctly
  - Information is accurate and current
  - UI is clean and readable

---

### 4.3 Chatbot Module

#### FR 4.3.1 Text-Based Symptom Chat

- **Description:** Users can describe symptoms and receive health guidance via text
- **Actors:** Any user
- **API Endpoint:** `POST /api/chatbot/chat`
- **Input:**
  ```json
  {
    "message": "I have a sore throat and cough for 3 days"
  }
  ```
- **Processing:**
  1. Backend receives text message
  2. Makes POST request to Python FastAPI chatbot service
  3. FastAPI forwards to Groq LLM (llama-3.1-8b-instant)
  4. LLM processes with system prompt (medical assistant, educational, non-diagnostic)
  5. Returns response
- **Response:**
  ```json
  {
    "reply": "A sore throat with cough could indicate a viral infection like common cold or throat infection. Consider: rest, hydration, lozenges, and warm drinks. If symptoms persist beyond 7 days or worsen, consult a doctor.",
    "confidence": "informational"
  }
  ```
- **Conversational Context:** (Future - conversation history)
  - Maintain last 5-10 messages
  - Include user context in prompts
- **Safety Guardrails:**
  - No medical diagnosis provided
  - Explicit disclaimer on all responses
  - Recommend professional consultation for serious symptoms
  - HIPAA-compliant (patient data not logged)
- **Accepted Symptoms:** Back pain, cough, headache, fever, stomach pain, cold, sore throat (extensible)
- **Error Handling:**
  - Empty message → "Please enter a message"
  - LLM API failure → "Chatbot unavailable, please try again"
  - Timeout (>30s) → "Response timeout, please try again"
- **Acceptance Criteria:**
  - Responses generated within 3 seconds
  - Responses are relevant to symptoms
  - No medical diagnosis offered
  - Responses include safety disclaimers

#### FR 4.3.2 Audio Input (Speech-to-Text)

- **Description:** Users can ask health questions via voice
- **Actors:** Any user with microphone
- **Input:** Audio file or live recording (WebAudio API)
  - Formats: WAV, MP3, WebM, FLAC
  - Duration: 1 second to 2 minutes
- **Processing:**
  1. Frontend records audio (via browser MediaRecorder API)
  2. Audio sent as FormData to FastAPI service
  3. Groq Whisper API transcribes audio to text
  4. Transcribed text processed same as text input
- **Response:** Same as FR 4.3.1
- **Error Handling:**
  - No audio captured → "Please record audio and try again"
  - Whisper API failure → "Could not transcribe audio"
  - Unrecognizable audio → "Audio quality too poor"
  - Timeout → "Audio processing took too long"
- **Acceptance Criteria:**
  - Audio recording works on supported browsers
  - Transcription accuracy ≥90%
  - Fallback to text input available

#### FR 4.3.3 Image Analysis (Medical Images)

- **Description:** Users can upload medical images for analysis and explanation
- **Actors:** Authenticated user
- **Input:** Image file (JPG, PNG, JPEG, max 5MB)
- **Processing:**
  1. Frontend sends image as FormData to FastAPI
  2. Image encoded to base64
  3. Groq Vision LLM analyzes image
  4. LLM (meta-llama/llama-4-scout-17b-16e-instruct) generates non-diagnostic explanation
  5. Text-to-speech conversion (gTTS)
- **Response:**
  ```json
  {
    "reply": "This medical image shows... [description of visual findings]. However, this is educational information only and not a diagnosis. Please consult a healthcare professional.",
    "audio_url": "/static/audio_<uuid>.mp3"
  }
  ```
- **Safety:** Educational explanation only, explicit non-diagnostic disclaimer
- **Error Handling:**
  - File too large → "Image must be ≤5MB"
  - Invalid format → "Only JPG/PNG/JPEG supported"
  - Vision API failure → "Could not analyze image"
- **Acceptance Criteria:**
  - Image upload and processing works
  - Analysis is accurate and educational
  - No diagnosis is provided
  - Audio response generated

#### FR 4.3.4 Text-to-Speech (Audio Response)

- **Description:** System converts chatbot responses to audio
- **Actors:** Any user
- **Technology:** gTTS (Google Text-to-Speech)
- **Languages:** English (primary), others (future)
- **Audio Properties:**
  - Format: MP3
  - Bitrate: 192 kbps
  - Speed: Normal (1.0x)
- **Playback:** HTML5 audio player on frontend
- **Error Handling:**
  - TTS generation failure → "Could not generate audio"
  - Playback failure → "Audio playback not supported"
- **Acceptance Criteria:**
  - Audio generated for text responses
  - Audio quality is clear
  - Playback works on all modern browsers
  - Performance impact minimal

---

### 4.4 Location Services Module

#### FR 4.4.1 Nearby Medical Stores

- **Description:** Users can find nearby pharmacies and medical stores
- **Actors:** Any user
- **API Endpoint:** `GET /api/stores/nearby`
- **Input Parameters:**
  - `latitude` - User's latitude (required)
  - `longitude` - User's longitude (required)
  - `radius` - Search radius in km (default: 5, max: 50)
- **Processing:**
  1. Frontend requests geolocation from browser
  2. Gets user's coordinates
  3. Queries Google Maps API
  4. Filters for pharmacies, medical stores, drugstores
  5. Returns list with distance and ratings
- **Response:**
  ```json
  {
    "stores": [
      {
        "id": "place_123",
        "name": "City Pharmacy",
        "address": "123 Main St",
        "distance": 0.5,
        "rating": 4.5,
        "phone": "+1-XXX-XXX-XXXX",
        "openNow": true,
        "coordinates": { "lat": 40.7128, "lng": -74.006 }
      }
    ],
    "count": 12
  }
  ```
- **Map Display:**
  - Google Maps embedded in frontend
  - Markers for each store
  - Info windows with details
  - Direction links
- **Error Handling:**
  - Geolocation denied → "Please enable location access"
  - Invalid coordinates → "Invalid location"
  - Google Maps API failure → "Map service unavailable"
- **Acceptance Criteria:**
  - Geolocation works correctly
  - Stores returned within radius
  - Map displays accurately
  - Performance < 2 seconds

---

### 4.5 User Interface & Navigation

#### FR 4.5.1 Responsive Web Design

- **Description:** Application is fully responsive on all screen sizes
- **Breakpoints:**
  - Mobile: 320px - 640px
  - Tablet: 641px - 1024px
  - Desktop: 1025px+
- **Framework:** Bootstrap 5
- **Features:**
  - Flexible layouts
  - Touch-friendly buttons (≥48px)
  - Readable font sizes
  - Optimized images
- **Acceptance Criteria:**
  - All pages render correctly on mobile/tablet/desktop
  - Touch interactions work on mobile
  - No horizontal scrolling (except necessary)
  - Page load time < 3s on 4G

#### FR 4.5.2 Navigation & Routing

- **Description:** Intuitive navigation across all pages
- **Pages:**
  - Home/Dashboard
  - Login/Register
  - User Profile
  - Medicine Database
  - Medicine Scanner
  - Chatbot
  - Nearby Stores
  - News/Articles (future)
- **Navigation Elements:**
  - Top navbar with logo and menu
  - Footer with links and info
  - Breadcrumbs on sub-pages
  - Active page highlighting
- **Acceptance Criteria:**
  - All pages accessible via navigation
  - Navlinks highlight current page
  - Navigation works on all screen sizes
  - Deep linking works

#### FR 4.5.3 Form Validation

- **Description:** Client and server-side form validation
- **Forms:**
  - Registration form
  - Login form
  - Medicine search form
  - Chatbot input
  - Location input
- **Validation Rules:**
  - Required field checks
  - Email format validation (RFC 5322)
  - Password strength (min 8 chars, uppercase, number, special char)
  - File type/size validation
  - Trim whitespace
- **Error Messages:** Clear, actionable, inline
- **Acceptance Criteria:**
  - Invalid inputs rejected with clear messages
  - Valid inputs accepted
  - Both client and server validation working

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

| Requirement       | Target      | Measurement                |
| ----------------- | ----------- | -------------------------- |
| Page Load Time    | < 3 seconds | Lighthouse Score ≥80       |
| API Response Time | < 500ms     | 95th percentile            |
| OCR Processing    | < 5 seconds | Per image                  |
| LLM Response      | < 3 seconds | Per query                  |
| Database Query    | < 100ms     | Per single query           |
| Concurrent Users  | 1000+       | With proper infrastructure |
| Memory Usage      | < 250MB     | Per application instance   |

### 5.2 Scalability Requirements

- **Horizontal Scaling:** Backend APIs stateless, deployable on multiple servers
- **Database Scaling:** MongoDB replication and sharding support
- **Load Balancing:** Support for load balancers (Nginx, AWS ELB)
- **Caching:** Redis support for session and data caching
- **CDN:** Static assets deliverable via CDN
- **Growth Capacity:** Handle 10x user growth without architecture changes

### 5.3 Reliability & Availability

| Requirement                  | Target          |
| ---------------------------- | --------------- |
| System Uptime                | 99.5%           |
| Mean Time to Recovery (MTTR) | < 15 minutes    |
| Data Backup Frequency        | Every 24 hours  |
| Backup Retention             | 30 days         |
| Disaster Recovery Plan       | Yes, documented |

### 5.4 Security Requirements

#### FR 5.4.1 Authentication & Authorization

- **Requirement:** Only authenticated users access protected resources
- **Methods:**
  - Email/password with bcrypt hashing
  - OAuth 2.0 (Google)
  - Session/token-based authentication (future: JWT)
- **Password Policy:**
  - Minimum 8 characters
  - Mix of uppercase, lowercase, numbers, special characters
  - No common passwords (dictionary check)
  - Expire credentials after 90 days (future)
- **Acceptance Criteria:**
  - Unauthorized requests rejected (401)
  - Protected endpoints require authentication
  - Password hashed with bcrypt (salt: 10)

#### FR 5.4.2 Data Protection

- **Encryption in Transit:** HTTPS/TLS 1.2+ for all communications
- **Encryption at Rest:** MongoDB encryption enabled
- **Sensitive Data Handling:**
  - No passwords in logs
  - No medical history in plain text logs
  - PII masked in error messages
- **Acceptance Criteria:**
  - All traffic encrypted
  - Database encryption enabled
  - No sensitive data in logs

#### FR 5.4.3 Input Validation & Sanitization

- **Requirement:** Prevent injection attacks (SQL, NoSQL, XSS)
- **Methods:**
  - Server-side input validation on all endpoints
  - Mongoose schema validation
  - Parameterized queries
  - Output encoding
- **File Upload Security:**
  - Type validation (whitelist allowed types)
  - Size limits (5MB max)
  - Antivirus scanning (future)
  - Sandboxed processing
- **Acceptance Criteria:**
  - XSS attempts blocked
  - Injection attacks prevented
  - File uploads validated

#### FR 5.4.4 HIPAA & Data Privacy Compliance

- **Requirement:** Protect patient health information
- **Measures:**
  - Access logs maintained
  - User data encrypted
  - Audit trails for data access
  - Right to be forgotten (GDPR)
  - Consent management
- **Disclaimers:**
  - Not a medical device
  - Educational content only
  - Not HIPAA-certified (current version)
  - Regular security audits (future)
- **Acceptance Criteria:**
  - Privacy policy published
  - Terms of service defined
  - User consent collected
  - Data handling documented

#### FR 5.4.5 Rate Limiting & DDoS Protection

- **Requirement:** Prevent abuse and DoS attacks
- **Implementation:**
  - API rate limiting: 100 requests/minute per user
  - Brute force protection: 5 failed login attempts → 15 min lockout
  - CAPTCHA on login after 3 failures (future)
  - WAF rules for common attacks
- **Acceptance Criteria:**
  - Rate limits enforced
  - Brute force attempts blocked
  - Error responses don't reveal info

### 5.5 Usability Requirements

| Requirement    | Description                           | Acceptance Criteria                     |
| -------------- | ------------------------------------- | --------------------------------------- |
| Learnability   | New users understand system in <5 min | Success rate ≥90% on first use          |
| Accessibility  | WCAG 2.1 AA compliance                | Lighthouse accessibility ≥90            |
| Error Recovery | Users can recover from errors easily  | Clear error messages + instructions     |
| Consistency    | UI patterns consistent across app     | Same components look/behave identically |
| Responsiveness | Immediate feedback on actions         | < 200ms perceived response              |

### 5.6 Compatibility Requirements

#### Browser Compatibility

| Browser | Version | Support       |
| ------- | ------- | ------------- |
| Chrome  | 90+     | Full          |
| Firefox | 88+     | Full          |
| Safari  | 14+     | Full          |
| Edge    | 90+     | Full          |
| IE 11   | Any     | Not supported |

#### Device Compatibility

- **Desktop:** Windows, macOS, Linux
- **Mobile:** iOS Safari (14+), Android Chrome (90+)
- **Tablets:** iPad OS, Android tablets

#### Server Requirements

- **Node.js:** 18.x LTS or higher
- **Python:** 3.8 or higher
- **MongoDB:** 4.4 or higher
- **OS:** Linux (recommended), macOS, Windows

### 5.7 Maintainability

- **Code Standards:**
  - ESLint configuration for JavaScript
  - Consistent naming conventions
  - DRY (Don't Repeat Yourself) principle
  - Code comments for complex logic
- **Documentation:**
  - API documentation (Swagger/OpenAPI)
  - Code-level documentation
  - Architecture documentation
  - Deployment guides
- **Testing Coverage:** ≥70% for critical paths
- **Dependency Management:** Regular updates, security scanning

---

## 6. System Constraints & Limitations

### 6.1 Technical Constraints

- **Frontend:** Limited to client-side processing for real-time features
- **File Uploads:** 5MB limit per image
- **API Calls:** Rate-limited by external APIs (Groq, Google Maps)
- **Database:** MongoDB document size limit (16MB)
- **Browser Storage:** LocalStorage 5-10MB per domain

### 6.2 Business Constraints

- **Licensing:**
  - Bootstrap (MIT)
  - Tesseract.js (Apache 2.0)
  - Google APIs (Requires API key)
  - Groq API (Commercial license)
- **Cost:** Cloud hosting, API calls, database storage
- **Legal:** HIPAA compliance not certified (current version)

### 6.3 Operational Constraints

- **Deployment:** Requires Docker/Container support (recommended)
- **Monitoring:** Manual monitoring initially, automation later
- **Backup:** Requires manual backup configuration
- **Scaling:** Manual scaling required initially

---

## 7. Environmental Requirements

### 7.1 Development Environment

```
- Node.js 18.x LTS
- Python 3.8+
- MongoDB Atlas or local MongoDB
- Git for version control
- npm and pip package managers
- Code editor (VS Code recommended)
```

### 7.2 Testing Environment

```
- Staging server (separate from production)
- Test MongoDB instance
- Test API keys for Groq, Google
- Test user accounts for QA
```

### 7.3 Production Environment

```
- Linux server (Ubuntu 20.04 LTS+ recommended)
- Node.js 18.x LTS runtime
- Python 3.8+ runtime
- MongoDB Atlas (managed)
- SSL certificates (Let's Encrypt)
- Backup solutions
- Monitoring tools (PM2, Prometheus)
```

---

## 8. External Dependencies

### 8.1 APIs & Services

| Service            | Provider      | Purpose                   | Dependency |
| ------------------ | ------------- | ------------------------- | ---------- |
| LLM Inference      | Groq          | Medical chatbot responses | Critical   |
| Speech Recognition | Groq Whisper  | Audio-to-text conversion  | Important  |
| Text-to-Speech     | Google (gTTS) | Response audio synthesis  | Important  |
| Maps API           | Google        | Store location display    | Important  |
| OAuth              | Google        | Social login              | Optional   |
| Database           | MongoDB Atlas | Data persistence          | Critical   |

### 8.2 Third-Party Libraries

**Frontend:**

- Bootstrap 5.3.8 (CSS framework)
- Font Awesome 7.0+ (Icons)
- Google Maps SDK (Maps)

**Backend:**

- Express.js 5.2.1 (Web framework)
- Mongoose 9.0.2 (ODM)
- Multer 1.4.5-lts.1 (File upload)
- Tesseract.js 7.0.0 (OCR)
- Bcrypt 6.0.0 (Password hashing)
- Groq SDK (LLM API)

**AI Service:**

- FastAPI (Framework)
- Groq Python SDK
- gTTS (TTS)
- python-dotenv

---

## 9. Acceptance Criteria & Testing

### 9.1 Functional Testing Checklist

**Authentication Module**

- [ ] User registration with valid data succeeds
- [ ] Duplicate email registration fails
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password fails
- [ ] OAuth login works
- [ ] User session persists on refresh
- [ ] Logout clears session

**Medicine Module**

- [ ] Medicine search returns results
- [ ] OCR extracts text from prescription images
- [ ] Medicine database queries are fast (<500ms)
- [ ] Medicines display with all required fields
- [ ] Search is case-insensitive

**Chatbot Module**

- [ ] Text input generates responses
- [ ] Audio input is transcribed correctly
- [ ] Image analysis works for medical images
- [ ] TTS generates audio responses
- [ ] Responses are non-diagnostic
- [ ] Error handling works for API failures

**Location Module**

- [ ] Geolocation service works
- [ ] Nearby stores are returned within radius
- [ ] Map displays stores correctly
- [ ] Store details are accurate

**UI/UX**

- [ ] All pages load successfully
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Forms validate input
- [ ] Navigation works correctly
- [ ] Error messages are clear

### 9.2 Non-Functional Testing

**Performance Testing**

- [ ] Page load time <3 seconds
- [ ] API response time <500ms
- [ ] Concurrent load test with 100+ users
- [ ] Database query optimization verified

**Security Testing**

- [ ] XSS attacks prevented
- [ ] SQL/NoSQL injection prevented
- [ ] Unauthorized access blocked
- [ ] HTTPS enabled on production
- [ ] Passwords hashed correctly

**Usability Testing**

- [ ] User can complete registration in <2 minutes
- [ ] New users understand main features
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] Mobile experience is smooth

---

## 10. Release & Deployment Strategy

### 10.1 Release Version

- **Current:** v1.0.0
- **Semantic Versioning:** MAJOR.MINOR.PATCH

### 10.2 Deployment Checklist

- [ ] Code review completed
- [ ] Tests pass (unit, integration, E2E)
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backups verified
- [ ] Rollback plan documented
- [ ] Deployment executed
- [ ] Smoke tests passed
- [ ] Monitoring alerts configured

### 10.3 Rollback Procedure

- Database snapshot before deployment
- Previous Docker image available
- Environment variable rollback plan
- Monitoring to detect issues

---

## 11. Future Enhancements (Road map)

### Phase 2 (Q3 2026)

- [ ] Conversation history and chat persistence
- [ ] Medicine recommendations based on symptoms
- [ ] User medicine history tracking
- [ ] Prescription upload and storage
- [ ] Doctor consultation links

### Phase 3 (Q4 2026)

- [ ] Mobile React Native app
- [ ] Multi-language support
- [ ] Appointment scheduling
- [ ] Telemedicine integration
- [ ] Wearable device integration

### Phase 4 (2027)

- [ ] Insurance integration
- [ ] Prescription generation
- [ ] Health records management
- [ ] Advanced analytics dashboard
- [ ] AI-powered diagnosis support (with legal review)

---

## 12. Definition of Terms

| Term    | Definition                                                               |
| ------- | ------------------------------------------------------------------------ |
| API     | Application Programming Interface - interface for software communication |
| Bcrypt  | Password hashing algorithm with salt                                     |
| CORS    | Cross-Origin Resource Sharing - allows cross-domain requests             |
| JWT     | JSON Web Token - secure credential token                                 |
| LLM     | Large Language Model - AI model for text generation                      |
| MongoDB | NoSQL database                                                           |
| OAuth   | Open standard for secure authentication                                  |
| OCR     | Optical Character Recognition - text extraction from images              |
| REST    | Representational State Transfer - web API architecture                   |
| TLS/SSL | Secure data transmission protocol                                        |
| XSS     | Cross-Site Scripting - web security vulnerability                        |

---

## 13. Document Change Log

| Version | Date     | Author   | Changes                       |
| ------- | -------- | -------- | ----------------------------- |
| 1.0     | Feb 2026 | Dev Team | Initial SRS document creation |

---

## 14. Approvals

| Role            | Name           | Signature | Date |
| --------------- | -------------- | --------- | ---- |
| Project Manager | To Be Assigned |           |      |
| Technical Lead  | To Be Assigned |           |      |
| Product Owner   | To Be Assigned |           |      |
| QA Lead         | To Be Assigned |           |      |

---

**Document Classification:** Internal Use - Technical Documentation  
**Document Status:** Final  
**Next Review Date:** August 2026  
**Contact:** development.team@swasthyasathi.com

---

_This SRS document is a living document and will be updated as requirements evolve. All stakeholders should review and approve changes._
