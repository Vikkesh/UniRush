import React from 'react';
import axios from 'axios';
import { pay } from '../../services/orderService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../../hooks/useCart';
import './RazorpayButtons.css'; // Import the CSS file

export default function RazorpayButtons({ order, user }) { // receive user props
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const initiatePayment = async () => {
    try {
      const payload = {
        orderItems: order.items,
        totalPrice: order.totalPrice
      };
      const { data } = await axios.post('/api/razorpay/order', payload);
      console.log('Razorpay order:', data);
      const serverOrderId = data.id; // store server order id for verification
      
      // Build Razorpay options dynamically
      const options = {
        "key": "rzp_test_cIdPznx5Hgsrwi",
        "amount": data.amount,
        "currency": data.currency || "INR",
        "name": "UniRush",
        "description": "Order Payment",
        "image": "http://example.com/logo.png",
        "order_id": data.id,
        "handler": async function (response) {
          // Removed redundant alert, since verification follows
          // alert("Payment Successful:\nPayment ID: " + response.razorpay_payment_id +
          //       "\nOrder ID: " + response.razorpay_order_id +
          //       "\nSignature: " + response.razorpay_signature);
          
          // Verify the payment signature by calling the new endpoint
          const verifyResponse = await axios.post('/api/razorpay/verify', {
            order_id: serverOrderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          
          if (verifyResponse.data.valid) {
            const orderId = await pay(response.razorpay_payment_id);
            clearCart();
            toast.success('Payment Saved Successfully', 'Success');
            navigate('/track/' + orderId);
          } else {
            alert('Payment verification failed!');
          }
        },
        "prefill": {
          "name": user?.name || "Customer",         // use user's name if available
          "email": user?.email || "customer@example.com",  // use user's email if available
          "contact": user?.contact || "9000090000"         // use user's contact if available
        },
        "notes": {
          "name": user?.name || "Customer",
          "address": order.address || "No address provided", // use user's address
          "contact": user?.contact || "No contact provided"  // Added user contact to notes
        },
        "theme": {
          "color": "#3399cc"
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        alert("Payment Failed:\nError Code: " + response.error.code +
              "\nDescription: " + response.error.description +
              "\nSource: " + response.error.source +
              "\nStep: " + response.error.step +
              "\nReason: " + response.error.reason);
      });
      rzp1.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
    }
  };

  return (
    <div className="razorpay-btn-container">
      <button 
        className="razorpay-btn" 
        onClick={initiatePayment}
      >
        <span className="razorpay-btn-text">Pay Now</span>
        <span className="razorpay-btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
          </svg>
        </span>
      </button>
    </div>
  );
}
