import { prisma } from '../src/db/prisma.js';

async function showData() {
    try {
        console.log('--- USERS (Patients) ---');
        const users = await prisma.user.findMany({ include: { medicines: true, Appointments: true, Reports: true } });
        console.dir(users, { depth: null });

        console.log('\n--- DOCTORS ---');
        const doctors = await prisma.doctor.findMany({ include: { appointments: true, medicines: true } });
        console.dir(doctors, { depth: null });

        console.log('\n--- APPOINTMENTS ---');
        const appointments = await prisma.appointment.findMany();
        console.dir(appointments, { depth: null });

        console.log('\n--- MEDICINES ---');
        const medicines = await prisma.medicine.findMany();
        console.dir(medicines, { depth: null });

        console.log('\n--- ADMINS ---');
        const admins = await prisma.admin.findMany();
        console.dir(admins, { depth: null });

    } catch (e) {
        console.error('Error fetching data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

showData();
