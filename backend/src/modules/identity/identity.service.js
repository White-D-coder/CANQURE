import { BaseService } from '../../shared/BaseService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class IdentityService extends BaseService {
    async registerPatient({ username, email, password }) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });
        if (existing) {
            throw new Error("User or Email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                name: username,
                email,
                password: hashedPassword,
                role: 'PATIENT'
            }
        });

        const token = jwt.sign({ id: newUser.id, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
        return {
            token,
            role: 'patient',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: 'patient'
            }
        };
    }

    async login({ identifier, password }) {
        // 1. Check Admin
        const admin = await this.prisma.admin.findUnique({
            where: { username: identifier },
            include: { pharmacy: true, hospital: true }
        });
        if (admin) {
            const isMatch = password === admin.password || await bcrypt.compare(password, admin.password);
            if (isMatch) {
                let role = 'admin';
                if (admin.role === 'HOSPITAL_ADMIN') role = 'hospital_admin';
                if (admin.role === 'PHARMACY_ADMIN') role = 'pharmacy';
                
                const pharmacyName = admin.pharmacy?.name || null;
                const token = jwt.sign(
                    { id: admin.id, role, pharmacyName },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                return {
                    token,
                    role,
                    user: {
                        id: admin.id,
                        username: admin.username,
                        role,
                        pharmacyName
                    }
                };
            }
        }

        // 2. Check Doctor
        const doctor = await this.prisma.doctor.findFirst({
            where: { OR: [{ email: identifier }, { username: identifier }] }
        });
        if (doctor) {
            const isMatch = password === doctor.password || await bcrypt.compare(password, doctor.password);
            if (isMatch) {
                const token = jwt.sign({ id: doctor.id, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
                return {
                    token,
                    role: 'doctor',
                    user: {
                        id: doctor.id,
                        name: doctor.name,
                        email: doctor.email,
                        role: 'doctor'
                    }
                };
            }
        }

        // 3. Check Patient
        const user = await this.prisma.user.findFirst({
            where: { OR: [{ email: identifier }, { username: identifier }] }
        });
        if (user) {
            const isMatch = password === user.password || await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user.id, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
                return {
                    token,
                    role: 'patient',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: 'patient'
                    }
                };
            }
        }

        throw new Error("Invalid credentials");
    }

    async getStats() {
        const doctorCount = await this.prisma.doctor.count();
        const userCount = await this.prisma.user.count();
        const appointmentCount = await this.prisma.appointment.count();

        return {
            doctors: doctorCount,
            patients: userCount,
            appointments: appointmentCount
        };
    }

    async getAllUsers() {
        return await this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: { appointments: true } // updated in new schema
                }
            }
        });
    }

    async getAllDoctors() {
        return await this.prisma.doctor.findMany({
            select: {
                id: true,
                name: true,
                specialist: true,
                experience: true,
                email: true,
                hospital: {
                    select: { name: true }
                },
                _count: {
                    select: { appointments: true }
                }
            }
        });
    }

    async createDoctor(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        let doctorName = data.name;
        if (doctorName && !doctorName.startsWith('Dr. ')) {
            doctorName = `Dr. ${doctorName}`;
        }

        const existingDoctor = await this.prisma.doctor.findUnique({
            where: { email: data.email }
        });

        if (existingDoctor) {
            throw new Error(`Doctor with email ${data.email} already exists`);
        }

        return await this.prisma.doctor.create({
            data: {
                name: doctorName,
                username: data.username || data.email,
                specialist: data.specialist,
                experience: parseInt(data.experience) || 0,
                email: data.email,
                password: hashedPassword,
                hospitalId: (data.hospitalId && data.hospitalId !== "") ? data.hospitalId : null,
                role: 'DOCTOR'
            }
        });
    }

    async updateDoctor(id, data) {
        let doctorName = data.name;
        if (doctorName && !doctorName.startsWith('Dr. ')) {
            doctorName = `Dr. ${doctorName}`;
        }

        const updateData = {
            name: doctorName,
            specialist: data.specialist,
            experience: parseInt(data.experience) || 0,
            email: data.email,
            hospitalId: (data.hospitalId && data.hospitalId !== "") ? data.hospitalId : null
        };
        if (data.password && data.password !== "") {
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        return await this.prisma.doctor.update({
            where: { id },
            data: updateData
        });
    }

    async deleteDoctor(id) {
        return await this.prisma.doctor.delete({
            where: { id }
        });
    }

    async createPatient(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'PATIENT'
            }
        });
    }

    async updatePatient(id, data) {
        const updateData = { name: data.name, email: data.email };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        return await this.prisma.user.update({
            where: { id },
            data: updateData
        });
    }

    async deletePatient(id) {
        return await this.prisma.user.delete({
            where: { id }
        });
    }
}
