import { BaseController } from './BaseController.js';
import { DoctorService } from '../services/doctor.service.js';

export class DoctorController extends BaseController {
    constructor() {
        super();
        this.doctorService = new DoctorService();
    }

    getDoctors = async (req, res) => {
        try {
            const doctors = await this.doctorService.getAllDoctors();
            return this.success(res, doctors);
        } catch (err) {
            return this.error(res, "Failed to fetch doctors", 500, err);
        }
    };

    getDoctorById = async (req, res) => {
        try {
            const { id } = req.params;
            const doctor = await this.doctorService.getDoctorById(id);
            if (!doctor) {
                return this.error(res, "Doctor not found", 404);
            }
            return this.success(res, doctor);
        } catch (err) {
            return this.error(res, "Failed to fetch doctor", 500, err);
        }
    };

    getDoctorAppointments = async (req, res) => {
        try {
            const { id } = req.params;
            const appointments = await this.doctorService.getDoctorAppointments(id);
            return this.success(res, appointments);
        } catch (err) {
            return this.error(res, "Failed to fetch appointments", 500, err);
        }
    };

    getPatientDetails = async (req, res) => {
        try {
            const { doctorId, patientId } = req.params;
            console.log("getPatientDetails called:", { doctorId, patientId });
            const patientData = await this.doctorService.getPatientDetails(doctorId, patientId);

            if (!patientData) {
                console.log("No patient data found for:", { doctorId, patientId });
                return this.error(res, "Access denied. No appointment found with this patient.", 403);
            }

            return this.success(res, patientData);
        } catch (err) {
            return this.error(res, "Failed to fetch patient details", 500, err);
        }
    };

    addPrescription = async (req, res) => {
        try {
            const { id, patientId } = req.params;
            const medicine = await this.doctorService.addPrescription(id, patientId, req.body);

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
            const medicine = await this.doctorService.updatePrescription(id, patientId, medId, req.body);

            if (!medicine) {
                return this.error(res, "Access denied. No appointment found with this patient.", 403);
            }

            return this.success(res, medicine);
        } catch (err) {
            return this.error(res, "Failed to update prescription", 500, err);
        }
    };
}
