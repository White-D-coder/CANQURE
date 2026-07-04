import express from 'express';
import { DoctorPortalController } from './doctor_portal.controller.js';
import { verifyDoctor } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new DoctorPortalController();

router.get('/patient/:id/snapshot', verifyDoctor, controller.getPatientSnapshot);
router.get('/patient/:id/timeline', verifyDoctor, controller.getPatientTimeline);
router.get('/patient/:id/documents', verifyDoctor, controller.getPatientDocuments);
router.get('/patient/:id/medications', verifyDoctor, controller.getPatientMedications);
router.get('/patient/:id/emergency', verifyDoctor, controller.getEmergencyData);
router.get('/patient/:id/caregaps', verifyDoctor, controller.getCareGaps);
router.get('/patient/:id/redflags', verifyDoctor, controller.getRedFlags);

router.post('/patient/:id/medication/:medId/refill', verifyDoctor, controller.refillMedication);
router.post('/patient/:id/caregap/:gapId/resolve', verifyDoctor, controller.resolveCareGap);

export default router;
