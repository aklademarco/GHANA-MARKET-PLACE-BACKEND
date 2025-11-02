import type { Request, Response } from "express";
import { cart, products } from "../../db/schema.js";
import { db } from "../../db/index.js";
import { eq, and } from "drizzle-orm";


interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

// GET /api/v1/cart - Get saved cart for logged-in user
// Purpose: Retrieve user's saved cart from database (for multi-device sync)

export const getUserCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch user's cart from database
    const userCartItems = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId));

    // Transform to frontend format: { [productId]: { [size]: quantity } }
    const cartItems: Record<string, Record<string, number>> = {};

    for (const item of userCartItems) {
      const productId = item.productId.toString();
      const size = item.size || "default";

      if (!cartItems[productId]) {
        cartItems[productId] = {};
      }

      cartItems[productId][size] = item.quantity;
    }

    res.json({
      success: true,
      data: { cartItems },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POST /api/v1/cart/sync - Sync/merge frontend cart with backend after login
// Purpose: Merge guest cart (from localStorage) with user's saved cart

export const syncCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;
    const { cartItems } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!cartItems || typeof cartItems !== "object") {
      return res.status(400).json({
        success: false,
        message: "Valid cart data required",
      });
    }

    // Process each product in the cart
    for (const productId in cartItems) {
      const productIdNum = parseInt(productId);

      if (isNaN(productIdNum)) continue;

      // Verify product exists
      const productExists = await db
        .select()
        .from(products)
        .where(eq(products.id, productIdNum))
        .limit(1);

      if (!productExists.length) continue;

      // Process each size for this product
      for (const size in cartItems[productId]) {
        const quantity = cartItems[productId][size];

        if (quantity <= 0) continue;

        // Check if item already exists in user's cart
        const existingItem = await db
          .select()
          .from(cart)
          .where(
            and(
              eq(cart.userId, userId),
              eq(cart.productId, productIdNum),
              eq(cart.size, size)
            )
          )
          .limit(1);

        if (existingItem.length > 0 && existingItem[0]) {
          // Update existing item - use max quantity
          const newQuantity = Math.max(existingItem[0].quantity, quantity);

          await db
            .update(cart)
            .set({ quantity: newQuantity })
            .where(eq(cart.id, existingItem[0].id));
        } else {
          // Insert new item
          await db.insert(cart).values({
            userId,
            productId: productIdNum,
            quantity,
            size,
          });
        }
      }
    }

    // Return updated cart in frontend format
    const updatedCart = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId));

    const syncedCartItems: Record<string, Record<string, number>> = {};

    for (const item of updatedCart) {
      const prodId = item.productId.toString();
      const itemSize = item.size || "default";

      if (!syncedCartItems[prodId]) {
        syncedCartItems[prodId] = {};
      }

      syncedCartItems[prodId][itemSize] = item.quantity;
    }

    res.json({
      success: true,
      message: "Cart synced successfully",
      data: { cartItems: syncedCartItems },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error syncing cart",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POST /api/v1/cart/save - Save current cart state to backend
// Purpose: Backup cart to database 
export const saveCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;
    const { cartItems } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!cartItems || typeof cartItems !== "object") {
      return res.status(400).json({
        success: false,
        message: "Valid cart data required",
      });
    }

    // Clear existing cart
    await db.delete(cart).where(eq(cart.userId, userId));

    // Insert all cart items
    for (const productId in cartItems) {
      const productIdNum = parseInt(productId);

      if (isNaN(productIdNum)) continue;

      for (const size in cartItems[productId]) {
        const quantity = cartItems[productId][size];

        if (quantity > 0) {
          await db.insert(cart).values({
            userId,
            productId: productIdNum,
            quantity,
            size,
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Cart saved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error saving cart",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// DELETE /api/v1/cart - Clear user's saved cart
// Purpose: Remove all cart items from database
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    await db.delete(cart).where(eq(cart.userId, userId));

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
