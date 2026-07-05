# GitHub Issues Drafts for CAN-QURE

This document provides drafts for 10 professional GitHub issues tailored specifically to the CAN-QURE Oncology Ecosystem. They include exact code locations, descriptions, severity, and suggestions for remediation.

---

## 1. 🚨 [BUG] Critical Runtime Crash: Uncaught ReferenceError during Patient Sign-up
* **Component:** Backend (Identity Context)
* **Location:** [identity.service.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/modules/identity/identity.service.js#L19)
* **Severity:** Critical (Core flow blocker)

### Description
In `registerPatient()`, the service attempts to call `prisma.user.create()` directly rather than invoking the instance member `this.prisma.user.create()`. Since `prisma` is not imported in this file (it is only imported in [BaseService.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/shared/BaseService.js)), the signup flow crashes immediately with:
`ReferenceError: prisma is not defined`

### Steps to Reproduce
1. Attempt to register a patient via the signup endpoint `/signup`.
2. Inspect the backend log or request response.
3. Observe the crash/Internal Server Error.

### Proposed Fix
Change `prisma.user.create` to `this.prisma.user.create` on line 19 of `identity.service.js`.

---

## 2. 🔐 [SECURITY] Major Vulnerability: Insecure Direct Object Reference (BOLA/IDOR) in Patient Reports Access
* **Component:** Backend (Documents Context)
* **Location:** [documents.controller.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/modules/documents/documents.controller.js#L49-L57)
* **Severity:** High / Critical (HIPAA & Privacy Violation)

### Description
The endpoint `/reports/patient/:userId` is secured with a generic patient verification middleware (`verifyPatient`), but it never checks whether the authenticated user's ID (`req.user.id`) matches the parameter `:userId`. Consequently, any logged-in patient can retrieve the full medical vault history (biopsies, scans, metadata) of any other patient simply by modifying the `userId` in the URL.

### Proposed Fix
In `getReportsByPatient`, add an authorization check:
```javascript
if (req.user.role !== 'admin' && req.user.id !== userId) {
    return this.error(res, "Access denied: Unauthorized report lookup", 403);
}
```

---

## 3. 🚨 [BUG] Critical OCR Error: Missing `await` when Parsing Extracted Medicines
* **Component:** Backend (Documents Context)
* **Location:** [documents.service.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/modules/documents/documents.service.js#L16)
* **Severity:** High (Data processing failure)

### Description
In `processReportFile(file)`, the method executes `parseMedicines(text)` which is an asynchronous function returning a Promise. However, it is invoked without `await`. The controller saves a pending `Promise` object instead of the parsed array to MongoDB, causing serialization failure and blank metadata inside the patient document vault.

### Proposed Fix
Prepend `await` on line 16 of `documents.service.js`:
```javascript
const medicines = await parseMedicines(text);
```

---

## 4. 🔐 [SECURITY] Major Vulnerability: Doctor Spoofing in Digital Prescriptions
* **Component:** Backend (Medication Continuity)
* **Location:** [medication_continuity.controller.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/modules/medication_continuity/medication_continuity.controller.js#L12)
* **Severity:** High (Identity Spoofing & Audit Compliance)

### Description
When writing a digital prescription, the controller gets the doctor's ID from `req.params.id`. It verifies that the user is a doctor, but does not check if the logged-in doctor (`req.user.id`) matches the parameter `:id`. This allows one authenticated doctor to issue prescriptions under another doctor's name.

### Proposed Fix
Validate the ID parameter against the token identity:
```javascript
if (req.user.role !== 'admin' && req.user.id !== id) {
    return this.error(res, "Forbidden: Cannot issue prescription for another doctor", 403);
}
```

---

## 5. 🚨 [BUG] Critical UI Failure: ReferenceErrors rendering `QREmergencyCard.jsx`
* **Component:** Frontend (Doctor Dashboard)
* **Location:** [QREmergencyCard.jsx](file:///Users/deeptanubhunia/Desktop/CANQURE/frontend-web/src/pages/DoctorDashboard/components/QREmergencyCard.jsx#L1-L5)
* **Severity:** High (UI rendering crash)

### Description
The `QREmergencyCard` uses `<AnimatePresence>` and `<motion.div>` from `framer-motion`, and `<ChevronDown>` from `lucide-react`, but fails to import them. Any attempt to render this card in the Doctor Dashboard causes a React error boundary crash.

### Proposed Fix
Update imports in `QREmergencyCard.jsx`:
```javascript
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, MapPin, Loader2, AlertCircle, QrCode, Printer, ChevronDown } from 'lucide-react';
```

---

## 6. 🚨 [BUG] UI Integration Crash: 404 Endpoint Mismatch in Risk Assessment Smart Fill
* **Component:** Frontend (Risk Assessment)
* **Location:** [RiskAssessment.jsx](file:///Users/deeptanubhunia/Desktop/CANQURE/frontend-web/src/pages/RiskAssessment/RiskAssessment.jsx#L53)
* **Severity:** High (Broken Feature)

### Description
The "Smart Fill" button on the Risk Assessment page calls `/reports/user/${user.id}`. However, the backend router mounts this report listing route as `/reports/patient/:userId`. This mismatch results in a `404 Not Found` error, preventing patients from auto-populating blood levels from their uploaded reports.

### Proposed Fix
Change the Axios query target in `RiskAssessment.jsx` from `/reports/user/` to `/reports/patient/`.

---

## 7. ⚠️ [LOGIC] Resilience Issue: Brittle Doctor Allocation during Emergency Escalation
* **Component:** Backend (Consultations Context)
* **Location:** [consultations.service.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/modules/consultations/consultations.service.js#L205-L213)
* **Severity:** Medium (Operational risk)

### Description
The `emergencyEscalate()` method queries the database for a doctor with fewer than 5 consultations: `consultations: { lt: 5 }`. If all doctors on duty have 5 or more appointments, the query returns `null`, throwing `"No emergency responders available"` and leaving the patient unassigned.

### Proposed Fix
Add a fallback to retrieve the doctor with the lowest current workload (least consultations) rather than failing completely.

---

## 8. 🧹 [TECH DEBT] Database Schema Mismatch: Out-of-sync Legacy Refill Route
* **Component:** Backend (Legacy Router)
* **Location:** [refill.routes.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/api/v1/endpoints/refill.routes.js)
* **Severity:** Low (Code hygiene / Technical debt)

### Description
The legacy router file `refill.routes.js` contains database insertions that assume old fields (`pharmacyName`, `medicationId`) exist on the `RefillOrder` schema. The active schema requires `pharmacyId` (as a relation). While this folder is not active in `main.js`, keeping out-of-sync code causes search bloat and linter failures. The legacy folder `src/api/` should be completely removed.

### Proposed Fix
Delete the legacy `backend/src/api/` directory.

---

## 9. ⚠️ [UX] Session Issue: Over-aggressive Logout on 403 Forbidden API Calls
* **Component:** Frontend (Axios Setup)
* **Location:** [axios.js](file:///Users/deeptanubhunia/Desktop/CANQURE/frontend-web/src/api/axios.js#L25-L31)
* **Severity:** Medium (Bad User Experience)

### Description
The Axios interceptor logs the user out and redirects to `/login` whenever it encounters a `403` status. A 403 indicates permission denied for a specific resource, not an expired session. Logging the user out completely causes unnecessary disruption when they encounter localized authorization blocks.

### Proposed Fix
Only clear tokens and redirect to login on `401 Unauthorized` responses. For `403 Forbidden`, show an access-denied toast message or redirect to an authorization page.

---

## 10. 💡 [FEATURE] Real-time Telemetry Push for Active SOS Ambulance Tracking
* **Component:** Fullstack (Emergency Telemetry)
* **Location:** [emergency.controller.js](file:///Users/deeptanubhunia/Desktop/CANQURE/backend/src/modules/emergency/emergency.controller.js#L114-L123)
* **Severity:** Feature request (UX / Performance Enhancement)

### Description
The emergency system updates coordinates via HTTP PUT requests from the driver (`/emergency/sos/:id/ambulance`). The patient frontend has to poll this endpoint constantly to track the ambulance. We should migrate telemetry to WebSocket connections to ensure real-time push updates, low battery usage on patient mobile devices, and smoother route rendering.
