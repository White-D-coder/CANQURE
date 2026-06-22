import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testSignup() {
    try {
        const userData = {
            username: 'testuser_' + Date.now(),
            email: 'testuser_' + Date.now() + '@example.com',
            password: 'password123'
        };

        console.log('Attempting signup with:', userData);

        const response = await axios.post(`${API_URL}/signup`, userData);
        console.log('Signup successful:', response.data);
    } catch (error) {
        console.error('Signup failed:', error.response ? error.response.data : error.message);
    }
}

testSignup();
