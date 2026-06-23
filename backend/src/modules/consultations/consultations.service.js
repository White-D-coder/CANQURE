import { BaseService } from '../../shared/BaseService.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export class ConsultationsService extends BaseService {
    // --- Doctor Queries ---
    async getAllDoctors() {
        return await this.prisma.doctor.findMany({
            include: {
                hospital: {
                    select: { name: true }
                }
            }
        });
    }

    async getDoctorById(id) {
        return await this.prisma.doctor.findUnique({
            where: { id }
        });
    }

    async getDoctorAppointments(doctorId) {
        return await this.prisma.appointment.findMany({
            where: { doctorId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }

    async getPatientDetails(doctorId, patientId) {
        // Confirm there is an appointment to justify access
        const appointment = await this.prisma.appointment.findFirst({
            where: { doctorId, userId: patientId }
        });
        if (!appointment) return null;

        return await this.prisma.user.findUnique({
            where: { id: patientId },
            include: {
                medicines: true,
                cancerType: true,
                reports: true,
                appointments: true
            }
        });
    }

    // --- TimeSlots & Scheduling ---
    async findExistingSlot(doctorId, date, time) {
        return await this.prisma.timeSlot.findFirst({
            where: { doctorId, date, time }
        });
    }

    async createSlot({ doctorId, date, time }) {
        return await this.prisma.timeSlot.create({
            data: {
                doctorId,
                date,
                time,
                status: 'AVAILABLE'
            }
        });
    }

    async updateSlotStatus(slotId, status) {
        return await this.prisma.timeSlot.update({
            where: { id: slotId },
            data: { status }
        });
    }

    async getDoctorSlots(doctorId, date) {
        const where = { doctorId };
        if (date) where.date = date;

        return await this.prisma.timeSlot.findMany({
            where,
            orderBy: { time: 'asc' }
        });
    }

    async getAvailableTimeSlot(doctorId, date, time) {
        return await this.prisma.timeSlot.findFirst({
            where: {
                doctorId,
                date,
                time,
                status: 'AVAILABLE'
            }
        });
    }

    async bookAppointment(doctorId, userId, date, time, patientName, timeSlotId) {
        return await this.prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.create({
                data: {
                    date,
                    time,
                    patientName,
                    doctorId,
                    userId,
                    timeSlotId
                }
            });

            await tx.timeSlot.update({
                where: { id: timeSlotId },
                data: { status: 'BOOKED' }
            });

            return appointment;
        });
    }

    // --- Live Consultations Scribing & Rerouting ---
    async startConsultation(appointmentId) {
        return await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                status: 'IN_PROGRESS',
                actualStartTime: new Date()
            }
        });
    }

    async saveTranscriptChunk(appointmentId, text) {
        const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
        const updatedTranscript = (appointment.transcript || '') + '\n' + text;
        
        return await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { transcript: updatedTranscript }
        });
    }

    async generateSummary(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({ 
            where: { id: appointmentId },
            include: { user: true }
        });

        if (!appointment.transcript) {
            throw new Error("No transcript available to summarize");
        }

        const mlResponse = await axios.post(`${ML_SERVICE_URL}/summarize`, {
            transcript: appointment.transcript
        });

        const { summary, roadmap } = mlResponse.data;

        return await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                aiSummary: summary,
                patientRoadmap: roadmap,
                status: 'COMPLETED'
            }
        });
    }

    async rerouteAppointment(appointmentId) {
        const originalApt = await this.prisma.appointment.findUnique({ 
            where: { id: appointmentId },
            include: { doctor: true }
        });

        const backupDoctor = await this.prisma.doctor.findFirst({
            where: {
                specialist: originalApt.doctor.specialist,
                id: { not: originalApt.doctorId }
            },
            orderBy: { rating: 'desc' }
        });

        if (!backupDoctor) {
            throw new Error("No backup doctors available");
        }

        return await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                doctorId: backupDoctor.id,
                status: 'REROUTED'
            }
        });
    }

    async emergencyEscalate(appointmentId) {
        await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { urgencyLevel: 'EMERGENCY' }
        });

        const emergencyDoctor = await this.prisma.doctor.findFirst({
            where: { 
                consultations: { lt: 5 } 
            },
            orderBy: { rating: 'desc' }
        });

        if (!emergencyDoctor) {
            throw new Error("No emergency responders available");
        }

        return await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                doctorId: emergencyDoctor.id,
                status: 'REROUTED'
            }
        });
    }
}
