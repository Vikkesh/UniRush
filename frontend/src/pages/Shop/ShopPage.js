import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import * as shopService from '../../services/shopService';
import NotFound from '../../components/NotFound/NotFound';
import Thumbnails from '../../components/Thumbnails/Thumbnails';
import classes from './shopPage.module.css';

export default function ShopPage() {
  const [shop, setShop] = useState(null);
  const [foods, setFoods] = useState([]);
  const [allFoods, setAllFoods] = useState([]); // Store all foods to filter from
  const [foodTags, setFoodTags] = useState([]); // Store unique food tags
  const [selectedTag, setSelectedTag] = useState('All'); // Track selected tag
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract tag from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tagParam = params.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam);
    } else {
      setSelectedTag('All');
    }
  }, [location.search]);

  useEffect(() => {
    const loadShop = async () => {
      try {
        const shopData = await shopService.getById(id);
        setShop(shopData);
        
        const shopFoods = await shopService.getFoodsByShop(id);
        setAllFoods(shopFoods); // Store all unfiltered foods
        
        // Extract unique tags from all food items
        const uniqueTags = extractUniqueTags(shopFoods);
        setFoodTags(uniqueTags);
        
        // Apply filtering based on the selected tag
        filterFoodsByTag(shopFoods, selectedTag);
      } catch (error) {
        console.error('Failed to load shop:', error);
        setShop(null);
      }
    };
    
    loadShop();
  }, [id]);
  
  // Apply filtering whenever the selected tag changes
  useEffect(() => {
    if (allFoods.length > 0) {
      filterFoodsByTag(allFoods, selectedTag);
    }
  }, [selectedTag]);
  
  // Extract unique tags from food items
  const extractUniqueTags = (foodItems) => {
    const allTags = foodItems.flatMap(food => food.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    // Create tag objects with name and count
    const tagObjects = uniqueTags.map(tag => ({
      name: tag,
      count: foodItems.filter(food => food.tags && food.tags.includes(tag)).length
    }));
    
    // Add "All" tag with total count
    const allTag = {
      name: 'All',
      count: foodItems.length
    };
    
    // Sort by count descending
    return [allTag, ...tagObjects.sort((a, b) => b.count - a.count)];
  };
  
  // Filter foods by selected tag
  const filterFoodsByTag = (foodItems, tag) => {
    if (!tag || tag === 'All') {
      setFoods(foodItems);
    } else {
      const filteredFoods = foodItems.filter(
        food => food.tags && food.tags.includes(tag)
      );
      setFoods(filteredFoods);
    }
  };
  
  // Handle tag selection
  const handleTagClick = (tagName) => {
    navigate(`/shop/${id}?tag=${tagName}`);
  };

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
          <p className={classes.description}>{shop.description}</p>
          <p className={classes.address}>{shop.address}</p>
          <div className={classes.tags}>
            {shop.tags && shop.tags.map(tag => (
              <span key={tag} className={classes.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Food tags filter */}
      <div className={classes.food_tags_container}>
        <h3>Filter by Category:</h3>
        <div className={classes.food_tags}>
          {foodTags.map(tag => (
            <button 
              key={tag.name}
              className={`${classes.food_tag} ${selectedTag === tag.name ? classes.active : ''}`}
              onClick={() => handleTagClick(tag.name)}
            >
              {tag.name} ({tag.count})
            </button>
          ))}
        </div>
      </div>
      
      <div className={classes.foods_container}>
        <h2>Menu {selectedTag !== 'All' && `- ${selectedTag}`}</h2>
        {foods.length === 0 ? (
          <p>No food items available in this category.</p>
        ) : (
          <Thumbnails items={foods} />
        )}
      </div>
    </div>
  );
}