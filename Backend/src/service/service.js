import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import express from 'express';
import { signupMiddleware } from '../middleware/middleware.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import doctorRoutes from '../routes/doctor.routes.js';
import adminRoutes from '../routes/admin.routes.js';
import reportRoutes from '../routes/report.routes.js';
import userRoutes from '../routes/user.routes.js';
import medicinalRoutes from '../routes/medicinal.routes.js';
import consultationRoutes from '../routes/consultation.routes.js';
import hospitalRoutes from '../routes/hospital.routes.js';
import refillRoutes from '../routes/refill.routes.js';
import axios from 'axios';
import cors from 'cors';

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const app = express()
app.use(cors());
app.use(express.json())

const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/user', userRoutes);
apiRouter.use('/medicinal', medicinalRoutes);
apiRouter.use('/consultations', consultationRoutes);
apiRouter.use('/hospitals', hospitalRoutes);
apiRouter.use('/refill-orders', refillRoutes);

// ML Risk Assessment Proxy Route
apiRouter.post('/risk-assessment', async (req, res) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error("ML Service Error:", error.message);
        res.status(500).json({ 
            message: "Risk assessment service unavailable", 
            error: error.message 
        });
    }
});

apiRouter.post('/signup', signupMiddleware, async (req, res) => {
    try {
        const { username, email, password } = req.body
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        })
        if (user) {
            return res.status(409).json({ message: "User or Email already exists" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                username: username,
                name: username,
                email: email,
                password: hashedPassword
            }
        })
        const token = jwt.sign({ id: newUser.id, role: 'patient' }, JWT_SECRET, { expiresIn: '1h' })

        return res.status(201).json({
            message: "User created",
            token,
            role: 'patient',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: 'patient'
            }
        })
    } catch (error) {
        console.error("Signup Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
})

apiRouter.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const admin = await prisma.admin.findUnique({ where: { username: identifier } });
        console.log("LOGIN ATTEMPT - ADMIN CHECK:", admin ? "FOUND" : "NOT FOUND", "Identifier:", identifier);
        if (admin) {
            const isMatch = password === admin.password || await bcrypt.compare(password, admin.password);
            console.log("PASSWORD MATCH:", isMatch);
            if (isMatch) {
                const role = admin.role || 'admin';
                const token = jwt.sign({ id: admin.adminId, role, pharmacyName: admin.pharmacyName }, JWT_SECRET, { expiresIn: '1h' });
                console.log("GENERATED ADMIN TOKEN FOR:", admin.username);
                return res.status(200).json({ message: "Login successful", token, role, user: { id: admin.adminId, username: admin.username, role, pharmacyName: admin.pharmacyName } });

            }
        }

        const doctor = await prisma.doctor.findFirst({
            where: { OR: [{ email: identifier }, { username: identifier }] }
        });
        console.log("LOGIN ATTEMPT - DOCTOR CHECK:", doctor ? "FOUND" : "NOT FOUND");
        if (doctor) {
            const isMatch = await bcrypt.compare(password, doctor.password);
            if (isMatch || password === doctor.password) {
                const token = jwt.sign({ id: doctor.doctorId, role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });
                console.log("GENERATED DOCTOR TOKEN FOR:", doctor.name);
                return res.status(200).json({ message: "Login successful", token, role: 'doctor', user: { id: doctor.doctorId, name: doctor.name, email: doctor.email, role: 'doctor' } });
            }
        }

        const user = await prisma.user.findFirst({
            where: { OR: [{ email: identifier }, { username: identifier }] }
        });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user.id, role: 'patient' }, JWT_SECRET, { expiresIn: '1h' });
                return res.status(200).json({ message: "Login successful", token, role: 'patient', user: { id: user.id, name: user.name, email: user.email, role: 'patient' } });
            }
        }

        return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
})

app.get('/', (req, res) => {
    res.send("Welcome to CAN-QURE Backend Service")
})

app.listen(3000, '0.0.0.0', () => {
    console.log("Server started on port 3000 - API V1 Standardized");
});

export default app;