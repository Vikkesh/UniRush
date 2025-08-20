import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as shopService from '../../services/shopService';
import ShopThumbnails from '../../components/Thumbnails/ShopThumbnails';
import ExtendedHeader from '../../components/Header/ExtendedHeader';
import NotFound from '../../components/NotFound/NotFound';
import classes from './homePage.module.css';

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { searchTerm, tag } = useParams();

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

  useEffect(() => {
    const loadShops = async () => {
      try {
        setLoading(true);
        const shopsData = searchTerm
          ? await shopService.search(searchTerm)
          : tag
          ? await shopService.getAllByTag(tag)
          : await shopService.getAll();
        
        // Ensure we have an array
        if (Array.isArray(shopsData)) {
          // Filter out closed shops
          const openShops = shopsData.filter(shop => 
            checkIfOpen(shop.openingTime, shop.closingTime)
          );
          setShops(openShops);
        } else {
          console.error('API did not return an array:', shopsData);
          setShops([]);
          setError('Failed to load shops data properly');
        }
      } catch (error) {
        console.error('Error loading shops:', error);
        setShops([]);
        setError('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, [searchTerm, tag]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        // First get all shops to filter by open status
        const allShops = await shopService.getAll();
        
        // Filter to keep only open shops
        const openShops = Array.isArray(allShops) 
          ? allShops.filter(shop => checkIfOpen(shop.openingTime, shop.closingTime))
          : [];
        
        // Extract unique tags only from open shops
        const openShopsTags = new Set();
        openShops.forEach(shop => {
          if (shop.tags && Array.isArray(shop.tags)) {
            shop.tags.forEach(tag => openShopsTags.add(tag));
          }
        });
        
        // Convert to the format expected by the Tags component
        const formattedTags = Array.from(openShopsTags).map(tag => ({
          name: tag,
          count: openShops.filter(shop => 
            shop.tags && Array.isArray(shop.tags) && shop.tags.includes(tag)
          ).length
        }));
        
        // Add "All" tag if there are any open shops
        if (formattedTags.length > 0) {
          formattedTags.unshift({
            name: 'All',
            count: openShops.length
          });
        }
        
        setTags(formattedTags);
      } catch (error) {
        console.error('Error loading tags:', error);
        setTags([]);
      }
    };

    loadTags();
  }, []);

  // Create shop thumbnails only if shops is an array and not empty
  const shopsThumbnails = Array.isArray(shops) ? shops.map(shop => ({
    id: shop._id || 'shop-' + Math.random(), // Ensure we always have an ID
    name: shop.name || 'Unnamed Shop',
    price: 0, // Not relevant for shops but required by Thumbnails component
    imageUrl: shop.imageUrl || 'default-shop.jpg',
    favorite: false, // Not relevant for shops
    origins: shop.address ? [shop.address] : ['No address'], // Using address as origin
    tags: shop.tags || [],
    cookTime: '', // Not relevant for shops
    linkRoute: `/shop/${shop._id}`, // Link to the shop page
  })) : [];

  if (loading) {
    return (
      <>
        <ExtendedHeader tags={[]} />
        <div className={classes.container}>
          <p>Loading shops...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ExtendedHeader tags={tags} />
      <div className={classes.container}>
        {error && <p className={classes.error}>{error}</p>}
        {!loading && shops.length === 0 && <NotFound message="All shops are closed, please come back some other time" linkText="Reset" linkRoute="/" />}
        {shops.length > 0 && <h2 className={classes.title}>All Shops(Currently operations are closed)</h2>}
        {shops.length > 0 && <ShopThumbnails shops={shopsThumbnails} />}
      </div>
    </>
  );
}
