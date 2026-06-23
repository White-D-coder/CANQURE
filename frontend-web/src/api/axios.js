import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === ''
);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 
             (isLocalhost ? 'http://localhost:3000/api' : 'https://can-cure.onrender.com/api'),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
