import { BaseController } from '../../shared/BaseController.js';
import { DocumentsService } from './documents.service.js';
import fs from 'fs';

export class DocumentsController extends BaseController {
    constructor() {
        super();
        this.documentsService = new DocumentsService();
    }

    createReport = async (req, res) => {
        try {
            const { userId, reportName } = req.body;
            const file = req.file || (req.files && req.files[0]);

            if (!file) {
                return this.error(res, "No file uploaded", 400);
            }

            // 1. Process Report (OCR + Parse Medicines)
            const { text, medicines } = await this.documentsService.processReportFile(file);

            // 2. Upload to Cloud Store (Google Drive Mock)
            const fileName = reportName || file.originalname;
            const fileUrl = await this.documentsService.uploadToCloudStore(file.path, fileName);

            // 3. Save to database
            const report = await this.documentsService.createReport({
                userId,
                reportName: fileName,
                reportUrl: fileUrl,
                parsedText: text,
                extractedMedicines: medicines,
                status: 'PROCESSED'
            });

            // Cleanup local uploaded file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            return this.success(res, report, "Report processed successfully", 201);
        } catch (err) {
            console.error("Report Upload/Processing Error:", err);
            return this.error(res, "Failed to process report", 500, err);
        }
    };

    getReportsByPatient = async (req, res) => {
        try {
            const { userId } = req.params;
            const reports = await this.documentsService.getReportsByPatient(userId);
            return this.success(res, reports);
        } catch (err) {
            return this.error(res, "Failed to fetch reports", 500, err);
        }
    };

    updateReport = async (req, res) => {
        try {
            const { id } = req.params;
            const report = await this.documentsService.updateReport(id, req.body);
            return this.success(res, report);
        } catch (err) {
            return this.error(res, "Failed to update report", 500, err);
        }
    };
}
