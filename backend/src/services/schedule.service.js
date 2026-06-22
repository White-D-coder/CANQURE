import { BaseService } from './BaseService.js';

export class ScheduleService extends BaseService {
    async findExistingSlot(doctorId, date, time) {
        return await this.prisma.timeSlot.findFirst({
            where: { doctorId, date, time }
        });
    }

    async createSlot(data) {
        return await this.prisma.timeSlot.create({
            data: {
                doctorId: data.doctorId,
                date: data.date,
                time: data.time,
                status: 'PENDING'
            }
        });
    }

    async updateSlotStatus(slotId, status) {
        return await this.prisma.timeSlot.update({
            where: { id: slotId },
            data: { status }
        });
    }

    async getDoctorSlots(doctorId, date) {
        const where = { doctorId };
        if (date) where.date = date;

        return await this.prisma.timeSlot.findMany({
            where,
            orderBy: { time: 'asc' }
        });
    }

    async getSlotById(slotId) {
        return await this.prisma.timeSlot.findUnique({
            where: { id: slotId }
        });
    }
}
