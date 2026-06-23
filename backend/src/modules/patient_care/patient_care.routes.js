import express from 'express';
import { PatientCareController } from './patient_care.controller.js';
import { verifyPatient } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new PatientCareController();

router.get('/dashboard', verifyPatient, controller.getPatientDashboard);

export default router;
