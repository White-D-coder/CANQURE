import express from 'express';
import multer from 'multer';
import { DocumentsController } from './documents.controller.js';
import { verifyPatient } from '../../middleware/middleware.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const controller = new DocumentsController();

router.post('/', verifyPatient, upload.any(), controller.createReport);
router.get('/patient/:userId', verifyPatient, controller.getReportsByPatient);
router.patch('/:id', verifyPatient, controller.updateReport);

export default router;
