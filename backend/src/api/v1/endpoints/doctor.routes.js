import express from 'express';
import { DoctorController } from '../../../controllers/doctor.controller.js';
import { ScheduleController } from '../../../controllers/schedule.controller.js';
import { verifyDoctor } from '../../../middleware/middleware.js';

const router = express.Router();
const doctorController = new DoctorController();
const scheduleController = new ScheduleController();

router.use(verifyDoctor);

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/appointments', doctorController.getDoctorAppointments);
router.get('/:doctorId/patient/:patientId', doctorController.getPatientDetails);
router.post('/:id/patient/:patientId/prescription', doctorController.addPrescription);
router.put('/:id/patient/:patientId/prescription/:medId', doctorController.updatePrescription);

router.get('/schedule', scheduleController.getDoctorSlots);
router.put('/schedule/approve', scheduleController.approveSlot);

export default router;
