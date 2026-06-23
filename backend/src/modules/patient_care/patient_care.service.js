import { BaseService } from '../../shared/BaseService.js';

export class PatientCareService extends BaseService {
    async getPatientDashboard(userId) {
        return await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                appointments: {
                    include: {
                        doctor: {
                            select: {
                                name: true,
                                specialist: true
                            }
                        }
                    }
                },
                medicines: {
                    include: {
                        doctor: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                reports: {
                    include: {
                        doctor: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                cancerType: true
            }
        });
    }
}
