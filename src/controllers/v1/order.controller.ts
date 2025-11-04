import type { Request, Response } from "express";
import { orders, orderItems, products, cart } from "../../db/schema.js";
import { db } from "../../db/index.js";
import { eq, desc, and } from "drizzle-orm";

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

// GET /api/v1/orders - Get all orders for user
// Purpose: Retrieve user's order history

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch user's orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            size: orderItems.size,
            productName: products.name,
            productImage: products.images,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    res.json({
      success: true,
      count: ordersWithItems.length,
      data: ordersWithItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/v1/orders/:id - Get single order by ID
// Purpose: Retrieve detailed information for a specific order

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Fetch order
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order.length || !order[0]) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Fetch order items
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        size: orderItems.size,
        productName: products.name,
        productImage: products.images,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    res.json({
      success: true,
      data: {
        ...order[0],
        items,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POST /api/v1/orders - Create new order (checkout)
// Supports both authenticated users and guest checkout
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;
    const { cartItems, shippingAddress, guestInfo } = req.body;

    // Guest checkout: require guest info (name, email, phone) if no userId
    if (!userId && !guestInfo) {
      return res.status(400).json({
        success: false,
        message:
          "Guest information (name, email, phone) is required for guest checkout",
      });
    }

    if (
      guestInfo &&
      (!guestInfo.name || !guestInfo.email || !guestInfo.phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Guest name, email, and phone are required",
      });
    }

    if (!cartItems || typeof cartItems !== "object") {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // Validate and calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const productId in cartItems) {
      const productIdNum = parseInt(productId);
      if (isNaN(productIdNum)) continue;

      // Fetch product details
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, productIdNum))
        .limit(1);

      if (!product.length || !product[0]) continue;

      const productData = product[0];

      // Check if product is in stock
      if (!productData.inStock) {
        return res.status(400).json({
          success: false,
          message: `Product "${productData.name}" is out of stock`,
        });
      }

      // Process each size variant
      for (const size in cartItems[productId]) {
        const quantity = cartItems[productId][size];

        if (quantity > 0) {
          const itemTotal = parseFloat(productData.price) * quantity;
          totalAmount += itemTotal;

          orderItemsData.push({
            productId: productIdNum,
            quantity,
            price: productData.price,
            size,
          });
        }
      }
    }

    if (orderItemsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items in cart",
      });
    }

    // Create order (with guest info if guest checkout)
    const newOrder = await db
      .insert(orders)
      .values({
        userId: userId || null, // null for guest orders
        totalAmount: totalAmount.toString(),
        status: "pending",
        shippingAddress,
        guestInfo: guestInfo || null, // Store guest info for guest orders
        paymentStatus: "pending",
      })
      .returning();

    if (!newOrder.length || !newOrder[0]) {
      return res.status(500).json({
        success: false,
        message: "Failed to create order",
      });
    }

    const orderId = newOrder[0].id;

    // Insert order items
    const insertedItems = await Promise.all(
      orderItemsData.map((item) =>
        db
          .insert(orderItems)
          .values({
            orderId,
            ...item,
          })
          .returning()
      )
    );

    // Clear user's cart from database (only if authenticated user)
    if (userId) {
      await db.delete(cart).where(eq(cart.userId, userId));
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        ...newOrder[0],
        items: insertedItems.map((item) => item[0]),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// PUT /api/v1/orders/:id - Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder.length || !existingOrder[0]) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order status
    const updatedOrder = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// PUT /api/v1/orders/:id/payment - Update payment status
// Purpose: Update payment status (for payment gateway callback)

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required",
      });
    }

    const validPaymentStatuses = ["pending", "paid", "failed"];

    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Update payment status
    const updatedOrder = await db
      .update(orders)
      .set({
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder.length || !updatedOrder[0]) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: updatedOrder[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
