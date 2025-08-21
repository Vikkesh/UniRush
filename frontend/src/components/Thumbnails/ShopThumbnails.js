import React from 'react';
import { Link } from 'react-router-dom';
import classes from './shopThumbnails.module.css';

export default function ShopThumbnails({ shops }) {
  if (!shops || shops.length === 0) return null;
  
  return (
    <ul className={classes.list}>
      {shops.map(shop => (
        <li key={shop.id} className={classes.shopItem}>
          <Link to={shop.linkRoute || `/shop/${shop.id}`} className={classes.shopLink}>
            {/* Image container on the left */}
            <div className={classes.imageContainer}>
              {shop.imageUrl ? (
                <img
                  className={classes.shopImage}
                  src={`${shop.imageUrl}`}
                  alt={shop.name}
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
              <div className={classes.shopName}>{shop.name}</div>
              
              {/* Display address as plain text */}
              {shop.origins && shop.origins[0] && (
                <div className={classes.shopAddress}>
                  {shop.origins[0]}
                </div>
              )}
              
              {/* Display tags if available */}
              {shop.tags && shop.tags.length > 0 && (
                <div className={classes.shopTags}>
                  {shop.tags.map(tag => (
                    <span key={tag} className={classes.shopTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Arrow container */}
            <div className={classes.arrowContainer}>
              <span className={classes.arrowIcon}>➔</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
