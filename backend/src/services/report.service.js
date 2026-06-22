import { BaseService } from './BaseService.js';

export class ReportService extends BaseService {
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
            where: { userId: userId },
            orderBy: { date: 'desc' }
        });
    }

    async updateReport(id, data) {
        return await this.prisma.report.update({
            where: { reportId: id },
            data: {
                reportName: data.reportName,
                reportUrl: data.reportUrl,
                status: data.status
            }
        });
    }
}
