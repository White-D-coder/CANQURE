import { BaseService } from '../../shared/BaseService.js';

export class EmergencyService extends BaseService {
    async getHospitals() {
        return await this.prisma.hospital.findMany({
            include: {
                doctors: true
            }
        });
    }

    async createSosAlert({ userId, patientName, address, patientLat, patientLng, hospitalId, routePath, clinicalBrief }) {
        return await this.prisma.sosAlert.create({
            data: {
                status: 'PENDING',
                patientName,
                address: address || 'Resolved Emergency Location',
                patientLat: parseFloat(patientLat) || 28.6272,
                patientLng: parseFloat(patientLng) || 77.3726,
                hospitalId,
                userId,
                routePath: routePath || null,
                clinicalBrief: clinicalBrief || 'Oncology SOS Intake'
            }
        });
    }

    async getActiveAlert(userId, hospitalId) {
        const where = {
            status: { not: 'RESOLVED' }
        };
        if (userId) where.userId = userId;
        if (hospitalId) where.hospitalId = hospitalId;

        return await this.prisma.sosAlert.findFirst({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateAmbulance(id, { lat, lng, routePath, status }) {
        const updateData = {};
        if (lat !== undefined) updateData.ambulanceLat = parseFloat(lat);
        if (lng !== undefined) updateData.ambulanceLng = parseFloat(lng);
        if (routePath !== undefined) updateData.routePath = routePath;
        if (status !== undefined) updateData.status = status;

        return await this.prisma.sosAlert.update({
            where: { id },
            data: updateData
        });
    }
}
