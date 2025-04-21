import React, { useState, useEffect } from 'react'
import classes from './cartPage.module.css'
import { useCart } from '../../hooks/useCart';
import Title from '../../components/Title/Title';
import { Link, useNavigate } from 'react-router-dom';
import Price from '../../components/Price/Price';
import NotFound from '../../components/NotFound/NotFound';
import * as shopService from '../../services/shopService';
import { toast } from 'react-toastify';


export default function CartPage() {
    const { getAllCarts, removeFromCart, changeQuantity, switchCart } = useCart();
    const carts = getAllCarts().filter(cart => cart.items.length > 0); // Only show carts with items
    const navigate = useNavigate();
    const [isValidating, setIsValidating] = useState(false);
    
    // Helper function to convert time (HH:MM) to minutes
    const convertTimeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    // Function to check if shop is currently open based on its opening/closing times
    const isShopOpen = (openingTime, closingTime) => {
        if (!openingTime || !closingTime) return true; // Default to open if times not set
        
        // Get current time
        const now = new Date();
        // IST offset is 5 hours and 30 minutes ahead of UTC
        const istTime = new Date(now.getTime() + (330 * 60000));
        const currentHour = istTime.getUTCHours();
        const currentMinute = istTime.getUTCMinutes();
        const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Convert times to minutes for comparison
        const currentMinutes = convertTimeToMinutes(currentTimeString);
        const openingMinutes = convertTimeToMinutes(openingTime);
        const closingMinutes = convertTimeToMinutes(closingTime);
        
        // Compare times
        if (openingMinutes < closingMinutes) {
            // Normal case (e.g., 9:00 - 17:00)
            return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
        } else {
            // Overnight case (e.g., 22:00 - 6:00)
            return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
        }
    };

    // Function to validate if shop is available (not disabled and within operating hours)
    const validateShopAvailability = async (shopId) => {
        try {
            // Get shop data from API
            const shopData = await shopService.getById(shopId);

            // Check 1: Is the shop explicitly disabled by an admin?
            if (shopData.enabled === false) {
                return {
                    isAvailable: false,
                    shopName: shopData.name,
                    reason: 'disabled'
                };
            }

            // Check 2: Is the shop open based on its operating hours?
            // We ignore manualOverride for checkout validation - must be within hours.
            const shopIsOpen = isShopOpen(shopData.openingTime, shopData.closingTime);

            if (!shopIsOpen) {
                 return {
                    isAvailable: false,
                    shopName: shopData.name,
                    reason: 'closed' // Reason is 'closed' due to time
                 };
            }

            // If we reach here, the shop is enabled AND within operating hours
            return {
                isAvailable: true,
                shopName: shopData.name,
                reason: '' // No reason needed when available
            };

        } catch (error) {
            // Find the cart to get the shop name
            const cartWithShop = carts.find(cart => cart.shopId === shopId);
            const shopName = cartWithShop ? cartWithShop.shopName : 'Unknown shop';
            
            return {
                isAvailable: false,
                shopName: shopName,
                reason: 'error'
            };
        }
    };
    
    // Validation to run when the component loads to check all shops
    useEffect(() => {
        const validateAllShops = async () => {
            if (carts.length === 0) return;
            
            let hasUnavailableShops = false;
            const unavailableShops = [];
            
            for (const cart of carts) {
                const shopStatus = await validateShopAvailability(cart.shopId);
                if (!shopStatus.isAvailable) {
                    hasUnavailableShops = true;
                    unavailableShops.push({
                        name: shopStatus.shopName,
                        reason: shopStatus.reason
                    });
                }
            }
            
            if (hasUnavailableShops) {
                const message = unavailableShops.map(shop => 
                    `${shop.name} is ${shop.reason === 'disabled' ? 'unavailable' : 'closed'}`
                ).join(', ');
                
                toast.error(`Some shops in your cart are unavailable: ${message}. Please remove these items before proceeding to checkout.`);
            }
        };
        
        validateAllShops();
    }, []);
    
    // If there are no carts with items, show empty cart message
    if (carts.length === 0) {
        return (
            <>
                <Title title="Cart Page" margin="1.5rem 0 0 2.5rem" />
                <NotFound message="Cart is Empty!" />
            </>
        );
    }

    // Checks if all items in a cart still exist and are available for purchase
    const validateItemAvailability = async (shopId, cartItems) => {
        try {
            // Fetch all available foods for the shop
            const shopFoods = await shopService.getFoodsByShop(shopId);
            
            // Check each cart item against available foods
            const unavailableItems = [];
            
            for (const cartItem of cartItems) {
                // Try to find the cart item in the shop's current food list
                const foodStillAvailable = shopFoods.some(food => 
                    food._id === cartItem.food.id && food.enabled !== false
                );
                
                if (!foodStillAvailable) {
                    unavailableItems.push({
                        name: cartItem.food.name,
                        id: cartItem.food.id
                    });
                }
            }
            
            return {
                allItemsAvailable: unavailableItems.length === 0,
                unavailableItems
            };
        } catch (error) {
            console.error('Error validating item availability:', error);
            return { 
                allItemsAvailable: false,
                error: 'Failed to verify item availability'
            };
        }
    };

    const handleCheckout = async (shopId) => {
        try {
            setIsValidating(true);

            // 1. Validate shop availability before proceeding
            const shopStatus = await validateShopAvailability(shopId);

            if (!shopStatus.isAvailable) {
                // Shop is not available
                const reasonText = shopStatus.reason === 'disabled' ? 'unavailable' : 'closed';
                const message = `Checkout failed: The shop ${shopStatus.shopName || 'ID: '+shopId} is currently ${reasonText}.`;
                toast.error(message);
                setIsValidating(false);
                return;
            }

            // 2. Validate that all items are still available
            const cart = carts.find(cart => cart.shopId === shopId);
            if (!cart) {
                toast.error('Cart not found');
                setIsValidating(false);
                return;
            }
            
            const itemAvailability = await validateItemAvailability(shopId, cart.items);

            if (!itemAvailability.allItemsAvailable) {
                let message;
                if (itemAvailability.error) {
                    message = itemAvailability.error;
                } else if (itemAvailability.unavailableItems.length > 0) {
                    const itemNames = itemAvailability.unavailableItems.map(item => item.name).join(', ');
                    message = `Checkout failed: The item(s) ${itemNames} are no longer available.`;
                }
                toast.error(message);
                setIsValidating(false);
                return;
            }

            // All validations passed, proceed with checkout
            const success = switchCart(shopId);
            if (success) {
                setIsValidating(false);
                navigate('/checkout');
            } else {
                toast.error("Could not switch to the selected cart.");
                setIsValidating(false);
            }
        } catch (error) {
            toast.error('Something went wrong during checkout. Please try again later.');
            setIsValidating(false);
        }
    };
    
    // Display all shop carts
    return (
        <>
            <Title title="Your Shopping Carts (Currently operations are closed)" margin="1.5rem 0 0 2.5rem" />
            
            <div className={classes.carts_container}>
                {carts.map((cart) => (
                    <div key={cart.shopId} className={classes.shop_cart_container}>
                        <div className={classes.shop_header}>
                            <h2>{cart.shopName}</h2>
                            <Link to={`/shop/${cart.shopId}`} className={classes.view_shop}>
                                View Shop
                            </Link>
                        </div>
                        
                        <div className={classes.container}>
                            <ul className={classes.list}>
                                {cart.items.map(item => (
                                    <li key={item.food.id}>
                                        <div className={classes.item_left_column}>
                                            <div className={classes.item_name}>
                                                <Link to={`/food/${item.food.id}`}>{item.food.name}</Link>
                                            </div>
                                            <div className={classes.quantity_selector}>
                                                <button 
                                                    className={classes.quantity_button}
                                                    onClick={() => {
                                                        switchCart(cart.shopId);
                                                        if (item.quantity > 1) {
                                                            changeQuantity(item, item.quantity - 1);
                                                        }
                                                    }}
                                                    aria-label="Decrease quantity"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    className={classes.quantity_input}
                                                    value={item.quantity}
                                                    min="1"
                                                    max="99"
                                                    onChange={e => {
                                                        switchCart(cart.shopId);
                                                        const newQuantity = parseInt(e.target.value);
                                                        if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity <= 99) {
                                                            changeQuantity(item, newQuantity);
                                                        }
                                                    }}
                                                    aria-label="Quantity"
                                                />
                                                <button 
                                                    className={classes.quantity_button}
                                                    onClick={() => {
                                                        switchCart(cart.shopId);
                                                        if (item.quantity < 99) {
                                                            changeQuantity(item, item.quantity + 1);
                                                        }
                                                    }}
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className={classes.item_right_column}>
                                            <div className={classes.price_container}>
                                                <Price price={item.price} />
                                            </div>
                                            <button
                                                className={classes.remove_button} 
                                                onClick={() => {
                                                    switchCart(cart.shopId);
                                                    removeFromCart(item.food.id);
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className={classes.checkout}>
                                <div>
                                    <div className={classes.foods_count}>{cart.totalCount}</div>
                                    <div className={classes.total_price}>
                                        <Price price={cart.totalPrice} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleCheckout(cart.shopId)}
                                    className={classes.checkout_button}
                                >
                                    Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
