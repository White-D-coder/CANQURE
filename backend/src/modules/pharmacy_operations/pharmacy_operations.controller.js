import { BaseController } from '../../shared/BaseController.js';
import { PharmacyOperationsService } from './pharmacy_operations.service.js';

export class PharmacyOperationsController extends BaseController {
    constructor() {
        super();
        this.pharmacyOperationsService = new PharmacyOperationsService();
    }

    createRefillOrder = async (req, res) => {
        try {
            const patientId = req.user.id;
            const order = await this.pharmacyOperationsService.createRefillOrder(patientId, req.body);
            return this.success(res, order, "Refill order routed successfully", 201);
        } catch (err) {
            console.error("Create Refill Order Error:", err);
            return this.error(res, err.message, 500, err);
        }
    };

    getPatientRefillOrders = async (req, res) => {
        try {
            const patientId = req.user.id;
            const orders = await this.pharmacyOperationsService.getPatientRefillOrders(patientId);
            return this.success(res, orders);
        } catch (err) {
            return this.error(res, "Failed to fetch refill orders", 500, err);
        }
    };

    getPharmacyRefillOrders = async (req, res) => {
        try {
            const filterName = (req.user.role === 'pharmacy' && req.user.pharmacyName) 
                ? req.user.pharmacyName 
                : null;

            const orders = await this.pharmacyOperationsService.getPharmacyRefillOrders(filterName);
            return this.success(res, orders);
        } catch (err) {
            return this.error(res, "Failed to fetch pharmacy refill orders", 500, err);
        }
    };

    updateRefillOrderStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) return this.error(res, "Status field is required", 400);

            const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY", "ARRIVING", "HANDOVER_PENDING", "DELIVERED", "FAILED", "RETURNED"];
            if (!validStatuses.includes(status)) {
                return this.error(res, "Invalid status value", 400);
            }

            const updatedOrder = await this.pharmacyOperationsService.updateRefillOrderStatus(id, status);
            return this.success(res, updatedOrder, "Order status updated successfully");
        } catch (err) {
            return this.error(res, "Failed to update refill status", 500, err);
        }
    };

    confirmRefillDelivery = async (req, res) => {
        try {
            const { id } = req.params;
            const patientId = req.user.id;

            const result = await this.pharmacyOperationsService.confirmRefillDelivery(id, patientId);
            return this.success(res, result, "Refill delivery confirmed successfully");
        } catch (err) {
            console.error("Confirm Refill Delivery Error:", err);
            const status = err.message.includes("not found") ? 404 : 400;
            return this.error(res, err.message, status, err);
        }
    };

    getRefillTracking = async (req, res) => {
        try {
            const { id } = req.params;
            const patientId = req.user.id;

            const trackingInfo = await this.pharmacyOperationsService.getRefillTracking(id, patientId);
            if (!trackingInfo) return this.error(res, "Refill order not found or access denied", 404);

            return this.success(res, trackingInfo);
        } catch (err) {
            console.error("Get Refill Tracking Error:", err);
            return this.error(res, err.message, 500, err);
        }
    };
}
