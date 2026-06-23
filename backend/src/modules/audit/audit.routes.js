import express from 'express';
import { AuditController } from './audit.controller.js';
import { verifyToken } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new AuditController();

router.get('/logs', verifyToken, controller.getLogs);

export default router;
