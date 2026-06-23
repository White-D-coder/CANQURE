import { BaseController } from '../../shared/BaseController.js';
import { ConsultationsService } from './consultations.service.js';

export class ConsultationsController extends BaseController {
    constructor() {
        super();
        this.consultationsService = new ConsultationsService();
    }

    getAllDoctors = async (req, res) => {
        try {
            const doctors = await this.consultationsService.getAllDoctors();
            return this.success(res, doctors);
        } catch (err) {
            return this.error(res, "Failed to fetch doctors", 500, err);
        }
    };

    getDoctorById = async (req, res) => {
        try {
            const { id } = req.params;
            const doctor = await this.consultationsService.getDoctorById(id);
            if (!doctor) return this.error(res, "Doctor not found", 404);
            return this.success(res, doctor);
        } catch (err) {
            return this.error(res, "Failed to fetch doctor", 500, err);
        }
    };

    getDoctorAppointments = async (req, res) => {
        try {
            const { id } = req.params;
            const appointments = await this.consultationsService.getDoctorAppointments(id);
            return this.success(res, appointments);
        } catch (err) {
            return this.error(res, "Failed to fetch appointments", 500, err);
        }
    };

    getPatientDetails = async (req, res) => {
        try {
            const { doctorId, patientId } = req.params;
            const patientData = await this.consultationsService.getPatientDetails(doctorId, patientId);
            if (!patientData) {
                return this.error(res, "Access denied or patient not found.", 403);
            }
            return this.success(res, patientData);
        } catch (err) {
            return this.error(res, "Failed to fetch patient details", 500, err);
        }
    };

    createTimeSlots = async (req, res) => {
        try {
            const { doctorId, date, slots } = req.body;
            if (!doctorId || !date || !slots || !Array.isArray(slots)) {
                return this.error(res, "Doctor ID, Date and Slots array are required", 400);
            }

            const created = [];
            for (const time of slots) {
                const existing = await this.consultationsService.findExistingSlot(doctorId, date, time);
                if (!existing) {
                    const slot = await this.consultationsService.createSlot({ doctorId, date, time });
                    created.push(slot);
                }
            }
            return this.success(res, { message: `${created.length} slots created successfully`, created }, "Success", 201);
        } catch (err) {
            return this.error(res, "Failed to create slots", 500, err);
        }
    };

    updateSlotStatus = async (req, res) => {
        try {
            const { slotId, status } = req.body;
            if (!slotId || !status) {
                return this.error(res, "Slot ID and Status are required", 400);
            }
            const updated = await this.consultationsService.updateSlotStatus(slotId, status);
            return this.success(res, updated);
        } catch (err) {
            return this.error(res, "Failed to update slot", 500, err);
        }
    };

    getDoctorSlots = async (req, res) => {
        try {
            const { doctorId, date } = req.query;
            if (!doctorId) return this.error(res, "Doctor ID is required", 400);
            const slots = await this.consultationsService.getDoctorSlots(doctorId, date);
            return this.success(res, slots);
        } catch (err) {
            return this.error(res, "Failed to fetch slots", 500, err);
        }
    };

    bookAppointment = async (req, res) => {
        try {
            const userId = req.user.id;
            const { doctorId, date, time, patientName } = req.body;

            if (!doctorId || !date || !time || !patientName) {
                return this.error(res, "All fields are required", 400);
            }

            const timeSlot = await this.consultationsService.getAvailableTimeSlot(doctorId, date, time);
            if (!timeSlot) return this.error(res, "This time slot is not available", 400);

            const appointment = await this.consultationsService.bookAppointment(
                doctorId,
                userId,
                date,
                time,
                patientName,
                timeSlot.id
            );

            return this.success(res, { message: "Appointment booked successfully", appointment }, "Success", 201);
        } catch (err) {
            return this.error(res, "Failed to book appointment", 500, err);
        }
    };

    getDoctorAvailability = async (req, res) => {
        try {
            const { doctorId, date } = req.query;
            if (!doctorId || !date) return this.error(res, "Doctor ID and Date are required", 400);

            const slots = await this.consultationsService.getDoctorSlots(doctorId, date);
            const availableSlots = slots.filter(s => s.status === 'AVAILABLE').map(s => s.time);
            const isFull = availableSlots.length === 0;

            return this.success(res, { isFull, availableSlots, allSlots: slots });
        } catch (err) {
            return this.error(res, "Failed to fetch availability", 500, err);
        }
    };

    // --- Live Consultations Scribing ---
    startConsultation = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const appointment = await this.consultationsService.startConsultation(appointmentId);
            return this.success(res, { message: "Consultation started", appointment });
        } catch (err) {
            return this.error(res, err.message, 500, err);
        }
    };

    saveTranscript = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const { text } = req.body;
            await this.consultationsService.saveTranscriptChunk(appointmentId, text);
            return this.success(res, { message: "Transcript updated" });
        } catch (err) {
            return this.error(res, err.message, 500, err);
        }
    };

    generateSummary = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const appointment = await this.consultationsService.generateSummary(appointmentId);
            return this.success(res, { message: "Summary generated", appointment });
        } catch (err) {
            return this.error(res, "Failed to generate AI summary", 500, err);
        }
    };

    rerouteAppointment = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const appointment = await this.consultationsService.rerouteAppointment(appointmentId);
            return this.success(res, { message: "Patient rerouted successfully", appointment });
        } catch (err) {
            return this.error(res, err.message, 500, err);
        }
    };

    emergencyEscalate = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const appointment = await this.consultationsService.emergencyEscalate(appointmentId);
            return this.success(res, { message: "Emergency escalation successful", appointment });
        } catch (err) {
            return this.error(res, err.message, 500, err);
        }
    };
}
