import express from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { verifyPatient } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new AnalyticsController();

router.post('/risk-assessment', verifyPatient, controller.predictRisk);

export default router;
