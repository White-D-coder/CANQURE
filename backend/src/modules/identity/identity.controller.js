import { BaseController } from '../../shared/BaseController.js';
import { IdentityService } from './identity.service.js';

export class IdentityController extends BaseController {
    constructor() {
        super();
        this.identityService = new IdentityService();
    }

    signup = async (req, res) => {
        try {
            const { username, email, password } = req.body;
            const result = await this.identityService.registerPatient({ username, email, password });
            return this.success(res, result, "User created successfully", 201);
        } catch (err) {
            return this.error(res, err.message, 400, err);
        }
    };

    login = async (req, res) => {
        try {
            const { identifier, password } = req.body;
            const result = await this.identityService.login({ identifier, password });
            return this.success(res, result, "Login successful");
        } catch (err) {
            return this.error(res, err.message, 401, err);
        }
    };

    getStats = async (req, res) => {
        try {
            const stats = await this.identityService.getStats();
            return this.success(res, stats);
        } catch (err) {
            return this.error(res, "Failed to fetch stats", 500, err);
        }
    };

    getAllUsers = async (req, res) => {
        try {
            const users = await this.identityService.getAllUsers();
            return this.success(res, users);
        } catch (err) {
            return this.error(res, "Failed to fetch users", 500, err);
        }
    };

    getAllDoctors = async (req, res) => {
        try {
            const doctors = await this.identityService.getAllDoctors();
            return this.success(res, doctors);
        } catch (err) {
            return this.error(res, "Failed to fetch doctors", 500, err);
        }
    };

    createDoctor = async (req, res) => {
        try {
            const doctor = await this.identityService.createDoctor(req.body);
            return this.success(res, doctor, "Doctor created successfully", 201);
        } catch (err) {
            return this.error(res, "Failed to create doctor", 500, err);
        }
    };

    updateDoctor = async (req, res) => {
        try {
            const { id } = req.params;
            const doctor = await this.identityService.updateDoctor(id, req.body);
            return this.success(res, doctor);
        } catch (err) {
            return this.error(res, "Failed to update doctor", 500, err);
        }
    };

    deleteDoctor = async (req, res) => {
        try {
            const { id } = req.params;
            await this.identityService.deleteDoctor(id);
            return this.success(res, { message: 'Doctor deleted successfully' });
        } catch (err) {
            return this.error(res, "Failed to delete doctor", 500, err);
        }
    };

    createPatient = async (req, res) => {
        try {
            const user = await this.identityService.createPatient(req.body);
            return this.success(res, user, "Patient created successfully", 201);
        } catch (err) {
            return this.error(res, "Failed to create patient", 500, err);
        }
    };

    updatePatient = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await this.identityService.updatePatient(id, req.body);
            return this.success(res, user);
        } catch (err) {
            return this.error(res, "Failed to update patient", 500, err);
        }
    };

    deletePatient = async (req, res) => {
        try {
            const { id } = req.params;
            await this.identityService.deletePatient(id);
            return this.success(res, { message: 'Patient deleted successfully' });
        } catch (err) {
            return this.error(res, "Failed to delete patient", 500, err);
        }
    };
}
