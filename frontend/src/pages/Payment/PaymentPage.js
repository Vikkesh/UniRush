import React, { useState, useEffect } from 'react';
import classes from './paymentPage.module.css';
import { getNewOrderForCurrentUser } from '../../services/orderService';
import OrderItemsList from '../../components/OrderItemsList/OrderItemsList';
import Title from '../../components/Title/Title';
import Map from '../../components/Map/Map';
import RazorpayButtons from '../../components/RazorpayButtons/RazorpayButtons';
import { useAuth } from '../../hooks/useAuth'; // new import for user details

export default function PaymentPage() {
    const [order, setOrder] = useState();
    const { user } = useAuth(); // assume this hook provides user details
    useEffect(() => {
        getNewOrderForCurrentUser().then(data => setOrder(data));
    }, []);

    if (!order) return null;

    return (
        <div className={classes.container}>
            <div className={classes.content}>
                <Title title="Order Form" fontSize="1.6rem" />
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
                    <RazorpayButtons order={order} user={user} /> {/* pass user details */}
                </div>
            </div>
        </div>
    );
}
