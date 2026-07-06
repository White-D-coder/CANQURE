import { BaseService } from '../../shared/BaseService.js';
import { extractTextFromImage, extractTextFromPdf, parseMedicines, uploadToDrive } from '../../integrations/ocr.service.js';
import fs from 'fs';

export class DocumentsService extends BaseService {
    async processReportFile(file) {
        let text = "";
        const fileBuffer = fs.readFileSync(file.path);
        
        if (file.mimetype === 'application/pdf') {
            text = await extractTextFromPdf(fileBuffer);
        } else {
            text = await extractTextFromImage(fileBuffer);
        }

        const medicines = await parseMedicines(text);
        return { text, medicines };
    }

    async uploadToCloudStore(filePath, fileName) {
        let fileUrl = await uploadToDrive(filePath, fileName);
        if (!fileUrl) {
            fileUrl = "https://drive.google.com/file/d/mock-url";
        }
        return fileUrl;
    }

    async createReport(data) {
        return await this.prisma.report.create({
            data: {
                reportName: data.reportName,
                reportUrl: data.reportUrl,
                parsedText: data.parsedText || null,
                extractedMedicines: data.extractedMedicines || null,
                status: data.status || 'PROCESSED',
                userId: data.userId,
                doctorId: data.doctorId || null
            }
        });
    }

    async getReportsByPatient(userId) {
        return await this.prisma.report.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        });
    }

    async updateReport(id, data) {
        return await this.prisma.report.update({
            where: { id },
            data: {
                reportName: data.reportName,
                reportUrl: data.reportUrl,
                status: data.status
            }
        });
    }
}
