import React from 'react';
import { Link } from 'react-router-dom';
import classes from './foodThumbnails.module.css';
import Price from '../Price/Price';

export default function FoodThumbnails({ foods }) {
  if (!foods || foods.length === 0) return null;
  
  return (
    <ul className={classes.list}>
      {foods.map(food => (
        <li key={food.id || food._id} className={classes.foodItem}>
          <Link to={`/food/${food.id || food._id}`} className={classes.foodLink}>
            <div className={classes.content}>
              {/* Name and Price on same row */}
              <h3 className={classes.name}>{food.name}</h3>
              <div className={classes.price}>
                <Price price={food.price} />
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
