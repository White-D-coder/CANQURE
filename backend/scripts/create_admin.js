import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const username = 'admin';
        const password = 'adminpassword';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.upsert({
            where: { username: username },
            update: {},
            create: {
                username: username,
                password: hashedPassword
            }
        });

        console.log('Admin created/verified:');
        console.log('Username:', admin.username);
        console.log('Password:', password);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
