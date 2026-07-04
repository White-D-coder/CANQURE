import { BaseController } from '../../shared/BaseController.js';
import { DoctorPortalService } from './doctor_portal.service.js';

export class DoctorPortalController extends BaseController {
    constructor() {
        super();
        this.doctorPortalService = new DoctorPortalService();
    }

    getPatientSnapshot = async (req, res) => {
        try {
            const { id } = req.params;
            const snapshot = await this.doctorPortalService.getPatientSnapshot(id);
            if (!snapshot) return this.error(res, "Patient not found", 404);
            return this.success(res, snapshot);
        } catch (err) {
            return this.error(res, "Failed to load patient snapshot", 500, err);
        }
    };

    getPatientTimeline = async (req, res) => {
        try {
            const { id } = req.params;
            const timeline = await this.doctorPortalService.getPatientTimeline(id);
            return this.success(res, timeline);
        } catch (err) {
            return this.error(res, "Failed to load patient timeline", 500, err);
        }
    };

    getPatientDocuments = async (req, res) => {
        try {
            const { id } = req.params;
            const documents = await this.doctorPortalService.getPatientDocuments(id);
            return this.success(res, documents);
        } catch (err) {
            return this.error(res, "Failed to load documents", 500, err);
        }
    };

    getPatientMedications = async (req, res) => {
        try {
            const { id } = req.params;
            const medications = await this.doctorPortalService.getPatientMedications(id);
            return this.success(res, medications);
        } catch (err) {
            return this.error(res, "Failed to load medications", 500, err);
        }
    };

    getEmergencyData = async (req, res) => {
        try {
            const { id } = req.params;
            const emergencyData = await this.doctorPortalService.getEmergencyData(id);
            return this.success(res, emergencyData);
        } catch (err) {
            return this.error(res, "Failed to compile emergency data package", 500, err);
        }
    };

    getCareGaps = async (req, res) => {
        try {
            const { id } = req.params;
            const gaps = await this.doctorPortalService.getCareGaps(id);
            return this.success(res, gaps);
        } catch (err) {
            return this.error(res, "Failed to load care gaps", 500, err);
        }
    };

    getRedFlags = async (req, res) => {
        try {
            const { id } = req.params;
            const redFlags = await this.doctorPortalService.getRedFlags(id);
            return this.success(res, redFlags);
        } catch (err) {
            return this.error(res, "Failed to scan safety red flags", 500, err);
        }
    };

    refillMedication = async (req, res) => {
        try {
            const { id, medId } = req.params;
            const updated = await this.doctorPortalService.refillMedication(id, medId);
            if (!updated) return this.error(res, "Medication not found", 404);
            return this.success(res, updated, "Refill order submitted successfully");
        } catch (err) {
            return this.error(res, "Refill processing failed", 500, err);
        }
    };

    resolveCareGap = async (req, res) => {
        try {
            const { id, gapId } = req.params;
            const result = await this.doctorPortalService.resolveCareGap(id, gapId);
            return this.success(res, result, "Care gap resolved successfully");
        } catch (err) {
            return this.error(res, "Failed to resolve care gap", 500, err);
        }
    };
}
