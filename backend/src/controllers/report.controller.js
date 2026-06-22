import { BaseController } from './BaseController.js';
import { ReportService } from '../services/report.service.js';
import { extractTextFromImage, extractTextFromPdf, parseMedicines, uploadToDrive } from '../integrations/ocr.service.js';
import fs from 'fs';

export class ReportController extends BaseController {
    constructor() {
        super();
        this.reportService = new ReportService();
    }

    createReport = async (req, res) => {
        try {
            const { userId, reportName } = req.body;
            const file = req.file;

            if (!file) {
                return this.error(res, "No file uploaded", 400);
            }

            // 1. Extract Text (OCR)
            let extractedText = "";
            const fileBuffer = fs.readFileSync(file.path);
            
            if (file.mimetype === 'application/pdf') {
                extractedText = await extractTextFromPdf(fileBuffer);
            } else {
                extractedText = await extractTextFromImage(fileBuffer);
            }

            // 2. Parse Medicines
            const medicines = parseMedicines(extractedText);

            // 3. Upload to Google Drive (Mocked URL if no config)
            let fileUrl = await uploadToDrive(file.path, reportName || file.originalname);
            if (!fileUrl) {
                fileUrl = "https://drive.google.com/file/d/mock-url"; // Fallback
            }

            // 4. Save to Database
            const reportData = {
                userId,
                reportName: reportName || file.originalname,
                reportUrl: fileUrl,
                parsedText: extractedText,
                extractedMedicines: medicines,
                status: 'PROCESSED'
            };

            const report = await this.reportService.createReport(reportData);

            // Cleanup local file
            fs.unlinkSync(file.path);

            return this.success(res, report, "Report processed successfully", 201);
        } catch (err) {
            console.error("Report Processing Error:", err);
            return this.error(res, "Failed to process report", 500, err);
        }
    };

    getReportsByPatient = async (req, res) => {
        try {
            const userId = req.params.userId;
            const reports = await this.reportService.getReportsByPatient(userId);
            return this.success(res, reports);
        } catch (err) {
            return this.error(res, "Failed to fetch reports", 500, err);
        }
    };

    updateReport = async (req, res) => {
        try {
            const { id } = req.params;
            const report = await this.reportService.updateReport(id, req.body);
            return this.success(res, report);
        } catch (err) {
            return this.error(res, "Failed to update report", 500, err);
        }
    };
}
