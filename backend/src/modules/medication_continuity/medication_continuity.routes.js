import express from 'express';
import { MedicationContinuityController } from './medication_continuity.controller.js';
import { verifyDoctor, verifyPatient } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new MedicationContinuityController();

// Doctor prescription management routes
router.post('/doctors/:id/patient/:patientId/prescription', verifyDoctor, controller.addPrescription);
router.put('/doctors/:id/patient/:patientId/prescription/:medId', verifyDoctor, controller.updatePrescription);

// Patient sync calendar routes
router.post('/sync', verifyPatient, controller.syncCalendar);

export default router;
