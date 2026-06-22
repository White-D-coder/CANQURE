import { BaseService } from './BaseService.js';
import bcrypt from 'bcryptjs';

export class AdminService extends BaseService {
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
                    select: { Appointments: true }
                }
            }
        });
    }

    async getAllDoctors() {
        return await this.prisma.doctor.findMany({
            select: {
                doctorId: true,
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
        
        // Add Dr. prefix if not present
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

        const doctorData = {
            name: doctorName,
            username: data.username || data.email, // Ensure unique username
            specialist: data.specialist,
            experience: parseInt(data.experience) || 0,
            email: data.email,
            password: hashedPassword,
            hospitalId: (data.hospitalId && data.hospitalId !== "") ? data.hospitalId : null
        };

        return await this.prisma.doctor.create({
            data: doctorData
        });
    }

    async updateDoctor(id, data) {
        // Add Dr. prefix if not present
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
            where: { doctorId: id },
            data: updateData
        });
    }

    async deleteDoctor(id) {
        return await this.prisma.doctor.delete({
            where: { doctorId: id }
        });
    }

    async createPatient(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword
            }
        });
    }

    async updatePatient(id, data) {
        const updateData = { name: data.name, email: data.email };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        return await this.prisma.user.update({
            where: { id: id },
            data: updateData
        });
    }

    async deletePatient(id) {
        return await this.prisma.user.delete({
            where: { id: id }
        });
    }
}
