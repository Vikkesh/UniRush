import React from 'react';
import { Link } from 'react-router-dom';
import classes from './thumbnails.module.css';
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
              <div className={classes.header}>
                <div className={classes.name}>{item.name}</div>
              </div>
              
              {/* Display address for shops (items with price = 0) */}
              {item.price === 0 && item.origins && item.origins[0] && (
                <div className={classes.address}>
                  {item.origins[0]}
                </div>
              )}
              
              {/* Display tags for food items */}
              {item.price > 0 && item.tags && item.tags.length > 0 && (
                <div className={classes.tags}>
                  {item.tags.map(tag => (
                    <span key={tag} className={classes.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
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
  );
}
