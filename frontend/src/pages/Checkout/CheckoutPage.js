import React, { useState } from 'react';
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
