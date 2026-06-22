import { BaseService } from './BaseService.js';

export class UserService extends BaseService {
    async getAllDoctors() {
        return await this.prisma.doctor.findMany({
            select: {
                doctorId: true,
                name: true,
                specialist: true,
                experience: true
            }
        });
    }

    async getAvailableTimeSlot(doctorId, date, time) {
        return await this.prisma.timeSlot.findFirst({
            where: {
                doctorId,
                date,
                time,
                status: 'AVAILABLE'
            }
        });
    }

    async bookAppointment(doctorId, userId, date, time, patientName, timeSlotId) {
        return await this.prisma.$transaction(async (prisma) => {
            const appointment = await prisma.appointment.create({
                data: {
                    date,
                    time,
                    patientName,
                    doctorId,
                    userId,
                    timeSlotId: timeSlotId
                }
            });

            await prisma.timeSlot.update({
                where: { id: timeSlotId },
                data: { status: 'BOOKED' }
            });

            return appointment;
        });
    }

    async getDoctorSlots(doctorId, date) {
        return await this.prisma.timeSlot.findMany({
            where: {
                doctorId: doctorId,
                date: date
            },
            select: {
                time: true,
                status: true
            }
        });
    }

    async getPatientDashboard(userId) {
        return await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                Appointments: {
                    include: {
                        doctor: {
                            select: {
                                name: true,
                                specialist: true
                            }
                        }
                    }
                },
                medicines: {
                    include: {
                        doctor: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                Reports: {
                    include: {
                        doctor: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                CancerType: true
            }
        });
    }
}
