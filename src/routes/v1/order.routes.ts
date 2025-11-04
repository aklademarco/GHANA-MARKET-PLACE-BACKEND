import { Router } from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../controllers/v1/order.controller.js";

const router = Router();

router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrderStatus);
router.put("/:id/payment", updatePaymentStatus);

export default router;
