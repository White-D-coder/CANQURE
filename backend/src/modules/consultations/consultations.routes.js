import express from 'express';
import { ConsultationsController } from './consultations.controller.js';
import { verifyPatient, verifyDoctor, verifyAdmin } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new ConsultationsController();

// Patient booking / availability
router.get('/doctors', verifyPatient, controller.getAllDoctors);
router.get('/doctors/:id', verifyPatient, controller.getDoctorById);
router.get('/availability', verifyPatient, controller.getDoctorAvailability);
router.post('/book-appointment', verifyPatient, controller.bookAppointment);

// Doctor appointments list & patient details access
router.get('/doctors/:id/appointments', verifyDoctor, controller.getDoctorAppointments);
router.get('/doctors/:doctorId/patient/:patientId', verifyDoctor, controller.getPatientDetails);

// Slot scheduling (Admin & Doctor authorized)
router.post('/schedule/create', verifyAdmin, controller.createTimeSlots);
router.put('/schedule/status', verifyAdmin, controller.updateSlotStatus);
router.get('/schedule', verifyPatient, controller.getDoctorSlots); // both patients and doctors check slots

// Live consultation scribing
router.post('/:appointmentId/start', verifyDoctor, controller.startConsultation);
router.post('/:appointmentId/transcript', verifyDoctor, controller.saveTranscript);
router.post('/:appointmentId/summarize', verifyDoctor, controller.generateSummary);
router.post('/:appointmentId/reroute', verifyDoctor, controller.rerouteAppointment);
router.post('/:appointmentId/emergency-escalate', verifyDoctor, controller.emergencyEscalate);

export default router;
