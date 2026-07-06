import { BaseService } from '../../shared/BaseService.js';

export class PharmacyOperationsService extends BaseService {
    async createRefillOrder(patientId, { medName, pharmacyName, price, deliveryTime, daysRemaining }) {
        const user = await this.prisma.user.findUnique({
            where: { id: patientId }
        });
        if (!user) throw new Error("Patient not found");

        const pharmacy = await this.prisma.pharmacy.findFirst({
            where: { name: pharmacyName }
        });
        if (!pharmacy) throw new Error(`Pharmacy '${pharmacyName}' not found`);

        return await this.prisma.refillOrder.create({
            data: {
                medName,
                patientName: user.name || user.username || "Anonymous Patient",
                patientId,
                pharmacyId: pharmacy.id,
                price,
                deliveryTime,
                daysRemaining: daysRemaining !== undefined ? Number(daysRemaining) : 5,
                status: "PENDING"
            }
        });
    }

    async getPatientRefillOrders(patientId) {
        return await this.prisma.refillOrder.findMany({
            where: { patientId },
            include: { pharmacy: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getPharmacyRefillOrders(pharmacyName) {
        const filter = {};
        if (pharmacyName) {
            const pharmacy = await this.prisma.pharmacy.findFirst({
                where: { name: pharmacyName }
            });
            if (pharmacy) {
                filter.pharmacyId = pharmacy.id;
            } else {
                return []; // No pharmacy matches the name
            }
        }

        return await this.prisma.refillOrder.findMany({
            where: filter,
            include: { pharmacy: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateRefillOrderStatus(id, status) {
        const order = await this.prisma.refillOrder.findUnique({
            where: { id },
            include: { pharmacy: true }
        });
        if (!order) throw new Error("Order not found");

        const updateData = { status };

        if (status === 'OUT_FOR_DELIVERY' && !order.trackingId) {
            updateData.trackingId = 'TRK-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            updateData.estimatedArrival = new Date(Date.now() + 60 * 1000); // 60 seconds from now for demo

            // Pharmacy coordinates lookup
            const pName = order.pharmacy?.name || "";
            let pCoords = { lat: 28.6288, lng: 77.3662 }; // Apollo default
            if (pName.includes("MedPlus")) pCoords = { lat: 28.6241, lng: 77.3792 };
            else if (pName.includes("Fortis")) pCoords = { lat: 28.6365, lng: 77.3451 };

            const patientCoords = { lat: 28.6272, lng: 77.3726 }; // Default patient Noida location

            // Generate polyline path
            let routePoints = [];
            try {
                const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pCoords.lng},${pCoords.lat};${patientCoords.lng},${patientCoords.lat}?overview=full&geometries=geojson`);
                const data = await res.json();
                if (data && data.routes && data.routes.length > 0) {
                    routePoints = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                }
            } catch (e) {
                console.warn("OSRM routing failed in backend seed. Using interpolation fallback.", e);
            }

            if (routePoints.length === 0) {
                // Interpolation fallback
                const steps = 15;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    routePoints.push([
                        pCoords.lat + (patientCoords.lat - pCoords.lat) * t,
                        pCoords.lng + (patientCoords.lng - pCoords.lng) * t
                    ]);
                }
            }

            updateData.routePolyline = JSON.stringify(routePoints);
            updateData.simulatedRiderCoords = JSON.stringify(routePoints[0]);
        }

        // Trigger Packed/Shipped Notifications
        if (status === 'PACKED') {
            console.log(`[Notification Service] In-app/SMS alert sent to Patient and Caregiver: Order #${order.id.slice(-6).toUpperCase()} is Packed.`);
        } else if (status === 'OUT_FOR_DELIVERY') {
            console.log(`[Notification Service] In-app/SMS/Email alert sent to Patient, Caregiver, and Rider: Order #${order.id.slice(-6).toUpperCase()} is Shipped.`);
        } else if (status === 'FAILED') {
            console.log(`[Notification Service] Urgent Alert sent to Patient, Caregiver, and Pharmacy: Order #${order.id.slice(-6).toUpperCase()} Failed.`);
        }

        return await this.prisma.refillOrder.update({
            where: { id },
            data: updateData
        });
    }

    async confirmRefillDelivery(id, patientId) {
        const order = await this.prisma.refillOrder.findUnique({
            where: { id }
        });
        if (!order) throw new Error("Refill order not found");
        if (order.patientId !== patientId) throw new Error("Access denied: You do not own this order");
        if (order.status === 'DELIVERED') throw new Error("Order already delivered");

        // Enforce state machine restriction: status must be one of the in-transit states
        const allowedStatuses = ["OUT_FOR_DELIVERY", "ARRIVING", "HANDOVER_PENDING"];
        if (!allowedStatuses.includes(order.status)) {
            throw new Error(`Order cannot be confirmed in its current status: ${order.status}`);
        }

        const now = new Date();
        const next30Days = new Date(now.getTime() + 30 * 86400000);

        // 1. Update refill order status to DELIVERED
        const updatedOrder = await this.prisma.refillOrder.update({
            where: { id },
            data: {
                status: 'DELIVERED',
                deliveredAt: now
            }
        });

        // 2. Find and update the corresponding patient medicine
        let medicine = null;
        if (order.medicineId) {
            medicine = await this.prisma.medicine.findUnique({
                where: { id: order.medicineId }
            });
        }
        
        if (!medicine) {
            // Fallback match by first word of drug name
            const firstWord = order.medName.split(' ')[0] || "";
            medicine = await this.prisma.medicine.findFirst({
                where: {
                    userId: patientId,
                    medName: {
                        contains: firstWord,
                        mode: 'insensitive'
                    }
                }
            });
        }

        if (medicine) {
            await this.prisma.medicine.update({
                where: { id: medicine.id },
                data: {
                    startDate: now,
                    endDate: next30Days,
                    supplyEndDate: next30Days,
                    lastRefillDate: now
                }
            });
        }

        // 3. Write audit log
        await this.prisma.auditLog.logAccess
            ? await this.prisma.auditLog.logAccess(patientId, "DELIVERY_CONFIRMED", "RefillOrder", id, `Refill for ${order.medName} confirmed.`)
            : await this.prisma.auditLog.create({
                data: {
                    userId: patientId,
                    action: "DELIVERY_CONFIRMED",
                    resourceType: "RefillOrder",
                    resourceId: id,
                    details: `Refill order for ${order.medName} confirmed delivered by patient.`
                }
            });

        // 4. Trigger Notifications
        await this.prisma.alert.create({
            data: {
                patientId,
                title: "Refill Handover Confirmed",
                message: `Your refill order for ${order.medName} has been verified and delivered. Medicine supply has been extended (+30 days).`,
                type: "SUCCESS"
            }
        });
        console.log(`[Notification Service] Handover complete alerts sent to Patient, Caregiver, and Pharmacy for order #${id.slice(-6).toUpperCase()}.`);

        return {
            status: "DELIVERED",
            medicineUpdated: !!medicine,
            remainingSupplyDays: 30,
            newEndDate: next30Days.toISOString()
        };
    }

    async getRefillTracking(id, patientId) {
        let order = await this.prisma.refillOrder.findUnique({
            where: { id },
            include: { pharmacy: true }
        });
        if (!order) return null;
        if (order.patientId !== patientId) return null;

        const transitStatuses = ["OUT_FOR_DELIVERY", "ARRIVING", "HANDOVER_PENDING"];
        if (transitStatuses.includes(order.status) && order.routePolyline) {
            const routeCoords = JSON.parse(order.routePolyline);
            
            // Calculate elapsed time in seconds since the order entered OUT_FOR_DELIVERY status (order.updatedAt || order.createdAt)
            const elapsed = (Date.now() - new Date(order.updatedAt || order.createdAt).getTime()) / 1000;
            const duration = 40; // Reaches target destination in 40 seconds

            let nextStatus = order.status;
            if (elapsed >= duration) {
                nextStatus = "HANDOVER_PENDING";
            } else if (elapsed >= 20 && order.status === "OUT_FOR_DELIVERY") {
                nextStatus = "ARRIVING";
            }

            // Interpolate position along route
            const pct = Math.min(1.0, elapsed / duration);
            const index = Math.floor(pct * (routeCoords.length - 1));
            const currentPos = routeCoords[index] || routeCoords[0];

            if (nextStatus !== order.status || JSON.stringify(currentPos) !== order.simulatedRiderCoords) {
                // Update in DB
                order = await this.prisma.refillOrder.update({
                    where: { id },
                    data: {
                        status: nextStatus,
                        simulatedRiderCoords: JSON.stringify(currentPos)
                    },
                    include: { pharmacy: true }
                });

                if (nextStatus === 'HANDOVER_PENDING') {
                    console.log(`[Notification Service] Alert sent to Patient: Rider has arrived! Verify handover now.`);
                    // Send an in-app Alert
                    await this.prisma.alert.create({
                        data: {
                            patientId,
                            title: "Rider Has Arrived",
                            message: `The delivery rider is at your location with ${order.medName}. Please verify handover on your dashboard.`,
                            type: "WARNING"
                        }
                    });
                }
            }
        }

        // Coordinates lookup
        const pName = order.pharmacy?.name || "";
        let pCoords = { lat: 28.6288, lng: 77.3662 };
        if (pName.includes("MedPlus")) pCoords = { lat: 28.6241, lng: 77.3792 };
        else if (pName.includes("Fortis")) pCoords = { lat: 28.6365, lng: 77.3451 };

        const patientCoords = { lat: 28.6272, lng: 77.3726 };

        const riderCoords = order.simulatedRiderCoords 
            ? JSON.parse(order.simulatedRiderCoords) 
            : pCoords;

        const routeCoords = order.routePolyline 
            ? JSON.parse(order.routePolyline) 
            : [];

        // Estimate remaining time
        const elapsed = (Date.now() - new Date(order.updatedAt || order.createdAt).getTime()) / 1000;
        const remaining = Math.max(0, 40 - elapsed);
        const etaLabel = order.status === 'HANDOVER_PENDING' ? 'Arrived' : order.status === 'DELIVERED' ? 'Delivered' : `${Math.ceil(remaining)} sec`;

        return {
            id: order.id,
            status: order.status,
            medName: order.medName,
            trackingId: order.trackingId || 'N/A',
            estimatedArrival: order.estimatedArrival,
            patientCoords,
            pharmacyCoords: pCoords,
            riderCoords: { lat: riderCoords[0], lng: riderCoords[1] },
            routePolyline: routeCoords,
            etaLabel
        };
    }
}
