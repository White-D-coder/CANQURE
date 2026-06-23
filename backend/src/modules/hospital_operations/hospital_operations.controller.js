import { BaseController } from '../../shared/BaseController.js';
import { HospitalOperationsService } from './hospital_operations.service.js';

export class HospitalOperationsController extends BaseController {
    constructor() {
        super();
        this.hospitalOperationsService = new HospitalOperationsService();
    }

    getAppointments = async (req, res) => {
        try {
            const appointments = await this.hospitalOperationsService.getDashboardAppointments();
            const formatted = appointments.map(a => ({
                id: a.id.slice(-6).toUpperCase(),
                dbId: a.id,
                name: a.patientName || a.user?.name || 'Unknown',
                condition: 'Oncology Consult',
                ref: a.doctor?.name || 'AI Triage',
                urgency: a.urgencyLevel || 'Normal',
                status: a.status || 'SCHEDULED'
            }));
            return this.success(res, formatted);
        } catch (err) {
            return this.error(res, "Failed to fetch appointments", 500, err);
        }
    };

    updateAppointmentStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await this.hospitalOperationsService.updateAppointmentStatus(id, status);
            return this.success(res, { success: true, status: updated.status });
        } catch (err) {
            return this.error(res, "Failed to update appointment status", 500, err);
        }
    };

    getMyHospital = async (req, res) => {
        try {
            const adminId = req.user.id;
            const hospital = await this.hospitalOperationsService.getMyHospitalByAdmin(adminId);
            if (!hospital) return this.error(res, "Hospital not found for this admin", 404);
            return this.success(res, hospital);
        } catch (err) {
            return this.error(res, "Failed to fetch admin's hospital", 500, err);
        }
    };

    createHospital = async (req, res) => {
        try {
            const hospital = await this.hospitalOperationsService.createHospital(req.body);
            return this.success(res, hospital, "Hospital created successfully", 201);
        } catch (err) {
            return this.error(res, "Failed to create hospital", 500, err);
        }
    };

    getAllHospitals = async (req, res) => {
        try {
            const hospitals = await this.hospitalOperationsService.getAllHospitals();
            return this.success(res, hospitals);
        } catch (err) {
            return this.error(res, "Failed to fetch hospitals", 500, err);
        }
    };

    getHospitalById = async (req, res) => {
        try {
            const { id } = req.params;
            const hospital = await this.hospitalOperationsService.getHospitalById(id);
            if (!hospital) return this.error(res, "Hospital not found", 404);
            return this.success(res, hospital);
        } catch (err) {
            return this.error(res, "Failed to fetch hospital details", 500, err);
        }
    };

    updateHospital = async (req, res) => {
        try {
            const { id } = req.params;
            const hospital = await this.hospitalOperationsService.updateHospital(id, req.body);
            return this.success(res, hospital);
        } catch (err) {
            return this.error(res, "Failed to update hospital", 500, err);
        }
    };

    deleteHospital = async (req, res) => {
        try {
            const { id } = req.params;
            await this.hospitalOperationsService.deleteHospital(id);
            return this.success(res, { message: 'Hospital deleted' });
        } catch (err) {
            return this.error(res, "Failed to delete hospital", 500, err);
        }
    };
}
