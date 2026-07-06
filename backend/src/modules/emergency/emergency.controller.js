import { BaseController } from '../../shared/BaseController.js';
import { EmergencyService } from './emergency.service.js';
import { prisma } from '../../db/prisma.js';

export class EmergencyController extends BaseController {
    constructor() {
        super();
        this.emergencyService = new EmergencyService();
        this.prisma = prisma;
    }

    getHospitals = async (req, res) => {
        try {
            const hospitals = await this.emergencyService.getHospitals();
            return this.success(res, hospitals);
        } catch (err) {
            return this.error(res, "Failed to fetch hospitals", 500, err);
        }
    };

    sosBroadcast = async (req, res) => {
        try {
            const userId = req.user.id;
            const { address, patientLat, patientLng, routePath, hospitalId } = req.body;

            // Retrieve patient user info
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            
            // Find target hospital or retrieve hospitals with beds
            let targetHospitalId = hospitalId;
            if (!targetHospitalId) {
                const hospitals = await this.prisma.hospital.findMany({
                    where: { bedsAvailable: { gt: 0 } },
                    take: 1
                });
                if (hospitals.length > 0) {
                    targetHospitalId = hospitals[0].id;
                }
            }

            if (!targetHospitalId) {
                // Fallback to any hospital
                const anyHospital = await this.prisma.hospital.findFirst();
                if (anyHospital) {
                    targetHospitalId = anyHospital.id;
                }
            }

            if (!targetHospitalId) {
                return this.error(res, "No hospitals available in the system.", 400);
            }

            // Find doctor at the hospital to satisfy relational field constraints for appointments
            let doctor = await this.prisma.doctor.findFirst({ where: { hospitalId: targetHospitalId } });
            if (!doctor) doctor = await this.prisma.doctor.findFirst();

            if (!doctor) {
                return this.error(res, "No doctors available to receive SOS", 400);
            }

            const date = new Date();
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = date.toISOString().split('T')[1].substring(0, 5);

            // 1. Create legacy Appointment with status SOS_BROADCAST for Hospital dashboard
            const appointment = await this.prisma.appointment.create({
                data: {
                    userId,
                    hospitalId: targetHospitalId,
                    doctorId: doctor.id,
                    patientName: user.name || 'John Patient',
                    date: dateStr,
                    time: timeStr,
                    status: 'SOS_BROADCAST',
                    urgencyLevel: 'EMERGENCY'
                }
            });

            // 2. Create persistent SosAlert record for telemetry
            const sosAlert = await this.emergencyService.createSosAlert({
                userId,
                patientName: user.name || 'John Patient',
                address: address || 'Trauma Center Route',
                patientLat: patientLat || 28.4595,
                patientLng: patientLng || 77.0266,
                hospitalId: targetHospitalId,
                routePath: routePath || null,
                clinicalBrief: 'Patient triggered SOS. Medical history indicates Breast Cancer Stage 2.'
            });

            return this.success(res, {
                message: "SOS Broadcasted successfully",
                appointment,
                sosAlert
            }, "Success", 201);

        } catch (err) {
            console.error("SOS Broadcast Error:", err);
            return this.error(res, "Failed to broadcast SOS", 500, err);
        }
    };

    getActiveSos = async (req, res) => {
        try {
            const userId = req.user?.id;
            const hospitalId = req.query.hospitalId;

            const alert = await this.emergencyService.getActiveAlert(userId, hospitalId);
            if (!alert) return this.success(res, null, "No active alerts found");
            return this.success(res, alert);
        } catch (err) {
            return this.error(res, "Failed to get active SOS alert", 500, err);
        }
    };

    updateAmbulance = async (req, res) => {
        try {
            const { id } = req.params; // SOS Alert ID
            const { lat, lng, routePath, status } = req.body;
            const updated = await this.emergencyService.updateAmbulance(id, { lat, lng, routePath, status });
            return this.success(res, updated);
        } catch (err) {
            return this.error(res, "Failed to update ambulance location", 500, err);
        }
    };
}
