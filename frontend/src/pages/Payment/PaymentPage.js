import React, { useEffect, useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import classes from './paymentPage.module.css';
import Title from '../../components/Title/Title';
import OrderItemsList from '../../components/OrderItemsList/OrderItemsList';
import Map from '../../components/Map/Map';
import RazorpayButtons from '../../components/RazorpayButtons/RazorpayButtons';
import NotFound from '../../components/NotFound/NotFound';

export default function PaymentPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        const checkoutData = sessionStorage.getItem('checkoutData');
        if (!checkoutData) {
            navigate('/checkout');
            return;
        }
        setOrder(JSON.parse(checkoutData));
    }, [navigate]);

    if (!order) return null;

    return (
        <div className={classes.container}>
            <div className={classes.content}>
                <Title title="Order Summary" fontSize="1.6rem" />
                <div className={classes.summary}>
                    <div>
                        <h3>Name:</h3>
                        <span>{order.name}</span>
                    </div>
                    <div>
                        <h3>Address:</h3>
                        <span>{order.address}</span>
                    </div>
                </div>
                <OrderItemsList order={order} />
            </div>
            <div className={classes.map}>
                <Title title="Your Location" fontSize="1.6rem" />
                <Map readonly={true} location={order.addressLatLng} />
            </div>
            <div className={classes.buttons_container}>
                <div className={classes.button}>
                    <RazorpayButtons order={order} user={user} />
                </div>
            </div>
        </div>
    );
}
