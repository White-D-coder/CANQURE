import express from 'express';
import { EmergencyController } from './emergency.controller.js';
import { verifyPatient, verifyToken } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new EmergencyController();

// Built-in in-memory rate limiter (zero external dependencies required)
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 10) => {
    const requests = new Map();
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const userRequests = requests.get(ip) || [];
        const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

        if (validRequests.length >= max) {
            return res.status(429).json({
                error: { code: 'TOO_MANY_REQUESTS', message: 'Too many SOS requests triggered. Please wait before retrying.' }
            });
        }

        validRequests.push(now);
        requests.set(ip, validRequests);
        next();
    };
};

const sosLimiter = createRateLimiter(15 * 60 * 1000, 10);

router.get('/hospitals', verifyPatient, controller.getHospitals);
router.post('/sos-broadcast', verifyPatient, sosLimiter, controller.sosBroadcast);
router.get('/sos/active', verifyToken, controller.getActiveSos);
router.put('/sos/:id/ambulance', verifyToken, controller.updateAmbulance);

export default router;
