import api from './axios';

const ADMIN_BASE = '/admin';

export const getSystemStats = async () => {
    const response = await api.get(`${ADMIN_BASE}/stats`);
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get(`${ADMIN_BASE}/patients`);
    return response.data;
};

export const getAllDoctors = async () => {
    const response = await api.get(`${ADMIN_BASE}/doctors`);
    return response.data;
};

export const createDoctor = async (data) => {
    const response = await api.post(`${ADMIN_BASE}/doctors`, data);
    return response.data;
};

export const updateDoctor = async (id, data) => {
    const response = await api.put(`${ADMIN_BASE}/doctors/${id}`, data);
    return response.data;
};

export const deleteDoctor = async (id) => {
    const response = await api.delete(`${ADMIN_BASE}/doctors/${id}`);
    return response.data;
};

export const createPatient = async (data) => {
    const response = await api.post(`${ADMIN_BASE}/patients`, data);
    return response.data;
};

export const updatePatient = async (id, data) => {
    const response = await api.put(`${ADMIN_BASE}/patients/${id}`, data);
    return response.data;
};

export const deletePatient = async (id) => {
    const response = await api.delete(`${ADMIN_BASE}/patients/${id}`);
    return response.data;
};

export const createTimeSlots = async (data) => {
    const response = await api.post(`${ADMIN_BASE}/schedule/create`, data);
    return response.data;
};

export const updateSlotStatus = async (data) => {
    const response = await api.put(`${ADMIN_BASE}/schedule/status`, data);
    return response.data;
};

export const getDoctorSlots = async (doctorId, date) => {
    const response = await api.get(`${ADMIN_BASE}/schedule?doctorId=${doctorId}&date=${date}`);
    return response.data;
};

// Hospital Management
export const getAllHospitals = async () => {
    const response = await api.get('/hospitals');
    return response.data;
};

export const createHospital = async (data) => {
    const response = await api.post('/hospitals', data);
    return response.data;
};

export const updateHospital = async (id, data) => {
    const response = await api.put(`/hospitals/${id}`, data);
    return response.data;
};

export const deleteHospital = async (id) => {
    const response = await api.delete(`/hospitals/${id}`);
    return response.data;
};
