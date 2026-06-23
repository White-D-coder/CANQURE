import express from 'express';
import { HospitalOperationsController } from './hospital_operations.controller.js';
import { verifyHospitalAdmin } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new HospitalOperationsController();

// Hospital dashboard (requires hospital admin role verification)
router.get('/dashboard/appointments', verifyHospitalAdmin, controller.getAppointments);
router.put('/dashboard/appointments/:id/status', verifyHospitalAdmin, controller.updateAppointmentStatus);

// Hospital profile CRUD
router.post('/', controller.createHospital);
router.get('/', controller.getAllHospitals);
router.get('/:id', controller.getHospitalById);
router.put('/:id', controller.updateHospital);
router.delete('/:id', controller.deleteHospital);

export default router;
