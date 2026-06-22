import { BaseController } from './BaseController.js';
import { AdminService } from '../services/admin.service.js';

export class AdminController extends BaseController {
    constructor() {
        super();
        this.adminService = new AdminService();
    }

    getStats = async (req, res) => {
        try {
            const stats = await this.adminService.getStats();
            return this.success(res, stats);
        } catch (err) {
            return this.error(res, "Failed to fetch stats", 500, err);
        }
    };

    getAllUsers = async (req, res) => {
        try {
            const users = await this.adminService.getAllUsers();
            return this.success(res, users);
        } catch (err) {
            return this.error(res, "Failed to fetch users", 500, err);
        }
    };

    getAllDoctors = async (req, res) => {
        try {
            const doctors = await this.adminService.getAllDoctors();
            return this.success(res, doctors);
        } catch (err) {
            return this.error(res, "Failed to fetch doctors", 500, err);
        }
    };

    createDoctor = async (req, res) => {
        try {
            const doctor = await this.adminService.createDoctor(req.body);
            return this.success(res, doctor, "Doctor created successfully", 201);
        } catch (err) {
            console.error("CREATE DOCTOR ERROR:", err);
            return this.error(res, "Failed to create doctor", 500, err);
        }
    };

    updateDoctor = async (req, res) => {
        try {
            const { id } = req.params;
            const doctor = await this.adminService.updateDoctor(id, req.body);
            return this.success(res, doctor);
        } catch (err) {
            return this.error(res, "Failed to update doctor", 500, err);
        }
    };

    deleteDoctor = async (req, res) => {
        try {
            const { id } = req.params;
            await this.adminService.deleteDoctor(id);
            return this.success(res, { message: 'Doctor deleted successfully' });
        } catch (err) {
            return this.error(res, "Failed to delete doctor", 500, err);
        }
    };

    createPatient = async (req, res) => {
        try {
            const user = await this.adminService.createPatient(req.body);
            return this.success(res, user, "Patient created successfully", 201);
        } catch (err) {
            return this.error(res, "Failed to create patient", 500, err);
        }
    };

    updatePatient = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await this.adminService.updatePatient(id, req.body);
            return this.success(res, user);
        } catch (err) {
            return this.error(res, "Failed to update patient", 500, err);
        }
    };

    deletePatient = async (req, res) => {
        try {
            const { id } = req.params;
            await this.adminService.deletePatient(id);
            return this.success(res, { message: 'Patient deleted successfully' });
        } catch (err) {
            return this.error(res, "Failed to delete patient", 500, err);
        }
    };
}
