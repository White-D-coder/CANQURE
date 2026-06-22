import axios from 'axios';
import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:3000';

async function testLogin() {
    try {
        console.log('--- SETUP ---');
        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = 'login_test_' + Date.now() + '@example.com';
        await prisma.user.create({
            data: {
                name: 'Login Test User',
                email: email,
                password: hashedPassword
            }
        });
        console.log('Test user created:', email);

        console.log('\n--- TESTING LOGIN ---');
        try {
            const response = await axios.post(`${API_URL}/login`, {
                identifier: email,
                password: 'password123'
            });
            console.log('Login successful:', response.data);
        } catch (error) {
            console.error('Login failed:', error.response ? error.response.data : error.message);
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
