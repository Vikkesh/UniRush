import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trackOrderById } from '../../services/orderService';
import NotFound from '../../components/NotFound/NotFound';
import classes from './orderTrackPage.module.css';
import DateTime from '../../components/DateTime/DateTime';
import OrderItemsList from '../../components/OrderItemsList/OrderItemsList';
import Title from '../../components/Title/Title';
import Map from '../../components/Map/Map';

export default function OrderTrackPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState();

  useEffect(() => {
    orderId &&
      trackOrderById(orderId).then(order => {
        setOrder(order);
      });
  }, [orderId]);

  if (!orderId || !order)
    return <NotFound message="Order Not Found" linkText="Go To Home Page" />;

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h1>Order #{order.id}</h1>
        <div className={classes.header}>
          <div>
            <strong>Date</strong>
            <DateTime date={order.createdAt} />
          </div>
          <div>
            <strong>Name</strong>
            {order.name}
          </div>
          <div>
            <strong>Shop</strong>
            {order.shopName}
          </div>
          <div>
            <strong>Address</strong>
            {order.address}
          </div>
          <div>
            <strong>State</strong>
            {order.status}
          </div>
          <div>
            <strong>Payment ID</strong>
            {order.paymentId}
          </div>
        </div>

        <OrderItemsList order={order} />
      </div>

      <div>
        <Title title="Your Location" fontSize="1.6rem" />
        <Map location={order.addressLatLng} readonly={true} />
      </div>
    </div>
  );
}