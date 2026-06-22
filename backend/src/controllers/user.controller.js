import { BaseController } from './BaseController.js';
import { UserService } from '../services/user.service.js';

export class UserController extends BaseController {
    constructor() {
        super();
        this.userService = new UserService();
    }

    getAllDoctors = async (req, res) => {
        try {
            const doctors = await this.userService.getAllDoctors();
            return this.success(res, doctors);
        } catch (err) {
            return this.error(res, "Failed to fetch doctors", 500, err);
        }
    };

    bookAppointment = async (req, res) => {
        try {
            const userId = req.user.id;
            const { doctorId, date, time, patientName } = req.body;

            if (!doctorId || !date || !time || !patientName) {
                return this.error(res, "All fields are required", 400);
            }

            const timeSlot = await this.userService.getAvailableTimeSlot(doctorId, date, time);

            if (!timeSlot) {
                return this.error(res, "This time slot is not available", 400);
            }

            const appointment = await this.userService.bookAppointment(
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

            if (!doctorId || !date) {
                return this.error(res, "Doctor ID and Date are required", 400);
            }

            const slots = await this.userService.getDoctorSlots(doctorId, date);
            const availableSlots = slots.filter(s => s.status === 'AVAILABLE').map(s => s.time);
            const isFull = availableSlots.length === 0;

            return this.success(res, { isFull, availableSlots, allSlots: slots });
        } catch (err) {
            return this.error(res, "Failed to fetch availability", 500, err);
        }
    };

    getPatientDashboard = async (req, res) => {
        try {
            const userId = req.user.id;
            const patient = await this.userService.getPatientDashboard(userId);

            if (!patient) {
                return this.error(res, "Patient not found", 404);
            }

            return this.success(res, patient);
        } catch (err) {
            return this.error(res, "Failed to fetch dashboard", 500, err);
        }
    };
}
