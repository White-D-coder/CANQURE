import { BaseController } from './BaseController.js';
import { ScheduleService } from '../services/schedule.service.js';

export class ScheduleController extends BaseController {
    constructor() {
        super();
        this.scheduleService = new ScheduleService();
    }

    createTimeSlots = async (req, res) => {
        try {
            const { doctorId, date, slots } = req.body;

            if (!doctorId || !date || !slots || !Array.isArray(slots)) {
                return this.error(res, "Doctor ID, Date, and Slots array are required", 400);
            }

            const createdSlots = [];
            for (const time of slots) {
                const existing = await this.scheduleService.findExistingSlot(doctorId, date, time);

                if (!existing) {
                    const slot = await this.scheduleService.createSlot({ doctorId, date, time });
                    createdSlots.push(slot);
                }
            }

            return this.success(res, { message: "Time slots created", createdSlots }, "Success", 201);
        } catch (err) {
            return this.error(res, "Failed to create time slots", 500, err);
        }
    };

    updateSlotStatus = async (req, res) => {
        try {
            const { slotId, status } = req.body;

            if (!slotId || !status) {
                return this.error(res, "Slot ID and Status are required", 400);
            }

            const slot = await this.scheduleService.updateSlotStatus(slotId, status);
            return this.success(res, { message: "Slot status updated", slot });
        } catch (err) {
            return this.error(res, "Failed to update slot status", 500, err);
        }
    };

    getDoctorSlots = async (req, res) => {
        try {
            const { doctorId, date } = req.query;

            if (!doctorId) {
                return this.error(res, "Doctor ID is required", 400);
            }

            const slots = await this.scheduleService.getDoctorSlots(doctorId, date);
            return this.success(res, slots);
        } catch (err) {
            return this.error(res, "Failed to fetch slots", 500, err);
        }
    };

    approveSlot = async (req, res) => {
        try {
            const { slotId } = req.body;
            const doctorId = req.user.id; // Assumes verified middleware adds user info

            const slot = await this.scheduleService.getSlotById(slotId);

            if (!slot) {
                return this.error(res, "Slot not found", 404);
            }

            if (slot.doctorId !== doctorId) {
                return this.error(res, "Unauthorized to approve this slot", 403);
            }

            const updatedSlot = await this.scheduleService.updateSlotStatus(slotId, 'AVAILABLE');
            return this.success(res, { message: "Slot approved", slot: updatedSlot });
        } catch (err) {
            return this.error(res, "Failed to approve slot", 500, err);
        }
    };
}
