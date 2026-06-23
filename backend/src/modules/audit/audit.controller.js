import { BaseController } from '../../shared/BaseController.js';
import { AuditService } from './audit.service.js';

export class AuditController extends BaseController {
    constructor() {
        super();
        this.auditService = new AuditService();
    }

    getLogs = async (req, res) => {
        try {
            const userId = req.user.id;
            const logs = await this.auditService.getLogs(userId);
            return this.success(res, logs);
        } catch (err) {
            return this.error(res, "Failed to fetch logs", 500, err);
        }
    };
}
