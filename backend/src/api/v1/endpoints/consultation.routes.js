import express from 'express';
import { prisma } from '../../../db/prisma.js';
import axios from 'axios';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// 1. Start Consultation (Captures actual start time for late-detection)
router.post('/:appointmentId/start', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                status: 'IN_PROGRESS',
                actualStartTime: new Date()
            }
        });
        res.json({ message: "Consultation started", appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Save Live Transcript Chunk
router.post('/:appointmentId/transcript', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { text } = req.body;
        
        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        const updatedTranscript = (appointment.transcript || '') + '\n' + text;
        
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { transcript: updatedTranscript }
        });
        
        res.json({ message: "Transcript updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Generate AI Summary & Roadmap
router.post('/:appointmentId/summarize', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await prisma.appointment.findUnique({ 
            where: { id: appointmentId },
            include: { user: true }
        });

        if (!appointment.transcript) {
            return res.status(400).json({ error: "No transcript available to summarize" });
        }

        // Call ML service for medical summarization
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/summarize`, {
            transcript: appointment.transcript
        });

        const { summary, roadmap } = mlResponse.data;

        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                aiSummary: summary,
                patientRoadmap: roadmap,
                status: 'COMPLETED'
            }
        });

        res.json({ message: "Summary generated", appointment: updatedAppointment });
    } catch (error) {
        console.error("Summarization Error:", error);
        res.status(500).json({ error: "Failed to generate AI summary" });
    }
});

// 4. Reroute Logic (Triggered if doctor is >3 mins late)
router.post('/:appointmentId/reroute', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const originalApt = await prisma.appointment.findUnique({ 
            where: { id: appointmentId },
            include: { doctor: true }
        });

        // Find best backup doctor (Same specialty, available, high rating)
        const backupDoctor = await prisma.doctor.findFirst({
            where: {
                specialist: originalApt.doctor.specialist,
                doctorId: { not: originalApt.doctorId }
            },
            orderBy: { rating: 'desc' }
        });

        if (!backupDoctor) {
            return res.status(404).json({ error: "No backup doctors available" });
        }

        const updatedApt = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                doctorId: backupDoctor.doctorId,
                status: 'REROUTED'
            }
        });

        res.json({ message: "Patient rerouted successfully", newDoctor: backupDoctor.name, appointment: updatedApt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Emergency Reroute (Manual or System triggered for critical cases)
router.post('/:appointmentId/emergency-escalate', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        // Mark current appointment as EMERGENCY
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { urgencyLevel: 'EMERGENCY' }
        });

        // Find any doctor available NOW (regardless of original specialty fit if urgent)
        const emergencyDoctor = await prisma.doctor.findFirst({
            where: { 
                consultations: { lt: 5 } // Pick someone with lower load
            },
            orderBy: { rating: 'desc' }
        });

        if (!emergencyDoctor) {
            return res.status(404).json({ error: "No emergency responders available" });
        }

        const updatedApt = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
                doctorId: emergencyDoctor.doctorId,
                status: 'REROUTED'
            }
        });

        res.json({ 
            message: "Emergency escalation successful", 
            responder: emergencyDoctor.name, 
            appointment: updatedApt 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
