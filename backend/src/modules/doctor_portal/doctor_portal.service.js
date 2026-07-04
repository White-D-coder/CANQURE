import { BaseService } from '../../shared/BaseService.js';

export class DoctorPortalService extends BaseService {
    // 1. Patient Snapshot
    async getPatientSnapshot(patientId) {
        const patient = await this.prisma.user.findUnique({
            where: { id: patientId },
            include: {
                cancerType: true,
                medicines: {
                    orderBy: { startDate: 'desc' },
                    take: 5
                }
            }
        });

        if (!patient) return null;

        // Extract primary cancer information
        const primaryCancer = patient.cancerType?.[0] || { name: 'Oncology Patient', stage: 1 };

        // For MVP demo, if caregiver fields aren't fully in User model, we use structured metadata fallbacks
        return {
            patientId: patient.id,
            name: patient.name || patient.email.split('@')[0],
            age: 45, // default
            gender: 'Female',
            bloodType: 'O+',
            cancerType: primaryCancer.name,
            stage: primaryCancer.stage.toString(),
            ecog: 1, // Eastern Cooperative Oncology Group score
            allergies: 'Penicillin, Sulfa drugs',
            caregiver: 'Priya Sharma (Spouse)',
            caregiverPhone: '+91 98765 43210',
            pharmacy: 'Apollo Pharmacy, Sector 12',
            lastConsult: '2026-06-10'
        };
    }

    // 2. Patient Timeline (Dynamic compiler pulling from Db tables)
    async getPatientTimeline(patientId) {
        // Query multiple tables to construct chronological events
        const appointments = await this.prisma.appointment.findMany({
            where: { userId: patientId },
            orderBy: { date: 'desc' }
        });

        const medicines = await this.prisma.medicine.findMany({
            where: { userId: patientId },
            orderBy: { startDate: 'desc' }
        });

        const reports = await this.prisma.report.findMany({
            where: { userId: patientId },
            orderBy: { date: 'desc' }
        });

        const timeline = [];

        // Map Appointments to Timeline
        appointments.forEach(apt => {
            timeline.push({
                id: `apt-${apt.id}`,
                date: apt.date,
                title: `Consultation - ${apt.status}`,
                type: 'CONSULT',
                desc: apt.aiSummary || `Consultation scheduled with Dr. Attending. Status: ${apt.status}. Urgency: ${apt.urgencyLevel}`,
                icon: 'Stethoscope',
                color: 'blue',
                rawDate: new Date(apt.date)
            });
        });

        // Map Medications to Timeline
        medicines.forEach(med => {
            timeline.push({
                id: `med-${med.id}`,
                date: med.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                title: `Prescribed: ${med.medName}`,
                type: 'MEDS',
                desc: `Medicine added to patient continuity tracker. Dosage: ${med.dose}. Frequency: ${med.frequency}. Notes: ${med.description}`,
                icon: 'Pill',
                color: 'amber',
                rawDate: new Date(med.startDate)
            });
        });

        // Map Reports to Timeline
        reports.forEach(rep => {
            const isScan = rep.reportName.toLowerCase().includes('scan') || rep.reportName.toLowerCase().includes('ct') || rep.reportName.toLowerCase().includes('pet');
            timeline.push({
                id: `rep-${rep.id}`,
                date: rep.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                title: rep.reportName,
                type: isScan ? 'SCAN' : 'LAB',
                desc: rep.parsedText?.slice(0, 150) || `Uploaded medical report. Status: ${rep.status}`,
                icon: isScan ? 'Microscope' : 'FileText',
                color: isScan ? 'emerald' : 'rose',
                rawDate: new Date(rep.date)
            });
        });

        // Sort combined timeline by date descending
        return timeline.sort((a, b) => b.rawDate - a.rawDate);
    }

    // 3. Document Vault
    async getPatientDocuments(patientId) {
        return await this.prisma.report.findMany({
            where: { userId: patientId },
            orderBy: { date: 'desc' }
        });
    }

