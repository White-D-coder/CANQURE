import { BaseService } from '../../shared/BaseService.js';

export class NotificationsService extends BaseService {
    async getAlerts(patientId) {
        return await this.prisma.alert.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getCareGaps(patientId) {
        return await this.prisma.careGap.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
