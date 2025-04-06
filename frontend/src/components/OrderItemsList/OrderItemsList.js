import React from 'react';
import { Link } from 'react-router-dom';
import Price from '../Price/Price';
import classes from './orderItemsList.module.css';

export default function OrderItemsList({ order }) {
  return (
    <table className={classes.table}>
      <thead>
        <tr>
          <th>Food Name</th>
          <th>Unit Price</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan="4">
            <h3>Order Items:</h3>
          </td>
        </tr>
        {order.items.map(item => (
          <tr key={item.food?.id || item._id || `item-${Math.random()}`}>
            <td>
              {item.food?.name ? (
                <Link to={`/food/${item.food.id || item.food._id}`}>
                  {item.food.name}
                </Link>
              ) : item.name ? (
                <span>{item.name}</span>
              ) : (
                <span>Deleted Food Item</span>
              )}
            </td>
            <td>
              <Price price={item.food?.price || item.price} />
            </td>
            <td>{item.quantity}</td>
            <td>
              <Price price={item.price} />
            </td>
          </tr>
        ))}

        <tr>
          <td colSpan="2"></td>
          <td>
            <strong>Items Total:</strong>
          </td>
          <td>
            <Price price={order.totalPrice - (order.deliveryFee || 0)} />
          </td>
        </tr>
        <tr>
          <td colSpan="2"></td>
          <td>
            <strong>Delivery Fee:</strong>
          </td>
          <td>
            <Price price={order.deliveryFee || 0} />
          </td>
        </tr>
        <tr>
          <td colSpan="2"></td>
          <td>
            <strong>Order Total:</strong>
          </td>
          <td>
            <Price price={order.totalPrice} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}