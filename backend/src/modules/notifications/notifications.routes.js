import express from 'express';
import { NotificationsController } from './notifications.controller.js';
import { verifyPatient } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new NotificationsController();

router.get('/alerts', verifyPatient, controller.getAlerts);

export default router;
