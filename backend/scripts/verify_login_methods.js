import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

async function verifyLoginMethods() {
    try {
        console.log('--- Verifying Login Methods ---');

        const testEmail = 'login_test@example.com';
        const testUsername = 'login_test_user';
        const testPassword = 'password123';

        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: testEmail },
                    { username: testUsername }
                ]
            }
        });

        // 2. Signup
        console.log('Signing up...');
        try {
            await axios.post(`${API_URL}/signup`, {
                username: testUsername,
                email: testEmail,
                password: testPassword
            });
            console.log('Signup successful.');
        } catch (error) {
            console.error('Signup failed:', error.response?.data || error.message);
            return;
        }

        // 3. Login with Email
        console.log('Logging in with Email...');
        try {
            const res = await axios.post(`${API_URL}/login`, {
                identifier: testEmail,
                password: testPassword
            });
            console.log('Login with Email successful:', res.data.message);
        } catch (error) {
            console.error('Login with Email failed:', error.response?.data || error.message);
        }

        // 4. Login with Username
        console.log('Logging in with Username...');
        try {
            const res = await axios.post(`${API_URL}/login`, {
                identifier: testUsername,
                password: testPassword
            });
            console.log('Login with Username successful:', res.data.message);
        } catch (error) {
            console.error('Login with Username failed:', error.response?.data || error.message);
        }

    } catch (e) {
        console.error('Verification script error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLoginMethods();
