import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET LOADED IN MIDDLEWARE:", JWT_SECRET ? "YES" : "NO");

export const signupMiddleware = (req, res, next) => {
    const { username, email, password } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ message: "Username, email and password are required" });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    next();
};

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("DECODED TOKEN:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("TOKEN VERIFICATION ERROR:", error.message);
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        console.log("VERIFY ADMIN ROLE:", req.user?.role);
        if (req.user.role === 'admin') {
            next();
        } else {
            console.warn("ADMIN ACCESS DENIED for role:", req.user?.role);
            res.status(403).json({ message: 'Access denied: Admins only' });
        }
    });
};

export const verifyDoctor = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'doctor' || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Doctors only' });
        }
    });
};

export const verifyPatient = (req, res, next) => {
    verifyToken(req, res, () => {
        if (
            req.user.role === 'patient' ||
            req.user.role === 'primary_caregiver' ||
            req.user.role === 'secondary_caregiver' ||
            req.user.role === 'admin'
        ) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Patients and Caregivers only' });
        }
    });
};

export const verifyHospitalAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'hospital_admin' || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Hospital Admins only' });
        }
    });
};

export const verifyPharmacy = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'pharmacy' || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Pharmacy only' });
        }
    });
};

