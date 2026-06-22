import { prisma } from '../src/db/prisma.js';

async function checkProvider() {
    try {
        console.log('Provider:', prisma._clientEngineType);
        await prisma.$connect();
        console.log('Connected successfully.');
        const count = await prisma.doctor.count();
        console.log('Doctor count:', count);
    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProvider();
