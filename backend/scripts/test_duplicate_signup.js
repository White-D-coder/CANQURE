import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testDuplicateSignup() {
    const userData = {
        username: 'duplicate_user',
        email: 'duplicate@test.com',
        password: 'password123'
    };

    try {
        console.log('Attempt 1:', userData.email);
        await axios.post(`${API_URL}/signup`, userData);
        console.log('Signup 1 successful');
    } catch (error) {
        console.log('Signup 1 result:', error.response?.status);
    }

    try {
        console.log('Attempt 2 (Duplicate):', userData.email);
        await axios.post(`${API_URL}/signup`, userData);
        console.log('Signup 2 successful (Unexpected)');
    } catch (error) {
        console.error('Signup 2 failed (Expected):', error.response ? error.response.data : error.message);
    }
}

testDuplicateSignup();
