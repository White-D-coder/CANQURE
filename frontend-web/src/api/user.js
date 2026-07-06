import api from './axios';

export const getDashboardData = async () => {
    try {
        const response = await api.get('/user/dashboard');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getDoctors = async () => {
    try {
        const response = await api.get('/user/doctors');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const bookAppointment = async (appointmentData) => {
    try {
        const response = await api.post('/user/book-appointment', appointmentData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getDoctorAvailability = async (doctorId, date) => {
    try {
        const response = await api.get(`/user/availability?doctorId=${doctorId}&date=${date}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createRefillOrder = async (orderData) => {
    try {
        const response = await api.post('/refill-orders', orderData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getPatientRefillOrders = async () => {
    try {
        const response = await api.get('/refill-orders/patient');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const confirmRefillDelivery = async (orderId) => {
    try {
        const response = await api.put(`/refill-orders/${orderId}/confirm-delivery`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getRefillTracking = async (orderId) => {
    try {
        const response = await api.get(`/refill-orders/${orderId}/tracking`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

