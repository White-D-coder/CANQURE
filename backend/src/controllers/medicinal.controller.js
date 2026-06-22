import { BaseController } from './BaseController.js';
import { MedicinalService } from '../services/medicinal.service.js';

export class MedicinalController extends BaseController {
    constructor() {
        super();
        this.medicinalService = new MedicinalService();
    }

    uploadReport = async (req, res) => {
        try {
            if (!req.file) {
                return this.error(res, "No file uploaded", 400);
            }

            console.log(`Received file: ${req.file.originalname}, Type: ${req.file.mimetype}`);
            console.log('req.body:', req.body);

            const result = await this.medicinalService.processReport(req.file);

            return this.success(res, {
                message: "Report processed successfully",
                filename: req.file.filename,
                filepath: req.file.path,
                size: req.file.size,
                text: result.text,
                medicines: result.medicines
            });

        } catch (error) {
            console.error("Upload Error:", error);
            return this.error(res, "Failed to process report", 500, error);
        }
    };

    syncCalendar = async (req, res) => {
        try {
            const { medicines, userEmail } = req.body;
            if (!medicines || !Array.isArray(medicines)) {
                return this.error(res, "Invalid medicines data", 400);
            }

            const result = await this.medicinalService.syncCalendar(medicines, userEmail);
            return this.success(res, result);
        } catch (error) {
            console.error("Sync Error:", error);
            return this.error(res, "Sync failed", 500, error);
        }
    };

    predictRisk = async (req, res) => {
        try {
            const result = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req.body)
            });

            if (!result.ok) {
                const err = await result.text();
                throw new Error(err);
            }

            const data = await result.json();
            return this.success(res, data);
        } catch (error) {
            console.error("Risk Prediction Error:", error);
            return this.error(res, "Failed to predict risk", 500, error);
        }
    };
}
