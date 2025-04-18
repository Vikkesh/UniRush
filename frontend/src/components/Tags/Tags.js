import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classes from './tags.module.css';

export default function Tags({ tags, forFoodPage }) {
  const navigate = useNavigate();
  const { id: foodId } = useParams(); // Get the current food ID if on food page
  
  const handleTagClick = (tag, event) => {
    event.preventDefault();
    
    // If on a food page and we have a food ID, we should look for the shop ID
    if (forFoodPage && foodId) {
      // We'll redirect to the shop page with the tag filter
      // First get the shop ID from the current URL or context
      const shopId = window.foodShopId; // This will be set in the FoodPage component
      
      if (shopId) {
        // Navigate to the shop page with the tag filter
        navigate(`/shop/${shopId}?tag=${tag}`);
        return;
      }
    }
    
    // Default behavior for non-food pages
    navigate(`/tag/${tag}`);
  };

  return (
    <div
      className={classes.container}
      style={{
        justifyContent: forFoodPage ? 'start' : 'center',
      }}
    >
      {tags.map(tag => (
        <Link 
          key={tag.name} 
          to={`/tag/${tag.name}`}
          onClick={(e) => handleTagClick(tag.name, e)}
        >
          {tag.name}
          {!forFoodPage && `(${tag.count})`}
        </Link>
      ))}
    </div>
  );
}