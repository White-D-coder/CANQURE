import { prisma } from '../src/db/prisma.js';

async function showData() {
    try {
        console.log("--- ADMINS ---");
        const admins = await prisma.admin.findMany();
        console.table(admins);

        console.log("\n--- DOCTORS ---");
        const doctors = await prisma.doctor.findMany();
        console.table(doctors);

        console.log("\n--- PATIENTS (Users) ---");
        const users = await prisma.user.findMany();
        console.table(users);

    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

showData();
