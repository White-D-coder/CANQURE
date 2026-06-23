import express from 'express';
import { IdentityController } from './identity.controller.js';
import { verifyAdmin, signupMiddleware } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new IdentityController();

// Public Authentication Routes
router.post('/signup', signupMiddleware, controller.signup);
router.post('/login', controller.login);

// Administrative User Management Routes
router.get('/admin/stats', verifyAdmin, controller.getStats);
router.get('/admin/doctors', verifyAdmin, controller.getAllDoctors);
router.post('/admin/doctors', verifyAdmin, controller.createDoctor);
router.put('/admin/doctors/:id', verifyAdmin, controller.updateDoctor);
router.delete('/admin/doctors/:id', verifyAdmin, controller.deleteDoctor);

router.get('/admin/patients', verifyAdmin, controller.getAllUsers);
router.post('/admin/patients', verifyAdmin, controller.createPatient);
router.put('/admin/patients/:id', verifyAdmin, controller.updatePatient);
router.delete('/admin/patients/:id', verifyAdmin, controller.deletePatient);

export default router;
