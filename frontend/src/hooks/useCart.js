import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

const CartContext = createContext(null);
// Using a unique key format for user carts
const CART_KEY = 'user-cart-';
const ACTIVE_SHOP_KEY = 'active-shop-'; // New key for storing active shop ID
const EMPTY_CART = {
  shopId: '',
  shopName: '',
  items: [],
  totalPrice: 0,
  totalCount: 0,
};

export default function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || 'guest';
  
  // Initialize with data from localStorage based on userId
  const [shopCarts, setShopCarts] = useState(() => {
    // Get user-specific cart data during initialization
    const userCartKey = `${CART_KEY}${userId}`;
    const cartsJson = localStorage.getItem(userCartKey);
    return cartsJson ? JSON.parse(cartsJson) : {};
  });
  
  // Initialize active cart shop ID from localStorage
  const [activeCartShopId, setActiveCartShopId] = useState(() => {
    const activeShopKey = `${ACTIVE_SHOP_KEY}${userId}`;
    return localStorage.getItem(activeShopKey) || '';
  });
  
  // This effect runs whenever the user changes (login/logout)
  useEffect(() => {
    // Load user-specific cart data when user changes
    const userCartKey = `${CART_KEY}${userId}`;
    const cartsJson = localStorage.getItem(userCartKey);
    const userCarts = cartsJson ? JSON.parse(cartsJson) : {};
    
    // Load active shop ID when user changes
    const activeShopKey = `${ACTIVE_SHOP_KEY}${userId}`;
    const savedActiveShopId = localStorage.getItem(activeShopKey) || '';
    
    // Reset cart state with user-specific data
    setShopCarts(userCarts);
    setActiveCartShopId(savedActiveShopId);
  }, [userId]);
  
  // Save carts whenever they change
  useEffect(() => {
    const userCartKey = `${CART_KEY}${userId}`;
    localStorage.setItem(userCartKey, JSON.stringify(shopCarts));
  }, [shopCarts, userId]);

  // Save active cart shop ID whenever it changes
  useEffect(() => {
    const activeShopKey = `${ACTIVE_SHOP_KEY}${userId}`;
    if (activeCartShopId) {
      localStorage.setItem(activeShopKey, activeCartShopId);
    }
  }, [activeCartShopId, userId]);

  const sum = items => {
    return items.reduce((prevValue, curValue) => prevValue + curValue, 0);
  };

  // Get the active cart or empty cart if no active cart exists
  const getActiveCart = useCallback(() => {
    if (!activeCartShopId || !shopCarts[activeCartShopId]) {
      return EMPTY_CART;
    }
    const cart = shopCarts[activeCartShopId];
    return {
      ...cart,
      shopId: activeCartShopId,
      shopName: cart.shopName
    };
  }, [activeCartShopId, shopCarts]);

  // Calculate cart totals
  const updateCartTotals = useCallback((cartToUpdate) => {
    if (!cartToUpdate) return cartToUpdate;

    const items = cartToUpdate.items || [];
    const totalPrice = sum(items.map(item => item.price));
    const totalCount = sum(items.map(item => item.quantity));

    return {
      ...cartToUpdate,
      totalPrice,
      totalCount,
    };
  }, []);

  // Remove item from cart
  const removeFromCart = foodId => {
    if (!activeCartShopId) return;

    setShopCarts(prevCarts => {
      const cart = prevCarts[activeCartShopId];
      if (!cart) return prevCarts;

      const filteredCartItems = cart.items.filter(item => item.food.id !== foodId);
      const updatedCart = updateCartTotals({
        ...cart,
        items: filteredCartItems,
      });

      return {
        ...prevCarts,
        [activeCartShopId]: updatedCart
      };
    });
  };

  // Change quantity of an item in cart
  const changeQuantity = (cartItem, newQuantity) => {
    if (!activeCartShopId) return;
    
    const { food } = cartItem;
    
    setShopCarts(prevCarts => {
      const cart = prevCarts[activeCartShopId];
      if (!cart) return prevCarts;

      const updatedItems = cart.items.map(item => 
        item.food.id === food.id 
          ? { ...item, quantity: newQuantity, price: food.price * newQuantity }
          : item
      );

      const updatedCart = updateCartTotals({
        ...cart,
        items: updatedItems,
      });

      return {
        ...prevCarts,
        [activeCartShopId]: updatedCart
      };
    });
  };

  // Add item to cart
  const addToCart = (food, shopId, shopName) => {
    setActiveCartShopId(shopId);
    
    setShopCarts(prevCarts => {
      // Get existing cart or create new one
      const cart = prevCarts[shopId] || {
        shopId,
        shopName,
        items: [],
        totalPrice: 0,
        totalCount: 0
      };
      
      // Check if food item exists
      const existingItem = cart.items.find(item => item.food.id === food.id);
      
      let updatedItems;
      if (existingItem) {
        updatedItems = cart.items.map(item => 
          item.food.id === food.id 
            ? { ...item, quantity: item.quantity + 1, price: food.price * (item.quantity + 1) }
            : item
        );
      } else {
        updatedItems = [...cart.items, { food, quantity: 1, price: food.price }];
      }

      const updatedCart = updateCartTotals({
        ...cart,
        items: updatedItems,
      });

      return {
        ...prevCarts,
        [shopId]: updatedCart
      };
    });
  };

  // Clear a specific cart
  const clearCart = (shopId = activeCartShopId) => {
    if (!shopId) return;
    
    setShopCarts(prevCarts => {
      const newCarts = { ...prevCarts };
      delete newCarts[shopId];
      return newCarts;
    });
    
    if (shopId === activeCartShopId) {
      setActiveCartShopId('');
      // Also clear from localStorage
      const activeShopKey = `${ACTIVE_SHOP_KEY}${userId}`;
      localStorage.removeItem(activeShopKey);
    }
  };

  // Clear all carts for the current user
  const clearAllCarts = () => {
    const userCartKey = `${CART_KEY}${userId}`;
    localStorage.removeItem(userCartKey);
    
    // Also clear active shop ID
    const activeShopKey = `${ACTIVE_SHOP_KEY}${userId}`;
    localStorage.removeItem(activeShopKey);
    
    setShopCarts({});
    setActiveCartShopId('');
  };

  // Get all carts for the current user
  const getAllCarts = useCallback(() => {
    return Object.entries(shopCarts).map(([shopId, cart]) => ({
      ...cart,
      shopId,
      shopName: cart.shopName
    }));
  }, [shopCarts]);

  // Switch to a different cart
  const switchCart = useCallback((shopId) => {
    if (shopCarts[shopId]) {
      setActiveCartShopId(shopId);
      return true;
    }
    return false;
  }, [shopCarts]);

  return (
    <CartContext.Provider
      value={{
        cart: getActiveCart(),
        activeCartShopId,
        switchCart,
        getAllCarts,
        removeFromCart,
        changeQuantity,
        addToCart,
        clearCart,
        clearAllCarts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);