import { BaseService } from '../../shared/BaseService.js';

export class AuditService extends BaseService {
    async logAccess(userId, action, resourceType, resourceId, details) {
        return await this.prisma.auditLog.create({
            data: {
                userId,
                action,
                resourceType,
                resourceId,
                details
            }
        });
    }

    async getLogs(userId) {
        return await this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' }
        });
    }
}
