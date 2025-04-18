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
            {/* Shop item with image container (price = 0 indicates it's a shop) */}
            {item.price === 0 ? (
              <div className={classes.shopItem}>
                {/* Image container on the left */}
                <div className={classes.imageContainer}>
                  {item.imageUrl ? (
                    <img
                      className={classes.shopImage}
                      src={`${item.imageUrl}`}
                      alt={item.name}
                    />
                  ) : (
                    <div className={classes.noImageContainer}>
                      <span className={classes.photoIcon}>📷</span>
                      <span className={classes.noImageText}>No photo available</span>
                    </div>
                  )}
                </div>
                
                {/* Content on the right */}
                <div className={classes.shopContent}>
                  <div className={classes.shopName}>{item.name}</div>
                  
                  {/* Display address as plain text */}
                  {item.origins && item.origins[0] && (
                    <div className={classes.shopAddress}>
                      {item.origins[0]}
                    </div>
                  )}
                  
                    </div>
                
                {/* Arrow container */}
                <div className={classes.arrowContainer}>
                  <span className={classes.arrowIcon}>➔</span>
                </div>
              </div>
            ) : (
              /* Regular food items (unchanged) */
              <>
                <img
                  className={classes.image}
                  src={`${item.imageUrl}`}
                  alt={item.name}
                />
                
                <div className={classes.content}>
                  <div className={classes.header}>
                    <div className={classes.name}>{item.name}</div>
                  </div>
                  
                  {/* Display tags for food items */}
                  {item.tags && item.tags.length > 0 && (
                    <div className={classes.tags}>
                      {item.tags.map(tag => (
                        <span key={tag} className={classes.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className={classes.price}>
                    <Price price={item.price} />
                  </div>
                </div>
              </>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
