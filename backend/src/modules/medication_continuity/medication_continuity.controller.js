import { BaseController } from '../../shared/BaseController.js';
import { MedicationContinuityService } from './medication_continuity.service.js';

export class MedicationContinuityController extends BaseController {
    constructor() {
        super();
        this.medicationContinuityService = new MedicationContinuityService();
    }

    addPrescription = async (req, res) => {
        try {
            const { id, patientId } = req.params; // doctorId (id) and patientId
            const medicine = await this.medicationContinuityService.addPrescription(id, patientId, req.body);

            if (!medicine) {
                return this.error(res, "Access denied. No appointment found with this patient.", 403);
            }

            return this.success(res, medicine, "Prescription added successfully", 201);
        } catch (err) {
            return this.error(res, "Failed to add prescription", 500, err);
        }
    };

    updatePrescription = async (req, res) => {
        try {
            const { id, patientId, medId } = req.params;
            const medicine = await this.medicationContinuityService.updatePrescription(id, patientId, medId, req.body);

            if (!medicine) {
                return this.error(res, "Access denied. No appointment found with this patient.", 403);
            }

            return this.success(res, medicine);
        } catch (err) {
            return this.error(res, "Failed to update prescription", 500, err);
        }
    };

    syncCalendar = async (req, res) => {
        try {
            const { medicines, userEmail } = req.body;
            if (!medicines || !Array.isArray(medicines)) {
                return this.error(res, "Invalid medicines data", 400);
            }

            const result = await this.medicationContinuityService.syncCalendar(medicines, userEmail);
            return this.success(res, result);
        } catch (err) {
            return this.error(res, "Sync failed", 500, err);
        }
    };
}
