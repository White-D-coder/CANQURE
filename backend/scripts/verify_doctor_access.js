import axios from 'axios';
import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:3000';

async function verify() {
    try {
        console.log('--- SETUP ---');
        // 1. Create Doctor
        const hashedPassword = await bcrypt.hash('password123', 10);
        const doctor = await prisma.doctor.create({
            data: {
                name: 'Dr. Verify',
                specialist: 'General',
                experience: 10,
                email: 'drverify@canqure.com',
                password: hashedPassword
            }
        });
        console.log('Doctor created:', doctor.doctorId);

        // 2. Create Patient 1 (With Appointment)
        const patient1 = await prisma.user.create({
            data: {
                name: 'Patient One',
                email: 'p1@verify.com',
                password: hashedPassword
            }
        });
        console.log('Patient 1 created:', patient1.id);

        // 3. Create Patient 2 (NO Appointment)
        const patient2 = await prisma.user.create({
            data: {
                name: 'Patient Two',
                email: 'p2@verify.com',
                password: hashedPassword
            }
        });
        console.log('Patient 2 created:', patient2.id);

        // 4. Create Appointment for Patient 1
        await prisma.appointment.create({
            data: {
                date: '2023-12-01',
                time: '10:00',
                patientName: patient1.name,
                userId: patient1.id,
                doctorId: doctor.doctorId
            }
        });
        console.log('Appointment created for Patient 1');

        console.log('\n--- VERIFICATION ---');

        // Login as Doctor
        const loginRes = await axios.post(`${API_URL}/login`, {
            identifier: 'drverify@canqure.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Doctor logged in');

        // Test 1: Access Patient 1 (Allowed)
        try {
            await axios.get(`${API_URL}/api/doctors/${doctor.doctorId}/patient/${patient1.id}`, config);
            console.log('✅ Test 1 Passed: Accessed Patient 1 details');
        } catch (e) {
            console.error('❌ Test 1 Failed:', e.response?.data || e.message);
        }

        // Test 2: Access Patient 2 (Denied)
        try {
            await axios.get(`${API_URL}/api/doctors/${doctor.doctorId}/patient/${patient2.id}`, config);
            console.error('❌ Test 2 Failed: Accessed Patient 2 details (Should be denied)');
        } catch (e) {
            if (e.response?.status === 403) {
                console.log('✅ Test 2 Passed: Access to Patient 2 denied (403)');
            } else {
                console.error('❌ Test 2 Failed: Unexpected error', e.response?.status, e.message);
            }
        }

        // Test 3: Add Prescription for Patient 1
        try {
            const presRes = await axios.post(`${API_URL}/api/doctors/${doctor.doctorId}/patient/${patient1.id}/prescription`, {
                medName: 'Test Med',
                description: 'Take daily',
                dose: '10mg',
                frequency: 'Once a day',
                startDate: '2023-12-01',
                endDate: '2023-12-10'
            }, config);
            console.log('✅ Test 3 Passed: Prescription added', presRes.data.medId);
        } catch (e) {
            console.error('❌ Test 3 Failed:', e.response?.data || e.message);
        }

        // Test 4: Add Prescription for Patient 2 (Denied)
        try {
            await axios.post(`${API_URL}/api/doctors/${doctor.doctorId}/patient/${patient2.id}/prescription`, {
                medName: 'Illegal Med',
                description: 'Should fail',
                dose: '10mg',
                frequency: 'Once a day',
                startDate: '2023-12-01',
                endDate: '2023-12-10'
            }, config);
            console.error('❌ Test 4 Failed: Added prescription for Patient 2 (Should be denied)');
        } catch (e) {
            if (e.response?.status === 403) {
                console.log('✅ Test 4 Passed: Prescription for Patient 2 denied (403)');
            } else {
                console.error('❌ Test 4 Failed: Unexpected error', e.response?.status, e.message);
            }
        }

    } catch (error) {
        console.error('Verification Script Error:', error);
    } finally {
        // Cleanup (Optional, but good for repeated runs)
        // await prisma.appointment.deleteMany();
        // await prisma.medicine.deleteMany();
        // await prisma.user.deleteMany({ where: { email: { in: ['p1@verify.com', 'p2@verify.com'] } } });
        // await prisma.doctor.delete({ where: { email: 'drverify@canqure.com' } });
        await prisma.$disconnect();
    }
}

setTimeout(verify, 5000);
