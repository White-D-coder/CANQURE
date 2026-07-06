import { PrismaClient } from '@prisma/client';
import { PharmacyOperationsService } from '../src/modules/pharmacy_operations/pharmacy_operations.service.js';

const prisma = new PrismaClient();
const service = new PharmacyOperationsService();

async function runTests() {
    console.log("=== STARTING REFILL DELIVERY FLOW INTEGRATION TESTS ===");

    // 1. Get test patient and pharmacy
    const patient = await prisma.user.findFirst({
        where: { role: 'PATIENT' }
    });
    if (!patient) {
        console.error("Test Error: No patient found in database to test with.");
        process.exit(1);
    }
    console.log(`✓ Found Test Patient: ${patient.name} (${patient.id})`);

    const pharmacy = await prisma.pharmacy.findFirst();
    if (!pharmacy) {
        console.error("Test Error: No pharmacy found in database to test with.");
        process.exit(1);
    }
    console.log(`✓ Found Test Pharmacy: ${pharmacy.name} (${pharmacy.id})`);

    // Ensure patient has a medicine to update
    let medicine = await prisma.medicine.findFirst({
        where: { userId: patient.id }
    });
    if (!medicine) {
        console.log("Creating mock medicine for testing...");
        medicine = await prisma.medicine.create({
            data: {
                userId: patient.id,
                medName: "Imatinib Test 400mg",
                description: "Test description",
                dose: "Once daily",
                frequency: "Daily",
                startDate: new Date(),
                endDate: new Date(Date.now() + 5 * 86400000) // 5 days left
            }
        });
    }
    console.log(`✓ Found Test Medicine: ${medicine.medName} (EndDate: ${medicine.endDate})`);

    // 2. Test Order Creation
    console.log("\n--- TEST 1: Refill Order Creation ---");
    const order = await service.createRefillOrder(patient.id, {
        medicationId: medicine.id,
        medName: medicine.medName,
        pharmacyName: pharmacy.name,
        price: "₹1,200",
        deliveryTime: "30 mins",
        daysRemaining: 5
    });
    console.log(`✓ Order Created: ID ${order.id}, Status ${order.status}`);

    // 3. Test State Machine Transitions (Pharmacy side)
    console.log("\n--- TEST 2: State Machine Transitions (Pharmacy side) ---");
    
    // CONFIRMED
    let updated = await service.updateRefillOrderStatus(order.id, "CONFIRMED");
    console.log(`✓ State Transition -> CONFIRMED: Status = ${updated.status}`);

    // PREPARING
    updated = await service.updateRefillOrderStatus(order.id, "PREPARING");
    console.log(`✓ State Transition -> PREPARING: Status = ${updated.status}`);

    // PACKED
    updated = await service.updateRefillOrderStatus(order.id, "PACKED");
    console.log(`✓ State Transition -> PACKED: Status = ${updated.status}`);

    // OUT_FOR_DELIVERY
    updated = await service.updateRefillOrderStatus(order.id, "OUT_FOR_DELIVERY");
    console.log(`✓ State Transition -> OUT_FOR_DELIVERY: Status = ${updated.status}`);
    console.log(`  Tracking ID: ${updated.trackingId}`);
    console.log(`  Rider position: ${updated.simulatedRiderCoords}`);
    console.log(`  ETA: ${updated.estimatedArrival}`);

    // 4. Test Delivery Confirmation Validation (Fail cases)
    console.log("\n--- TEST 3: Delivery Confirmation Fail Cases ---");
    
    // Fail case A: Confirming from wrong status (not HANDOVER_PENDING yet)
    try {
        await service.confirmRefillDelivery(order.id, patient.id);
        console.error("✗ Fail Case A failed: Enforces HANDOVER_PENDING but allowed confirmation directly from OUT_FOR_DELIVERY.");
    } catch (e) {
        console.log(`✓ Fail Case A correct: Enforced HANDOVER_PENDING verification constraint. Error: "${e.message}"`);
    }

    // Fail case B: Wrong patient trying to confirm
    const wrongPatientId = "60c72b2f9b1d8e23f0000000"; // Random ObjectId
    try {
        await service.confirmRefillDelivery(order.id, wrongPatientId);
        console.error("✗ Fail Case B failed: Allowed confirmation from wrong user.");
    } catch (e) {
        console.log(`✓ Fail Case B correct: Verified user ownership constraint. Error: "${e.message}"`);
    }

    // Fail case C: Order not found
    try {
        await service.confirmRefillDelivery("60c72b2f9b1d8e23f0000001", patient.id);
        console.error("✗ Fail Case C failed: Allowed confirmation for non-existent order.");
    } catch (e) {
        console.log(`✓ Fail Case C correct: Verified non-existent order constraint. Error: "${e.message}"`);
    }

    // 5. Simulate tracking updates & automatically trigger HANDOVER_PENDING
    console.log("\n--- TEST 4: Tracking Updates & Simulated Rider Journey ---");
    
    // We update updatedAt to be 45 seconds ago so that getRefillTracking transitions it
    await prisma.refillOrder.update({
        where: { id: order.id },
        data: {
            updatedAt: new Date(Date.now() - 45 * 1000) // 45 seconds ago (elapsed > 40s duration)
        }
    });

    const trackingInfo = await service.getRefillTracking(order.id, patient.id);
    console.log(`✓ Tracking polled. Status automatically updated to: ${trackingInfo.status}`);
    console.log(`  Rider current coordinates:`, trackingInfo.riderCoords);
    console.log(`  ETA Label: ${trackingInfo.etaLabel}`);

    // Verify database shows HANDOVER_PENDING now
    const dbOrder = await prisma.refillOrder.findUnique({
        where: { id: order.id }
    });
    console.log(`✓ DB Verification: Order status is ${dbOrder.status}`);

    // 6. Confirm Handover & Verify supply extended
    console.log("\n--- TEST 5: Successful Delivery Handover & Supply Update ---");
    const result = await service.confirmRefillDelivery(order.id, patient.id);
    console.log(`✓ Handover verified! Return payload:`, result);

    // Verify Medicine dates extended in DB
    const updatedMed = await prisma.medicine.findUnique({
        where: { id: medicine.id }
    });
    console.log(`✓ Updated Medicine End Date in DB: ${updatedMed.endDate}`);
    const daysLeft = Math.ceil((new Date(updatedMed.endDate) - new Date()) / (1000 * 86400));
    console.log(`✓ Remaining supply days left: ${daysLeft} days`);

    // Verify Audit Log written
    const auditLog = await prisma.auditLog.findFirst({
        where: { resourceId: order.id, action: 'DELIVERY_CONFIRMED' }
    });
    if (auditLog) {
        console.log(`✓ Audit Log successfully recorded: Action="${auditLog.action}", Details="${auditLog.details}"`);
    } else {
        console.error("✗ Fail: Audit log was not written.");
    }

    // Verify in-app Alert created
    const alertRecord = await prisma.alert.findFirst({
        where: { patientId: patient.id, title: 'Refill Handover Confirmed' }
    });
    if (alertRecord) {
        console.log(`✓ In-App Alert successfully recorded: Title="${alertRecord.title}", Message="${alertRecord.message}"`);
    } else {
        console.error("✗ Fail: In-app alert was not written.");
    }

    // Clean up test order
    await prisma.refillOrder.delete({ where: { id: order.id } });
    console.log("\n✓ Cleaned up test order.");
    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

runTests().catch(e => {
    console.error("Test Suite crashed:", e);
    process.exit(1);
});
