import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testApi() {
    console.log("=== STARTING MODULAR API VERIFICATION ===");
    let token = '';
    let patientId = '';
    let doctorId = '';

    // 1. Test Login (Patient)
    try {
        console.log("\n1. Testing Patient Login...");
        const res = await axios.post(`${BASE_URL}/login`, {
            identifier: 'patient@canqure.com',
            password: 'patient123'
        });
        console.log("Patient Login Success:", res.data);
        if (res.data.token && res.data.user?.id) {
            token = res.data.token;
            patientId = res.data.user.id;
            console.log(`✓ Token acquired. Patient ID: ${patientId}`);
        } else {
            console.error("✗ Login payload incomplete.");
        }
    } catch (err) {
        console.error("✗ Login Failed:", err.response?.data || err.message);
        return;
    }

    // 2. Test Get Dashboard
    try {
        console.log("\n2. Testing Patient Dashboard...");
        const res = await axios.get(`${BASE_URL}/user/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Dashboard Success! Relations returned:");
        console.log("- Appointments:", res.data.Appointments ? "Found (Legacy Casing)" : "Not Found");
        console.log("- Reports:", res.data.Reports ? "Found (Legacy Casing)" : "Not Found");
        console.log("- CancerType:", res.data.CancerType ? "Found (Legacy Casing)" : "Not Found");
        console.log("✓ Dashboard verification complete.");
    } catch (err) {
        console.error("✗ Dashboard Fetch Failed:", err.response?.data || err.message);
    }

    // 3. Test Doctors List
    try {
        console.log("\n3. Testing Doctors List & Legacies...");
        const res = await axios.get(`${BASE_URL}/user/doctors`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const doctors = res.data;
        console.log(`Doctors count: ${doctors.length}`);
        if (doctors.length > 0) {
            const firstDoc = doctors[0];
            doctorId = firstDoc.id;
            console.log("First Doctor:", {
                id: firstDoc.id,
                doctorId: firstDoc.doctorId, // Legacy alias
                name: firstDoc.name,
                specialist: firstDoc.specialist,
                hospitalName: firstDoc.hospital?.name
            });
            if (firstDoc.doctorId) {
                console.log("✓ Legacy doctorId alias present!");
            } else {
                console.error("✗ Legacy doctorId alias missing!");
            }
        }
    } catch (err) {
        console.error("✗ Doctors Fetch Failed:", err.response?.data || err.message);
    }

    // 4. Test Doctor Availability
    try {
        console.log("\n4. Testing Doctor Availability query...");
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.get(`${BASE_URL}/user/availability?doctorId=${doctorId}&date=${today}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Availability results:", res.data);
        console.log("✓ Availability verification complete.");
    } catch (err) {
        console.error("✗ Availability Query Failed:", err.response?.data || err.message);
    }

    // 5. Test Refill Orders
    try {
        console.log("\n5. Testing Refill Orders...");
        const res = await axios.get(`${BASE_URL}/refill-orders/patient`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Refill orders count: ${res.data.length}`);
        if (res.data.length > 0) {
            console.log("First Order:", {
                id: res.data[0].id,
                medName: res.data[0].medName,
                pharmacyName: res.data[0].pharmacyName, // Legacy mapping from Pharmacy relation
                status: res.data[0].status
            });
            if (res.data[0].pharmacyName) {
                console.log("✓ Legacy pharmacyName mapped correctly from Pharmacy relation!");
            } else {
                console.error("✗ Legacy pharmacyName missing!");
            }
        }
    } catch (err) {
        console.error("✗ Refill Orders Fetch Failed:", err.response?.data || err.message);
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
}

testApi();
