import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { MedicinalController } from '../../../controllers/medicinal.controller.js';

const router = express.Router();
const medicinalController = new MedicinalController();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix);
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), medicinalController.uploadReport);
router.post('/sync', medicinalController.syncCalendar);
router.post('/risk', medicinalController.predictRisk);

export default router;
