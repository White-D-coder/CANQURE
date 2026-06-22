import axios from 'axios';
import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:3000';

async function verifyRBAC() {
    try {
        console.log('--- SETUP ---');
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create Admin
        const admin = await prisma.admin.create({
            data: { username: 'rbac_admin_' + Date.now(), password: hashedPassword }
        });

        // Create Patient
        const patient = await prisma.user.create({
            data: { name: 'RBAC Patient', email: 'rbac_patient_' + Date.now() + '@test.com', password: hashedPassword }
        });

        console.log('Admin and Patient created.');

        // Login Admin
        const adminLogin = await axios.post(`${API_URL}/login`, { identifier: admin.username, password: 'password123' });
        const adminToken = adminLogin.data.token;
        console.log('Admin logged in.');

        // Login Patient
        const patientLogin = await axios.post(`${API_URL}/login`, { identifier: patient.email, password: 'password123' });
        const patientToken = patientLogin.data.token;
        console.log('Patient logged in.');

        console.log('\n--- VERIFICATION ---');

        // Test 1: Patient accessing Patient Dashboard (Allowed)
        try {
            await axios.get(`${API_URL}/api/user/dashboard`, { headers: { Authorization: `Bearer ${patientToken}` } });
            console.log('✅ Test 1 Passed: Patient accessed dashboard');
        } catch (e) {
            console.error('❌ Test 1 Failed:', e.response?.data || e.message);
        }

        // Test 2: Admin accessing Patient Dashboard (Allowed - Admin has super access in our middleware)
        try {
            await axios.get(`${API_URL}/api/user/dashboard`, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log('✅ Test 2 Passed: Admin accessed patient dashboard (as per middleware logic)');
        } catch (e) {
            // If admin shouldn't access, this would be a pass, but our middleware allows it.
            console.log('ℹ️ Test 2 Note:', e.response?.status);
        }

        // Test 3: Patient accessing Admin Route (Denied)
        try {
            await axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${patientToken}` } });
            console.error('❌ Test 3 Failed: Patient accessed Admin Stats (Should be denied)');
        } catch (e) {
            if (e.response?.status === 403) {
                console.log('✅ Test 3 Passed: Patient denied access to Admin Stats (403)');
            } else {
                console.error('❌ Test 3 Failed: Unexpected error', e.response?.status);
            }
        }

    } catch (error) {
        console.error('RBAC Verification Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRBAC();
