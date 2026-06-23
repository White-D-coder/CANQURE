import { BaseService } from '../../shared/BaseService.js';

export class HospitalOperationsService extends BaseService {
    async getDashboardAppointments() {
        return await this.prisma.appointment.findMany({
            include: {
                doctor: true,
                user: true
            },
            orderBy: { id: 'desc' }
        });
    }

    async updateAppointmentStatus(appointmentId, status) {
        const currentApt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
        
        if (currentApt && currentApt.status === 'SOS_BROADCAST' && status === 'ACCEPTED') {
            // Cancel other broadcasts for this user on the same date
            await this.prisma.appointment.updateMany({
                where: {
                    userId: currentApt.userId,
                    date: currentApt.date,
                    status: 'SOS_BROADCAST',
                    id: { not: currentApt.id }
                },
                data: { status: 'CANCELLED_SOS' }
            });
        }

        return await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status }
        });
    }

    async createHospital(data) {
        return await this.prisma.hospital.create({
            data: {
                name: data.name,
                address: data.address,
                city: data.city,
                contact: data.contact,
                email: data.email || null,
                bedsAvailable: parseInt(data.bedsAvailable) || 0,
                facilities: data.facilities || [],
                latitude: parseFloat(data.latitude) || 28.5300,
                longitude: parseFloat(data.longitude) || 77.2000
            }
        });
    }

    async getAllHospitals() {
        return await this.prisma.hospital.findMany({
            include: {
                _count: {
                    select: { doctors: true }
                }
            }
        });
    }

    async getHospitalById(id) {
        return await this.prisma.hospital.findUnique({
            where: { id },
            include: {
                doctors: true,
                appointments: {
                    include: {
                        doctor: true,
                        user: true
                    }
                }
            }
        });
    }

    async updateHospital(id, data) {
        return await this.prisma.hospital.update({
            where: { id },
            data: {
                name: data.name,
                address: data.address,
                city: data.city,
                contact: data.contact,
                email: data.email || null,
                bedsAvailable: data.bedsAvailable !== undefined ? parseInt(data.bedsAvailable) : undefined,
                facilities: data.facilities || undefined,
                latitude: data.latitude !== undefined ? parseFloat(data.latitude) : undefined,
                longitude: data.longitude !== undefined ? parseFloat(data.longitude) : undefined
            }
        });
    }

    async deleteHospital(id) {
        return await this.prisma.hospital.delete({
            where: { id }
        });
    }
}
