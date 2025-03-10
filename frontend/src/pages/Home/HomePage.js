import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as shopService from '../../services/shopService';
import Thumbnails from '../../components/Thumbnails/Thumbnails';
import Search from '../../components/Search/Search';
import Tags from '../../components/Tags/Tags';
import NotFound from '../../components/NotFound/NotFound';
import classes from './homePage.module.css';

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { searchTerm, tag } = useParams();

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
          setShops(shopsData);
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
        const tagsData = await shopService.getAllTags();
        if (Array.isArray(tagsData)) {
          setTags(tagsData);
        } else {
          setTags([]);
        }
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
    stars: shop.stars || 0,
    favorite: false, // Not relevant for shops
    origins: shop.address ? [shop.address] : ['No address'], // Using address as origin
    tags: shop.tags || [],
    cookTime: '', // Not relevant for shops
    linkRoute: `/shop/${shop._id}`, // Link to the shop page
  })) : [];

  if (loading) {
    return (
      <>
        <Search />
        <Tags tags={[]} />
        <div className={classes.container}>
          <p>Loading shops...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Search />
      <Tags tags={tags} />
      <div className={classes.container}>
        {error && <p className={classes.error}>{error}</p>}
        {!loading && shops.length === 0 && <NotFound message="No shops found" linkText="Reset" linkRoute="/" />}
        <h2 className={classes.title}>All Restaurants</h2>
        {shopsThumbnails.length > 0 && <Thumbnails items={shopsThumbnails} />}
      </div>
    </>
  );
}
