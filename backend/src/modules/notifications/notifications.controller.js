import { BaseController } from '../../shared/BaseController.js';
import { NotificationsService } from './notifications.service.js';

export class NotificationsController extends BaseController {
    constructor() {
        super();
        this.notificationsService = new NotificationsService();
    }

    getAlerts = async (req, res) => {
        try {
            const patientId = req.user.id;
            const alerts = await this.notificationsService.getAlerts(patientId);
            return this.success(res, alerts);
        } catch (err) {
            return this.error(res, "Failed to fetch alerts", 500, err);
        }
    };
}
