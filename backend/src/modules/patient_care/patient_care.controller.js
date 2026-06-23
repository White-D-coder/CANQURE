import { BaseController } from '../../shared/BaseController.js';
import { PatientCareService } from './patient_care.service.js';

export class PatientCareController extends BaseController {
    constructor() {
        super();
        this.patientCareService = new PatientCareService();
    }

    getPatientDashboard = async (req, res) => {
        try {
            const userId = req.user.id;
            const patient = await this.patientCareService.getPatientDashboard(userId);

            if (!patient) {
                return this.error(res, "Patient not found", 404);
            }

            return this.success(res, patient);
        } catch (err) {
            return this.error(res, "Failed to fetch dashboard", 500, err);
        }
    };
}
