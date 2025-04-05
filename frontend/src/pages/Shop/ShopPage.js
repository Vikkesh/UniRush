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
  const [isOpen, setIsOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to check if shop is currently open
  const checkIfOpen = (openingTime, closingTime) => {
    if (!openingTime || !closingTime) return true; // Default to open if times not set
    
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    // IST offset is 5 hours and 30 minutes ahead of UTC
    const istTime = new Date(now.getTime() + (330 * 60000));
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Convert times to minutes for comparison
    const currentMinutes = convertTimeToMinutes(currentTimeString);
    const openingMinutes = convertTimeToMinutes(openingTime);
    const closingMinutes = convertTimeToMinutes(closingTime);
    
    // Compare times
    if (openingMinutes < closingMinutes) {
      // Normal case (e.g., 9:00 - 17:00)
      return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
    } else {
      // Overnight case (e.g., 22:00 - 6:00)
      return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
    }
  };
  
  // Helper function to convert time (HH:MM) to minutes
  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

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

        // Check if shop is currently open
        const isOpen = checkIfOpen(shopData.openingTime, shopData.closingTime);
        setIsOpen(isOpen);
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
          
          <div className={classes.hours_status}>
            <div className={classes.hours}>
              <span>Hours: </span>
              <span>{shop.openingTime || '09:00'} - {shop.closingTime || '22:00'}</span>
            </div>
            <div className={`${classes.status} ${isOpen ? classes.open : classes.closed}`}>
              {isOpen ? 'Open Now' : 'Closed Now'}
            </div>
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