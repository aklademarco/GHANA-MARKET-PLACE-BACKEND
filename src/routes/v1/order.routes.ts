import { Router } from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../controllers/v1/order.controller.js";

const router = Router();

router.get("/order", getUserOrders);
router.get("/order/:id", getOrderById);
router.post("/order", createOrder);
router.put("/order/:id", updateOrderStatus);
router.put("/order/:id/payment", updatePaymentStatus);

export default router;
