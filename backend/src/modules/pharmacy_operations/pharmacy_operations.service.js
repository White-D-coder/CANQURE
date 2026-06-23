import { BaseService } from '../../shared/BaseService.js';

export class PharmacyOperationsService extends BaseService {
    async createRefillOrder(patientId, { medName, pharmacyName, price, deliveryTime, daysRemaining }) {
        const user = await this.prisma.user.findUnique({
            where: { id: patientId }
        });
        if (!user) throw new Error("Patient not found");

        const pharmacy = await this.prisma.pharmacy.findFirst({
            where: { name: pharmacyName }
        });
        if (!pharmacy) throw new Error(`Pharmacy '${pharmacyName}' not found`);

        return await this.prisma.refillOrder.create({
            data: {
                medName,
                patientName: user.name || user.username || "Anonymous Patient",
                patientId,
                pharmacyId: pharmacy.id,
                price,
                deliveryTime,
                daysRemaining: daysRemaining !== undefined ? Number(daysRemaining) : 5,
                status: "PENDING"
            }
        });
    }

    async getPatientRefillOrders(patientId) {
        return await this.prisma.refillOrder.findMany({
            where: { patientId },
            include: { pharmacy: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getPharmacyRefillOrders(pharmacyName) {
        const filter = {};
        if (pharmacyName) {
            const pharmacy = await this.prisma.pharmacy.findFirst({
                where: { name: pharmacyName }
            });
            if (pharmacy) {
                filter.pharmacyId = pharmacy.id;
            } else {
                return []; // No pharmacy matches the name
            }
        }

        return await this.prisma.refillOrder.findMany({
            where: filter,
            include: { pharmacy: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateRefillOrderStatus(id, status) {
        return await this.prisma.refillOrder.update({
            where: { id },
            data: { status }
        });
    }
}
