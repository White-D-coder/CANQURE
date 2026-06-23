import { BaseService } from '../../shared/BaseService.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export class AnalyticsService extends BaseService {
    async predictRisk(patientData) {
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, patientData);
        return response.data;
    }
}
