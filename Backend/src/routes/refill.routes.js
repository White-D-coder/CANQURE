import express from 'express';
import { verifyPatient, verifyPharmacy } from '../middleware/middleware.js';
import { prisma } from '../db/prisma.js';

const router = express.Router();

// Patient places a new refill routing order
router.post('/', verifyPatient, async (req, res) => {
    try {
        const patientId = req.user.id;
        const { medicationId, medName, pharmacyName, price, deliveryTime, daysRemaining } = req.body;

        if (!medName || !pharmacyName || !price || !deliveryTime) {
            return res.status(400).json({ message: "Missing required fields for refill order" });
        }

        // Fetch user's name
        const user = await prisma.user.findUnique({
            where: { id: patientId }
        });

        if (!user) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Validate medicationId format (Prisma ObjectId requirements)
        let validMedId = null;
        if (medicationId && typeof medicationId === 'string' && medicationId.length === 24 && /^[0-9a-fA-F]{24}$/.test(medicationId)) {
            validMedId = medicationId;
        }

        const newOrder = await prisma.refillOrder.create({
            data: {
                medicationId: validMedId,
                medName,
                patientName: user.name || user.username || "Anonymous Patient",
                patientId,
                pharmacyName,
                price,
                deliveryTime,
                daysRemaining: daysRemaining !== undefined ? Number(daysRemaining) : 5,
                status: "PENDING"
            }
        });


        res.status(201).json({ message: "Refill order routed successfully", order: newOrder });
    } catch (error) {
        console.error("Error creating refill order:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Patient fetches their active refill orders
router.get('/patient', verifyPatient, async (req, res) => {
    try {
        const patientId = req.user.id;
        const orders = await prisma.refillOrder.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        console.error("Error fetching patient refill orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Pharmacist fetches all refill orders
router.get('/all', verifyPharmacy, async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'pharmacy' && req.user.pharmacyName) {
            filter.pharmacyName = req.user.pharmacyName;
        }

        const orders = await prisma.refillOrder.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);

    } catch (error) {
        console.error("Error fetching all refill orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Pharmacist updates status of a refill order
router.put('/:id/status', verifyPharmacy, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status field is required" });
        }

        const validStatuses = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const updatedOrder = await prisma.refillOrder.update({
            where: { id },
            data: { status }
        });

        res.json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
        console.error("Error updating refill order status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

export default router;
