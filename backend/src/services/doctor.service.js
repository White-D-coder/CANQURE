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

        // 1. Create the Medicine record
        const medicine = await this.prisma.medicine.create({
            data: {
                ...medicineData,
                startDate: new Date(medicineData.startDate),
                endDate: new Date(medicineData.endDate),
                userId: patientId,
                doctorId: doctorId
            }
        });

        // 2. Fetch the patient name
        const user = await this.prisma.user.findUnique({
            where: { id: patientId }
        });
        const patientName = user?.name || user?.username || "John Patient";

        // 3. Select a partner pharmacy (default: Apollo Pharmacy)
        let pharmacy = await this.prisma.pharmacy.findFirst({
            where: { name: 'Apollo Pharmacy' }
        });
        if (!pharmacy) {
            pharmacy = await this.prisma.pharmacy.findFirst();
        }

        // 4. Calculate deterministic price based on drug name
        const hash = medicineData.medName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const generatedPrice = 200 + (hash % 15) * 150;
        const priceStr = `₹${generatedPrice.toLocaleString('en-IN')}`;

        // 5. Calculate remaining days
        const daysRemaining = Math.max(1, Math.ceil((new Date(medicineData.endDate) - new Date(medicineData.startDate)) / (1000 * 86400)));

        if (pharmacy) {
            // Create a pending Refill Order routed to the pharmacy dashboard
            await this.prisma.refillOrder.create({
                data: {
                    medName: medicineData.medName,
                    patientName: patientName,
                    patientId: patientId,
                    pharmacyId: pharmacy.id,
                    price: priceStr,
                    deliveryTime: "30 mins",
                    daysRemaining: daysRemaining,
                    status: "PENDING",
                    medicineId: medicine.id
                }
            });
            console.log(`[Integration Service] Automatically routed refill order for ${medicineData.medName} to ${pharmacy.name}.`);
        }

        return medicine;
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
