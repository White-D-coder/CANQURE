import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL missing");
}

if (!process.env.JWT_SECRET) {
    console.log("JWT missing");
}

const prisma = new PrismaClient();

try {
    await prisma.$connect();
    console.log("connected");
} catch (err) {
    console.log("connection failed:", err.message);
} finally {
    await prisma.$disconnect();
}
