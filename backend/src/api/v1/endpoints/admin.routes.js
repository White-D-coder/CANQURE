import express from 'express';
import { AdminController } from '../../../controllers/admin.controller.js';
import { ScheduleController } from '../../../controllers/schedule.controller.js';
import { verifyAdmin } from '../../../middleware/middleware.js';

const router = express.Router();
const adminController = new AdminController();
const scheduleController = new ScheduleController();

router.use(verifyAdmin);

router.get('/stats', adminController.getStats);

router.get('/doctors', adminController.getAllDoctors);
router.post('/doctors', adminController.createDoctor);
router.put('/doctors/:id', adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);

router.get('/patients', adminController.getAllUsers);
router.post('/patients', adminController.createPatient);
router.put('/patients/:id', adminController.updatePatient);
router.delete('/patients/:id', adminController.deletePatient);

router.post('/schedule/create', scheduleController.createTimeSlots);
router.put('/schedule/status', scheduleController.updateSlotStatus);
router.get('/schedule', scheduleController.getDoctorSlots);

export default router;
