# Cart Backend Integration Guide

## Backend API Endpoints

### 1. GET /api/v1/cart

**Purpose:** Get user's saved cart from database  
**Use When:** User logs in on a new device  
**Requires Auth:** Yes

**Response:**

```json
{
  "success": true,
  "data": {
    "cartItems": {
      "1": { "S": 2, "M": 1 },
      "5": { "L": 3 }
    }
  }
}
```

---

### 2. POST /api/v1/cart/sync

**Purpose:** Merge localStorage cart with backend after login  
**Use When:** Immediately after user logs in  
**Requires Auth:** Yes

**Request Body:**

```json
{
  "cartItems": {
    "1": { "S": 2, "M": 1 },
    "5": { "L": 3 }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cart synced successfully",
  "data": {
    "cartItems": {
      "1": { "S": 2, "M": 1 },
      "5": { "L": 3 }
    }
  }
}
```

---

### 3. POST /api/v1/cart/save

**Purpose:** Save current cart to backend (optional backup)  
**Use When:** Periodic save or before checkout  
**Requires Auth:** Yes

**Request Body:**

```json
{
  "cartItems": {
    "1": { "S": 2 }
  }
}
```

---

### 4. DELETE /api/v1/cart

**Purpose:** Clear user's saved cart  
**Use When:** After successful order  
**Requires Auth:** Yes

---

## Frontend Integration Examples

### On User Login

```javascript
// In your login handler (e.g., useAuth.js)
const handleLogin = async (email, password) => {
  try {
    // 1. Login user
    const loginResponse = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (loginResponse.ok) {
      const { token, user } = await loginResponse.json();

      // Store token
      localStorage.setItem("token", token);

      // 2. Sync cart with backend
      const { cartItems } = useCartStore.getState();

      const syncResponse = await fetch("/api/v1/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItems }),
      });

      if (syncResponse.ok) {
        const { data } = await syncResponse.json();

        // 3. Update Zustand store with merged cart
        useCartStore.setState({ cartItems: data.cartItems });
      }
    }
  } catch (error) {
    console.error("Login error:", error);
  }
};
```

### On App Load (Check if User is Logged In)

```javascript
// In your App.jsx or _app.jsx
useEffect(() => {
  const initializeApp = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      // User is logged in - fetch saved cart from backend
      try {
        const response = await fetch("/api/v1/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const { data } = await response.json();

          // Merge backend cart with local cart
          const localCart = useCartStore.getState().cartItems;
          const mergedCart = mergeCartItems(localCart, data.cartItems);

          useCartStore.setState({ cartItems: mergedCart });
        }
      } catch (error) {
        console.error("Failed to load saved cart:", error);
      }
    }
  };

  initializeApp();
}, []);

// Helper function to merge carts
function mergeCartItems(localCart, backendCart) {
  const merged = { ...backendCart };

  for (const productId in localCart) {
    if (!merged[productId]) {
      merged[productId] = {};
    }

    for (const size in localCart[productId]) {
      const localQty = localCart[productId][size];
      const backendQty = merged[productId][size] || 0;
      merged[productId][size] = Math.max(localQty, backendQty);
    }
  }

  return merged;
}
```

### On Checkout Success

```javascript
// In your checkout completion handler
const handleCheckoutSuccess = async (orderId) => {
  try {
    // 1. Clear Zustand cart
    useCartStore.getState().clearCart();

    // 2. Clear backend cart
    const token = localStorage.getItem("token");
    if (token) {
      await fetch("/api/v1/cart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Navigate to success page
    navigate(`/order-confirmation/${orderId}`);
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
};
```

### Optional: Periodic Cart Save

```javascript
// In your Cart component or App.jsx
useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) return; // Only save for logged-in users

  // Save cart every 5 minutes
  const interval = setInterval(async () => {
    const { cartItems } = useCartStore.getState();

    try {
      await fetch("/api/v1/cart/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItems }),
      });
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
}, []);
```

## Summary

### Cart Flow:

1. **Guest User:** Cart lives in Zustand + localStorage only
2. **User Logs In:** Sync localStorage cart with backend via `/cart/sync`
3. **User on New Device:** Load cart from backend via `/cart` GET
4. **Checkout Complete:** Clear both local and backend cart
5. **Optional:** Periodic save to backend for backup

### Key Benefits:

- ✅ Fast cart operations (no API calls)
- ✅ Works offline for guests
- ✅ Cart persists across devices for logged-in users
- ✅ Minimal server load
