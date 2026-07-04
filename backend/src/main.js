import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Modular Routers from Bounded Contexts
import identityRoutes from './modules/identity/identity.routes.js';
import patientCareRoutes from './modules/patient_care/patient_care.routes.js';
import consultationsRoutes from './modules/consultations/consultations.routes.js';
import medicationContinuityRoutes from './modules/medication_continuity/medication_continuity.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import emergencyRoutes from './modules/emergency/emergency.routes.js';
import hospitalOperationsRoutes from './modules/hospital_operations/hospital_operations.routes.js';
import pharmacyOperationsRoutes from './modules/pharmacy_operations/pharmacy_operations.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import doctorPortalRoutes from './modules/doctor_portal/doctor_portal.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
app.use('/api', apiRouter);

// 1. Identity Context (Authentication & Admin CRUD)
apiRouter.use('/', identityRoutes); // Mounts /signup, /login, and /admin/doctors, /admin/patients

// 2. Patient Care Context (Dashboard)
apiRouter.use('/user', patientCareRoutes); // Mounts /user/dashboard

// 3. Consultations Context (Booking, availability, slots scheduling, live scribing)
apiRouter.use('/user', consultationsRoutes); // Mounts /user/doctors, /user/book-appointment, /user/availability
apiRouter.use('/doctors', consultationsRoutes); // Mounts /doctors/:id/appointments, /doctors/:doctorId/patient/:patientId, /doctors/schedule
apiRouter.use('/admin', consultationsRoutes); // Mounts /admin/schedule/create, /admin/schedule/status, /admin/schedule
apiRouter.use('/consultations', consultationsRoutes); // Mounts /consultations/:appointmentId/start, etc.

// 4. Medication Continuity Context (Prescriptions, calendar sync)
apiRouter.use('/', medicationContinuityRoutes); // Mounts /doctors/:id/patient/:patientId/prescription
apiRouter.use('/medicinal', medicationContinuityRoutes); // Mounts /medicinal/sync

// 5. Documents Context (PDF Report uploads, OCR extraction)
apiRouter.use('/reports', documentsRoutes); // Mounts /reports/ (POST), /reports/patient/:userId, /reports/:id
apiRouter.use('/medicinal', express.Router().post('/upload', documentsRoutes)); // Alias mapping for /medicinal/upload

// 6. Emergency Context (SOS Broadcast, Telemetry updates, Hospital coordinates)
apiRouter.use('/user', emergencyRoutes); // Mounts /user/emergency, /user/sos-broadcast, /user/hospitals
apiRouter.use('/emergency', emergencyRoutes); // Mounts /emergency/sos/active, /emergency/sos/:id/ambulance

// 7. Hospital Operations Context (Hospital beds, intake board)
apiRouter.use('/hospitals', hospitalOperationsRoutes); // Mounts /hospitals/dashboard/appointments, /hospitals/ (CRUD)

// 8. Pharmacy Operations Context (Refill Orders fulfillment)
apiRouter.use('/refill-orders', pharmacyOperationsRoutes); // Mounts /refill-orders/...

// 9. Notifications Context (Alerts & Reminders)
apiRouter.use('/notifications', notificationsRoutes); // Mounts /notifications/alerts

// 10. Analytics Context (Risk Predictions Proxy)
apiRouter.use('/', analyticsRoutes); // Mounts /risk-assessment
apiRouter.use('/medicinal', express.Router().post('/risk', analyticsRoutes)); // Alias mapping for /medicinal/risk

// 11. Audit Context (Compliance logs)
apiRouter.use('/audit', auditRoutes); // Mounts /audit/logs

// 12. Doctor Portal Context (Clinical data views)
apiRouter.use('/doctor', doctorPortalRoutes);

app.get('/', (req, res) => {
    res.send("Welcome to CAN-QURE Modular Backend Service");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT} - Modular Monolith Architecture`);
});

export default app;