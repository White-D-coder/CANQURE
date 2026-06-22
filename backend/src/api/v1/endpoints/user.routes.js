import express from 'express';
import { UserController } from '../../../controllers/user.controller.js';
import { verifyPatient } from '../../../middleware/middleware.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const userController = new UserController();
const prisma = new PrismaClient();

router.get('/dashboard', verifyPatient, userController.getPatientDashboard);
router.get('/doctors', verifyPatient, userController.getAllDoctors);
router.post('/book-appointment', verifyPatient, userController.bookAppointment);
router.get('/availability', verifyPatient, userController.getDoctorAvailability);

// Request Emergency Route
router.post('/emergency', verifyPatient, async (req, res) => {
    try {
        const userId = req.user.id;
        const { hospitalId, isCritical } = req.body;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        // Find any doctor in the hospital to satisfy the schema relation for MVP
        let doctor = await prisma.doctor.findFirst({ where: { hospitalId } });
        if (!doctor) {
            doctor = await prisma.doctor.findFirst();
        }
        
        if (!doctor) {
            return res.status(400).json({ message: "No doctors available in the system" });
        }

        const date = new Date();
        const appointment = await prisma.appointment.create({
            data: {
                userId,
                hospitalId,
                doctorId: doctor.doctorId,
                patientName: user.name,
                date: date.toISOString().split('T')[0],
                time: date.toISOString().split('T')[1].substring(0, 5),
                status: 'PENDING',
                urgencyLevel: isCritical ? 'EMERGENCY' : 'URGENT'
            }
        });

        res.status(201).json({ message: "Emergency request sent", appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to request emergency", error: error.message });
    }
});

// Broadcast SOS Route
router.post('/sos-broadcast', verifyPatient, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        const hospitals = await prisma.hospital.findMany({
            where: { bedsAvailable: { gt: 0 } },
            take: 5
        });

        if (hospitals.length === 0) {
            return res.status(400).json({ message: "No hospitals with available beds." });
        }

        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toISOString().split('T')[1].substring(0, 5);

        const broadcasts = [];
        for (const hospital of hospitals) {
            let doctor = await prisma.doctor.findFirst({ where: { hospitalId: hospital.id } });
            if (!doctor) doctor = await prisma.doctor.findFirst();

            if (doctor) {
                const apt = await prisma.appointment.create({
                    data: {
                        userId,
                        hospitalId: hospital.id,
                        doctorId: doctor.doctorId,
                        patientName: user.name,
                        date: dateStr,
                        time: timeStr,
                        status: 'SOS_BROADCAST',
                        urgencyLevel: 'EMERGENCY'
                    }
                });
                broadcasts.push(apt);
            }
        }

        res.status(201).json({ message: "SOS Broadcasted", count: broadcasts.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to broadcast SOS", error: error.message });
    }
});

// Get Connected Hospitals for Emergency Map
router.get('/hospitals', verifyPatient, async (req, res) => {
    try {
        const hospitals = await prisma.hospital.findMany();
        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch hospitals" });
    }
});

export default router;
