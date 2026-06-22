import { BaseService } from './BaseService.js';
import { extractTextFromImage, extractTextFromPdf, parseMedicines } from '../integrations/ocr.service.js';
import { createMedicineEvents } from '../integrations/calendar.service.js';

import fs from 'fs';

export class MedicinalService extends BaseService {
    async processReport(file) {
        let text = '';
        const fileBuffer = fs.readFileSync(file.path);

        if (file.mimetype === 'application/pdf') {
            text = await extractTextFromPdf(fileBuffer);
        } else {
            text = await extractTextFromImage(fileBuffer);
        }

        const medicines = parseMedicines(text);

        return {
            text,
            medicines
        };
    }

    async syncCalendar(medicines, userEmail) {
        return await createMedicineEvents(medicines, userEmail);
    }
}
