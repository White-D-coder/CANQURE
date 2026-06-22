import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmins() {
    const admins = await prisma.admin.findMany();
    console.log("ADMINS IN DB:", JSON.stringify(admins, null, 2));
    await prisma.$disconnect();
}

checkAdmins();
