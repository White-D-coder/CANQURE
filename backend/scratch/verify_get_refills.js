import { PrismaClient } from '@prisma/client';
import { PharmacyOperationsService } from '../src/modules/pharmacy_operations/pharmacy_operations.service.js';

const prisma = new PrismaClient();
const service = new PharmacyOperationsService();

async function run() {
    try {
        const user = await prisma.user.findFirst({
            where: { role: 'PATIENT' }
        });
        if (!user) {
            console.error("No patient found");
            return;
        }
        console.log("Calling getPatientRefillOrders for patient:", user.id);
        const results = await service.getPatientRefillOrders(user.id);
        console.log("Success! Found orders:", results.length);
    } catch (e) {
        console.error("CRASH TRACE:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
