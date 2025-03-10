import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as shopService from '../../services/shopService';
import NotFound from '../../components/NotFound/NotFound';
import Thumbnails from '../../components/Thumbnails/Thumbnails';
import classes from './shopPage.module.css';
import StarRating from '../../components/StarRating/StarRating';

export default function ShopPage() {
  const [shop, setShop] = useState(null);
  const [foods, setFoods] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    const loadShop = async () => {
      try {
        const shopData = await shopService.getById(id);
        setShop(shopData);
        
        const shopFoods = await shopService.getFoodsByShop(id);
        setFoods(shopFoods);
      } catch (error) {
        console.error('Failed to load shop:', error);
        setShop(null);
      }
    };
    
    loadShop();
  }, [id]);

  if (!shop) return <NotFound message="Shop Not Found!" linkRoute="/" linkText="Go To Home Page" />;

  return (
    <div className={classes.container}>
      <div className={classes.shop_header}>
        <img 
          src={shop.imageUrl} 
          alt={shop.name} 
          className={classes.shop_image} 
        />
        <div className={classes.shop_details}>
          <h1 className={classes.shop_name}>{shop.name}</h1>
          <div className={classes.rating}>
            <StarRating stars={shop.stars} size={30} />
          </div>
          <p className={classes.description}>{shop.description}</p>
          <p className={classes.address}>{shop.address}</p>
          <div className={classes.tags}>
            {shop.tags && shop.tags.map(tag => (
              <span key={tag} className={classes.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className={classes.foods_container}>
        <h2>Menu</h2>
        {foods.length === 0 ? (
          <p>No food items available in this shop.</p>
        ) : (
          <Thumbnails items={foods} />
        )}
      </div>
    </div>
  );
}