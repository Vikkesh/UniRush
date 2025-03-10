import React from 'react';
import classes from './thumbnails.module.css';
import { Link } from 'react-router-dom';
import StarRating from '../StarRating/StarRating';
import Price from '../Price/Price';

export default function Thumbnails({ items }) {
  if (!items) return null;
  
  return (
    <ul className={classes.list}>
      {items.map(item => (
        <li key={item.id}>
          <Link to={item.linkRoute || `/food/${item.id}`}>
            <img
              className={classes.image}
              src={`${item.imageUrl}`}
              alt={item.name}
            />
            
            <div className={classes.content}>
              <div className={classes.name}>{item.name}</div>
              <span
                className={`${classes.favorite} ${
                  item.favorite ? '' : classes.not
                }`}
              >
                ❤
              </span>
              <div className={classes.stars}>
                <StarRating stars={item.stars} />
              </div>
              <div className={classes.product_item_footer}>
                <div className={classes.origins}>
                  {item.origins && item.origins.map(origin => (
                    <span key={origin}>{origin}</span>
                  ))}
                </div>
                {item.cookTime && (
                  <div className={classes.cook_time}>
                    <span>🕒</span>
                    {item.cookTime}
                  </div>
                )}
              </div>
              {item.price > 0 && (
                <div className={classes.price}>
                  <Price price={item.price} />
                </div>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
