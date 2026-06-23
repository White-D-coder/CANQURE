import express from 'express';
import { EmergencyController } from './emergency.controller.js';
import { verifyPatient, verifyToken } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new EmergencyController();

router.get('/hospitals', verifyPatient, controller.getHospitals);
router.post('/sos-broadcast', verifyPatient, controller.sosBroadcast);
router.get('/sos/active', verifyToken, controller.getActiveSos);
router.put('/sos/:id/ambulance', verifyToken, controller.updateAmbulance);

export default router;
