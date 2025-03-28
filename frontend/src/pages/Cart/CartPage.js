import React from 'react'
import classes from './cartPage.module.css'
import { useCart } from '../../hooks/useCart';
import Title from '../../components/Title/Title';
import { Link, useNavigate } from 'react-router-dom';
import Price from '../../components/Price/Price';
import NotFound from '../../components/NotFound/NotFound';


export default function CartPage() {
    const { getAllCarts, removeFromCart, changeQuantity, switchCart } = useCart();
    const carts = getAllCarts().filter(cart => cart.items.length > 0); // Only show carts with items
    const navigate = useNavigate();
    
    // If there are no carts with items, show empty cart message
    if (carts.length === 0) {
        return (
            <>
                <Title title="Cart Page" margin="1.5rem 0 0 2.5rem" />
                <NotFound message="Cart is Empty!" />
            </>
        );
    }

    const handleCheckout = async (shopId) => {
        // First switch the cart
        const success = switchCart(shopId);
        if (success) {
            // Navigate after ensuring cart is switched
            navigate('/checkout');
        }
    };
    
    // Display all shop carts
    return (
        <>
            <Title title="Your Shopping Carts" margin="1.5rem 0 0 2.5rem" />
            
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
                                        <div>
                                            <img 
                                                src={`${item.food.imageUrl}`} 
                                                alt={item.food.name} 
                                            />
                                        </div>
                                        <div>
                                            <Link to={`/food/${item.food.id}`}>{item.food.name}</Link>
                                        </div>
                                        <div>
                                            <select
                                                value={item.quantity} 
                                                onChange={e => {
                                                    switchCart(cart.shopId);
                                                    changeQuantity(item, Number(e.target.value));
                                                }}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                    <option key={num} value={num}>
                                                        {num}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Price price={item.price} />
                                        </div>
                                        <div>
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
