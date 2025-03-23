import React, { useEffect, useState } from 'react'
import classes from './foodPage.module.css'
import { useNavigate, useParams } from 'react-router-dom';
import { getById } from '../../services/foodService';
import Price from '../../components/Price/Price';
import Tags from '../../components/Tags/Tags';
import StarRating from '../../components/StarRating/StarRating';
import { useCart } from '../../hooks/useCart';
import NotFound from '../../components/NotFound/NotFound';
import Button from '../../components/Button/Button';
import { toast } from 'react-toastify';

export default function FoodPage() {
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const handleAddToCart = () => {
    if (food && food.shop) {
      try {
        // Add to the shop-specific cart with shop details
        addToCart(food, food.shop._id, food.shop.name);
        toast.success('Item added to cart!');
        
        // Use a setTimeout to prevent any race conditions with state updates
        setTimeout(() => {
          navigate('/cart');
        }, 100);
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error('Could not add item to cart');
      }
    } else {
      // Handle case where food or shop information is missing
      console.error('Cannot add to cart: Missing food or shop information');
      toast.error('Cannot add to cart: Missing food or shop information');
    }
  };

  useEffect(() => {
    setLoading(true);
    getById(id)
      .then(data => {
        setFood(data);
      })
      .catch(error => {
        console.error('Error fetching food item:', error);
        setFood(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className={classes.loading}>Loading...</div>;
  }

  if (!food) {
    return <NotFound message="Food Not Found!" linkRoute="/" linkText="Go To Home Page" />;
  }

  return (
    <div className={classes.container}>
      <img
        className={classes.image}
        src={`${food.imageUrl}`}
        alt={food.name}
      />
      <div className={classes.details}>
        <div className={classes.header}>
          <span className={classes.name}>{food.name}</span>
          <span
            className={`${classes.favorite} ${food.favorite ? '' : classes.not}`}
          >
            ❤
          </span>
        </div>
        <div className={classes.rating}>
          <StarRating stars={food.stars} size={25} />
        </div>

        {/* Shop information */}
        {food.shop && (
          <div className={classes.shop_info}>
            <span className={classes.shop_label}>Restaurant:</span>
            <span className={classes.shop_name}>{food.shop.name}</span>
          </div>
        )}

        <div className={classes.tags}>
          {food.tags && (
            <Tags
              tags={food.tags.map(tag => ({ name: tag }))}
              forFoodPage={true}
            />
          )}
        </div>

        <div className={classes.price}>
          <Price price={food.price} />
        </div>

        <Button 
          text="Add to Cart"
          onClick={handleAddToCart}
          width="100%"
        />
      </div>
    </div>
  );
}
