import { Router } from "express";
import {
  getUserCart,
  syncCart,
  saveCart,
  clearCart,
} from "../../controllers/v1/cart.controller.js";

const router = Router();

router.get("/", getUserCart);
router.post("/sync", syncCart);
router.post("/save", saveCart);
router.delete("/", clearCart);

export default router;
