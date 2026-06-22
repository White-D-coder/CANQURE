import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyHospitalAdmin } from '../../../middleware/middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all appointments for hospital dashboard
router.get('/dashboard/appointments', verifyHospitalAdmin, async (req, res) => {
    try {
        // For MVP, returning all appointments to populate dashboard
        const appointments = await prisma.appointment.findMany({
            include: {
                doctor: true,
                user: true
            },
            orderBy: { id: 'desc' }
        });
        
        const formatted = appointments.map(a => ({
            id: a.id.slice(-6).toUpperCase(),
            dbId: a.id,
            name: a.patientName || a.user?.name || 'Unknown',
            condition: 'Oncology Consult',
            ref: a.doctor?.name || 'AI Triage',
            urgency: a.urgencyLevel || 'Normal',
            status: a.status || 'SCHEDULED'
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update appointment status
router.put('/dashboard/appointments/:id/status', verifyHospitalAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        // If accepting an SOS broadcast, we must cancel other broadcasts for the same patient
        const currentApt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
        
        if (currentApt && currentApt.status === 'SOS_BROADCAST' && status === 'ACCEPTED') {
            // Cancel other broadcasts for this user on the same date
            await prisma.appointment.updateMany({
                where: {
                    userId: currentApt.userId,
                    date: currentApt.date,
                    status: 'SOS_BROADCAST',
                    id: { not: currentApt.id }
                },
                data: { status: 'CANCELLED_SOS' }
            });
        }

        const updated = await prisma.appointment.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json({ success: true, status: updated.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Hospital
router.post('/', async (req, res) => {
    try {
        const { name, address, city, contact, email } = req.body;
        const hospital = await prisma.hospital.create({
            data: { name, address, city, contact, email }
        });
        res.status(201).json(hospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all Hospitals
router.get('/', async (req, res) => {
    try {
        const hospitals = await prisma.hospital.findMany({
            include: {
                _count: {
                    select: { doctors: true }
                }
            }
        });
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Hospital by ID
router.get('/:id', async (req, res) => {
    try {
        const hospital = await prisma.hospital.findUnique({
            where: { id: req.params.id },
            include: {
                doctors: true,
                appointments: {
                    include: {
                        doctor: true,
                        user: true
                    }
                }
            }
        });
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Hospital
router.put('/:id', async (req, res) => {
    try {
        const { name, address, city, contact, email } = req.body;
        const hospital = await prisma.hospital.update({
            where: { id: req.params.id },
            data: { name, address, city, contact, email }
        });
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Hospital
router.delete('/:id', async (req, res) => {
    try {
        await prisma.hospital.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Hospital deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
