import { BaseController } from '../../shared/BaseController.js';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController extends BaseController {
    constructor() {
        super();
        this.analyticsService = new AnalyticsService();
    }

    predictRisk = async (req, res) => {
        try {
            const data = await this.analyticsService.predictRisk(req.body);
            return this.success(res, data);
        } catch (err) {
            console.error("ML Risk Prediction Error:", err.message);
            return this.error(res, "Risk assessment service unavailable", 500, err);
        }
    };
}
