import { Router } from "express";
import {
  getUserCart,
  syncCart,
  saveCart,
  clearCart,
} from "../../controllers/v1/cart.controller.js";

const router = Router();

router.get("/cart", getUserCart);
router.post("/cart/sync", syncCart);
router.post("/cart/save", saveCart);
router.delete("/cart", clearCart);

export default router;
