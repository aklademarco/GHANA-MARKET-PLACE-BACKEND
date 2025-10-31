import { Request, Response } from "express";
import { products } from "../../db/schema.js";
import { db } from "../../db/index.js";
import { eq, desc, like, and } from "drizzle-orm";

// get all products

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, bestSeller } = req.query;
    let query = db.select().from(products);

    // Filter by category
    const conditions = [];
    if (category) conditions.push(eq(products.category, category as string));
    if (bestSeller === "true") conditions.push(eq(products.bestSeller, true));
    if (search) conditions.push(like(products.name, `%${search}%`));
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    const allProducts = await query.orderBy(desc(products.createdAt));

    res.json({
      success: true,
      count: allProducts.length,
      data: allProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// get product by id

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!product.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      images,
      category,
      subCategory,
      sizes,
      inStock,
      bestSeller,
      sellerId,
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description, price, and category are required",
      });
    }

    const newProduct = await db
      .insert(products)
      .values({
        name,
        description,
        price: price.toString(),
        images: images || [],
        category,
        subCategory: subCategory || null,
        sizes: sizes || [],
        inStock: inStock ?? true,
        bestSeller: bestSeller ?? false,
        rating: "0.0",
        sellerId: sellerId || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    const updates = req.body;

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const updatedProduct = await db
      .update(products)
      .set({
        ...updates,
        price: updates.price ? updates.price.toString() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const deleted = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
