import { BaseService } from '../../shared/BaseService.js';
import { createMedicineEvents } from '../../integrations/calendar.service.js';

export class MedicationContinuityService extends BaseService {
    async checkAppointment(doctorId, patientId) {
        return await this.prisma.appointment.findFirst({
            where: {
                doctorId,
                userId: patientId
            }
        });
    }

    async addPrescription(doctorId, patientId, medicineData) {
        const appointment = await this.checkAppointment(doctorId, patientId);
        if (!appointment) return null;

        return await this.prisma.medicine.create({
            data: {
                medName: medicineData.medName,
                description: medicineData.description || '',
                dose: medicineData.dose,
                frequency: medicineData.frequency,
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
            where: { id: medId },
            data: {
                medName: medicineData.medName,
                description: medicineData.description || '',
                dose: medicineData.dose,
                frequency: medicineData.frequency,
                startDate: new Date(medicineData.startDate),
                endDate: new Date(medicineData.endDate)
            }
        });
    }

    async syncCalendar(medicines, userEmail) {
        return await createMedicineEvents(medicines, userEmail);
    }
}
