import express from 'express';
import { PharmacyOperationsController } from './pharmacy_operations.controller.js';
import { verifyPatient, verifyPharmacy } from '../../middleware/middleware.js';

const router = express.Router();
const controller = new PharmacyOperationsController();

router.post('/', verifyPatient, controller.createRefillOrder);
router.get('/patient', verifyPatient, controller.getPatientRefillOrders);
router.get('/all', verifyPharmacy, controller.getPharmacyRefillOrders);
router.put('/:id/status', verifyPharmacy, controller.updateRefillOrderStatus);
router.put('/:id/confirm-delivery', verifyPatient, controller.confirmRefillDelivery);
router.get('/:id/tracking', verifyPatient, controller.getRefillTracking);

export default router;
