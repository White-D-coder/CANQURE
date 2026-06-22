import express from 'express';
import { ReportController } from '../../../controllers/report.controller.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const reportController = new ReportController();

router.post('/', upload.single('report'), reportController.createReport);
router.get('/patient/:userId', reportController.getReportsByPatient);
router.patch('/:id', reportController.updateReport);

export default router;
