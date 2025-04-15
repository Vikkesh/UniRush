import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import classes from './checkoutPage.module.css';
import Title from '../../components/Title/Title';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import OrderItemsList from '../../components/OrderItemsList/OrderItemsList';
import Map from '../../components/Map/Map';
import NotFound from '../../components/NotFound/NotFound';
import * as shopService from '../../services/shopService';

const calculateDeliveryFee = (itemsTotal) => {
  if (itemsTotal <= 100) {
    return 30;
  }
  return 30 + (itemsTotal - 100) * 0.1;
};

export default function CheckoutPage() {
  const { cart, activeCartShopId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [order, setOrder] = useState(() => {
    const itemsTotal = cart.totalPrice;
    const deliveryFee = calculateDeliveryFee(itemsTotal);
    return {
      ...cart,
      deliveryFee,
      totalPrice: itemsTotal + deliveryFee
    };
  });

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  
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
  
  // Helper function to convert time (HH:MM) to minutes
  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Check shop availability when component loads
  useEffect(() => {
    if (!activeCartShopId) return;
    
    const validateShopAvailability = async () => {
      try {
        const shopData = await shopService.getById(activeCartShopId);
        
        // Check if shop is disabled
        if (shopData.enabled === false) {
          toast.error(`Cannot checkout. ${shopData.name} is currently unavailable.`);
          navigate('/cart');
          return;
        }
        
        // Check if shop is within operating hours
        const shopIsOpen = isShopOpen(shopData.openingTime, shopData.closingTime);
        
        // If manual override is active, shop is available regardless of hours
        if (shopData.manualOverride && shopData.enabled) {
          setIsValidating(false);
          return;
        }
        
        if (!shopIsOpen) {
          toast.error(`Cannot checkout. ${shopData.name} is currently closed.`);
          navigate('/cart');
          return;
        }
        
        setIsValidating(false);
      } catch (error) {
        console.error('Error validating shop availability:', error);
        toast.error('Unable to verify shop availability. Please try again.');
        navigate('/cart');
      }
    };
    
    validateShopAvailability();
  }, [activeCartShopId, navigate]);

  if (!activeCartShopId || !cart.items || cart.items.length === 0) {
    return (
      <NotFound 
        message="No items in cart to checkout" 
        linkText="Go to Cart" 
        linkRoute="/cart" 
      />
    );
  }
  
  const submit = async data => {
    try {
      if (!order.addressLatLng) {
        toast.warning('Please select your location on the map');
        return;
      }

      // Update cart data with customer info and proceed to payment
      const updatedOrder = { 
        ...order,
        name: data.name, 
        address: data.address,
        shopId: cart.shopId,
        shopName: cart.shopName,
        itemsTotal: cart.totalPrice,
      };

      // Store checkout data in sessionStorage for payment page
      sessionStorage.setItem('checkoutData', JSON.stringify(updatedOrder));
      navigate('/payment');
    } catch(error) {
      toast.error('Error processing checkout');
      console.error('Checkout error:', error);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(submit)} className={classes.container}>
        <div className={classes.content}>
          <Title title="Order Form" fontSize="1.6rem" />
          <div className={classes.shop_info}>
            <span>Restaurant: </span>
            <strong>{cart.shopName}</strong>
          </div>
          <div className={classes.inputs}>
            <Input
              defaultValue={user.name}
              label="Name"
              {...register('name')}
              error={errors.name}
            />
            <Input
              defaultValue={user.address}
              label="Address"
              {...register('address')}
              error={errors.address}
            />
          </div>
          <OrderItemsList order={order} />
        </div>
        <div>
          <Title title="Choose Your Location" fontSize="1.6rem" />
          <Map
            location={order.addressLatLng}
            onChange={latlng => {
              setOrder({ ...order, addressLatLng: latlng });
            }}
          />
        </div>
       
        <div className={classes.buttons_container}>
          <div className={classes.buttons}>
            <Button
              type="submit"
              text="Go To Payment"
              width="100%"
              height="3rem"
            />
          </div>
        </div>
      </form>
    </>
  );
}