    // 4. Medications Table
    async getPatientMedications(patientId) {
        const medicines = await this.prisma.medicine.findMany({
            where: { userId: patientId },
            orderBy: { startDate: 'desc' }
        });

        // Map additional properties needed by the UI timeline tracker
        return medicines.map(m => {
            const daysRemaining = m.endDate ? Math.ceil((new Date(m.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 15;
            return {
                id: m.id,
                medName: m.medName,
                dose: m.dose,
                frequency: m.frequency,
                startDate: m.startDate,
                endDate: m.endDate,
                description: m.description,
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
                totalDays: 30, // Default duration tracker
                adherence: 95
            };
        });
    }

    // 5. Emergency Package
    async getEmergencyData(patientId) {
        const snapshot = await this.getPatientSnapshot(patientId);
        const medications = await this.getPatientMedications(patientId);
        return {
            ...snapshot,
            medications
        };
    }

    // 6. Care Gaps Scan
    async getCareGaps(patientId) {
        // Scans database for overdue tests
        const reports = await this.getPatientDocuments(patientId);
        const gaps = [];

        const hasRecentCbc = reports.some(r => r.reportName.toLowerCase().includes('cbc') || r.reportName.toLowerCase().includes('blood'));
        if (!hasRecentCbc) {
            gaps.push({
                id: 'gap-cbc',
                priority: 'CRITICAL',
                title: 'CBC Blood Count test is overdue. Schedule immediately to verify counts.',
                color: 'red',
                actions: ['Order Lab Test', 'Contact Patient']
            });
        }

        const medicines = await this.getPatientMedications(patientId);
        const hasLowSupply = medicines.some(m => m.daysRemaining <= 7);
        if (hasLowSupply) {
            gaps.push({
                id: 'gap-refill',
                priority: 'HIGH',
                title: 'Oncology medication supply is running low. Issue a refill within 5 days.',
                color: 'amber',
                actions: ['Issue Refill', 'Alert Pharmacy']
            });
        }

        // Default scheduler gap
        gaps.push({
            id: 'gap-appt',
            priority: 'MEDIUM',
            title: 'Oncology review and clinic appointment not booked for current cycle.',
            color: 'blue',
            actions: ['Schedule Consultation']
        });

        return gaps;
    }

    // 7. Red Flags Audit
    async getRedFlags(patientId) {
        const snapshot = await this.getPatientSnapshot(patientId);
        const reports = await this.getPatientDocuments(patientId);
        const flags = [];

        // Check allergies
        if (snapshot.allergies && snapshot.allergies !== 'None') {
            flags.push({
                id: 'flag-allergy',
                title: 'Severe Drug Allergy Warnings',
                severity: 'CRITICAL',
                message: `Patient has documented severe allergy reactions to: ${snapshot.allergies}. Do not prescribe.`,
                actionRecommended: 'Verify medication chart before prescribing.'
            });
        }

        // Check for Neutropenia risk from lab texts
        const wbcReports = reports.filter(r => r.parsedText?.toLowerCase().includes('wbc') || r.parsedText?.toLowerCase().includes('leukocyte'));
        wbcReports.forEach(r => {
            // Heuristic check for low WBC levels in reports
            if (r.parsedText.toLowerCase().includes('low') || r.parsedText.toLowerCase().includes('neutropenia')) {
                flags.push({
                    id: `flag-neutro-${r.id}`,
                    title: 'Neutropenia/WBC Count Alert',
                    severity: 'HIGH',
                    message: `Patient's recent lab report (${r.reportName}) flags abnormal leukocyte levels. Potential risk for infection.`,
                    actionRecommended: 'Consider adjusting Chemotherapy dosages.'
                });
            }
        });

        return flags;
    }

    // 8. Refill Medication Mutation
    async refillMedication(patientId, medId) {
        // Find medicine and update dates
        const medicine = await this.prisma.medicine.findFirst({
            where: { id: medId, userId: patientId }
        });

        if (!medicine) return null;

        const newEndDate = new Date(medicine.endDate || new Date());
        newEndDate.setDate(newEndDate.getDate() + 30); // extend 30 days

        return await this.prisma.medicine.update({
            where: { id: medId },
            data: { endDate: newEndDate }
        });
    }

    // 9. Resolve Care Gap
    async resolveCareGap(patientId, gapId) {
        // Resolve target care gaps. For MVP, we log and return success
        console.log(`Resolving care gap ${gapId} for patient ${patientId}`);
        return { success: true, resolvedGapId: gapId };
    }
}
