import { BaseService } from './BaseService.js';

export class DoctorService extends BaseService {
    async getAllDoctors() {
        return await this.prisma.doctor.findMany();
    }

    async getDoctorById(id) {
        return await this.prisma.doctor.findUnique({
            where: { doctorId: id }
        });
    }

    async getDoctorAppointments(doctorId) {
        return await this.prisma.appointment.findMany({
            where: { doctorId: doctorId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }

    async checkAppointment(doctorId, patientId) {
        return await this.prisma.appointment.findFirst({
            where: {
                doctorId: doctorId,
                userId: patientId
            }
        });
    }

    async getPatientDetails(doctorId, patientId) {
        console.log("Fetching user details for:", patientId);
        const user = await this.prisma.user.findUnique({
            where: { id: patientId },
            include: {
                medicines: true,
                CancerType: true,
                Reports: true,
                Appointments: true // Fetch all appointments for dashboard display
            }
        });

        if (!user) {
            console.log("User not found in findUnique");
        }

        return user;
    }

    async addPrescription(doctorId, patientId, medicineData) {
        const appointment = await this.checkAppointment(doctorId, patientId);
        if (!appointment) return null;

        return await this.prisma.medicine.create({
            data: {
                ...medicineData,
                startDate: new Date(medicineData.startDate),
                endDate: new Date(medicineData.endDate),
                userId: patientId,
                doctorId: doctorId
            }
        });
    }

    async updatePrescription(doctorId, patientId, medId, medicineData) {
        const appointment = await this.checkAppointment(doctorId, patientId);
        if (!appointment) return null;

        return await this.prisma.medicine.update({
            where: { medId: medId },
            data: {
                ...medicineData,
                startDate: new Date(medicineData.startDate),
                endDate: new Date(medicineData.endDate)
            }
        });
    }
}
