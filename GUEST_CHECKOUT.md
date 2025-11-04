# Guest Checkout Integration Guide

## Backend Changes Made

### 1. **Database Schema Updated**

- `orders.userId` is now **nullable** (allows guest orders)
- Added `orders.guestInfo` field to store guest customer details

### 2. **Order Creation Supports Two Modes**

#### **Authenticated User Checkout**

```javascript
// For logged-in users
const response = await fetch("/api/v1/order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    cartItems: {
      1: { S: 2, M: 1 },
      5: { L: 3 },
    },
    shippingAddress: {
      homeAddress: "123 Main St",
      city: "Accra",
      regionOrState: "Greater Accra",
      country: "Ghana",
      zipCode: "00233",
    },
  }),
});
```

#### **Guest Checkout** ✨ NEW

```javascript
// For guest users (no token needed)
const response = await fetch("/api/v1/order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    cartItems: {
      1: { S: 2, M: 1 },
      5: { L: 3 },
    },
    shippingAddress: {
      homeAddress: "123 Main St",
      city: "Accra",
      regionOrState: "Greater Accra",
      country: "Ghana",
      zipCode: "00233",
    },
    guestInfo: {
      // ← Required for guest checkout
      name: "John Doe",
      email: "john@example.com",
      phone: "+233123456789",
    },
  }),
});
```

---

## Frontend Implementation

### **Checkout Component Example**

```javascript
import React, { useState } from "react";
import { useCartStore } from "../context/cartStore";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCartStore();

  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(false);

  // Guest info state
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState({
    homeAddress: "",
    city: "",
    regionOrState: "",
    country: "Ghana",
    zipCode: "",
  });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Determine if user is authenticated
      const isAuthenticated = !!token;

      // Build request body
      const requestBody = {
        cartItems,
        shippingAddress,
      };

      // Add guest info if guest checkout
      if (!isAuthenticated) {
        requestBody.guestInfo = guestInfo;
      }

      // Build headers
      const headers = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:5000/api/v1/order", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart
        clearCart();

        // Navigate to confirmation
        navigate(`/order-confirmation/${result.data.id}`);
      } else {
        alert(result.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Show option to login or continue as guest */}
      {!isLoggedIn && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="mb-3">Already have an account?</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="bg-black text-white px-6 py-2 rounded"
            >
              Login
            </button>
            <button
              onClick={() => setIsGuest(true)}
              className="border border-black px-6 py-2 rounded"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCheckout}>
        {/* Guest Info Section (only for guests) */}
        {!isLoggedIn && (
          <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={guestInfo.name}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, name: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={guestInfo.email}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, email: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={guestInfo.phone}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, phone: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Shipping Address Section */}
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-2">Street Address *</label>
              <input
                type="text"
                required
                value={shippingAddress.homeAddress}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    homeAddress: e.target.value,
                  })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      city: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Region/State *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.regionOrState}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      regionOrState: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Zip Code *</label>
              <input
                type="text"
                required
                value={shippingAddress.zipCode}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    zipCode: e.target.value,
                  })
                }
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded text-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
```

---

## Key Features

### ✅ **For Authenticated Users:**

- No guest info required
- Cart auto-clears from database
- Can view orders in "My Orders" page

### ✅ **For Guest Users:**

- Must provide name, email, phone
- No account needed
- Order confirmation sent to email
- Cannot view order history (no login)

### ✅ **Backend Handles Both:**

- `userId` is null for guest orders
- `guestInfo` stores guest details
- Same order flow for both types

---

## Migration Required

After updating the schema, run:

```bash
npm run db:generate
npm run db:migrate
```

This will add the `guestInfo` column and make `userId` nullable.

---

## API Endpoint Documentation

### **POST /api/v1/order - Create Order**

**Endpoint:** `POST http://localhost:5000/api/v1/order`

**Purpose:** Create a new order (supports both authenticated and guest checkout)

#### **Request Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>" // Optional - only for authenticated users
}
```

#### **Request Body (Authenticated User):**

```json
{
  "cartItems": {
    "1": { "S": 2, "M": 1 },
    "5": { "L": 3 }
  },
  "shippingAddress": {
    "homeAddress": "123 Main St",
    "city": "Accra",
    "regionOrState": "Greater Accra",
    "country": "Ghana",
    "zipCode": "00233"
  }
}
```

#### **Request Body (Guest User):**

```json
{
  "cartItems": {
    "1": { "S": 2, "M": 1 },
    "5": { "L": 3 }
  },
  "shippingAddress": {
    "homeAddress": "123 Main St",
    "city": "Accra",
    "regionOrState": "Greater Accra",
    "country": "Ghana",
    "zipCode": "00233"
  },
  "guestInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+233123456789"
  }
}
```

#### **Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 123,
    "userId": null,
    "totalAmount": "450.00",
    "status": "pending",
    "shippingAddress": {
      "homeAddress": "123 Main St",
      "city": "Accra",
      "regionOrState": "Greater Accra",
      "country": "Ghana",
      "zipCode": "00233"
    },
    "guestInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+233123456789"
    },
    "paymentStatus": "pending",
    "createdAt": "2025-11-04T10:30:00Z",
    "updatedAt": "2025-11-04T10:30:00Z",
    "items": [
      {
        "id": 1,
        "orderId": 123,
        "productId": 1,
        "quantity": 2,
        "price": "50.00",
        "size": "S"
      },
      {
        "id": 2,
        "orderId": 123,
        "productId": 1,
        "quantity": 1,
        "price": "50.00",
        "size": "M"
      }
    ]
  }
}
```

#### **Error Responses:**

**400 Bad Request - Missing Guest Info:**

```json
{
  "success": false,
  "message": "Guest information (name, email, phone) is required for guest checkout"
}
```

**400 Bad Request - Product Out of Stock:**

```json
{
  "success": false,
  "message": "Product \"T-Shirt\" is out of stock"
}
```

**400 Bad Request - Invalid Cart:**

```json
{
  "success": false,
  "message": "No valid items in cart"
}
```

---

## Order Response Example

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 123,
    "userId": null,  // ← null for guest orders
    "totalAmount": "450.00",
    "status": "pending",
    "shippingAddress": { ... },
    "guestInfo": {  // ← guest customer info
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+233123456789"
    },
    "paymentStatus": "pending",
    "items": [ ... ]
  }
}
```
