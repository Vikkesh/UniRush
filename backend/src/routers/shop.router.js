import { Router } from "express";
import { sample_shops } from "../data.js";
import { ShopModel } from '../models/shop.model.js';
import handler from 'express-async-handler';
import { FoodModel } from '../models/food.model.js';
import { verifyToken as auth } from '../middleware/auth.mid.js';
import mongoose from 'mongoose';  // Import mongoose for ObjectId conversion

const router = Router();

router.get(
  '/',
  handler(async (req, res) => {
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    // IST offset is 5 hours and 30 minutes ahead of UTC
    const istTime = new Date(now.getTime() + (330 * 60000));
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Find all shops that are enabled
    let shops = await ShopModel.find({ enabled: { $ne: false } });
    
    // Filter shops based on opening/closing time
    shops = shops.filter(shop => {
      // If shop doesn't have timing info, show it
      if (!shop.openingTime || !shop.closingTime) return true;
      
      // If shop has manual override and is enabled, show it regardless of schedule
      if (shop.manualOverride && shop.enabled !== false) return true;
      
      // Otherwise check regular opening hours
      return isShopOpen(currentTimeString, shop.openingTime, shop.closingTime);
    });
    
    res.send(shops);
  })
);

// Helper function to check if a shop is open at a given time
function isShopOpen(currentTime, openingTime, closingTime) {
  // Compare as strings first for exact match
  if (currentTime === openingTime) return true;
  
  // Convert times to minutes for easier comparison
  const currentMinutes = convertTimeToMinutes(currentTime);
  const openingMinutes = convertTimeToMinutes(openingTime);
  const closingMinutes = convertTimeToMinutes(closingTime);
  
  // Handle regular case (opening time < closing time)
  if (openingMinutes < closingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }
  // Handle overnight case (e.g., 22:00 - 06:00)
  else {
    return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
  }
}

// Helper function to convert time (HH:MM) to minutes
function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

router.get(
  '/admin',
  auth,
  handler(async (req, res) => {
    // If user is admin or owner, return all shops
    if (req.user.isAdmin || req.user.isOwner) {
      const shops = await ShopModel.find({});
      return res.send(shops);
    }
    
    // If user is shop admin, return only their managed shops
    if (req.user.isShopAdmin) {
      // Check if managedShops exists before trying to map it
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        // If managedShops doesn't exist or isn't an array, return empty array
        return res.send([]);
      }
      
      // Convert managedShops IDs to MongoDB ObjectId to ensure proper matching
      const shopIds = req.user.managedShops.map(id => 
        mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
      );
      
      const shops = await ShopModel.find({ _id: { $in: shopIds } });
      return res.send(shops);
    }

    // If user is delivery personnel, return all shops
    // They need to see all shops to handle deliveries
    if (req.user.isDelivery) {
      const shops = await ShopModel.find({});
      return res.send(shops);
    }
    
    // If no valid role, return forbidden
    res.status(403).send('Unauthorized to access shop information');
  })
);

router.get(
  '/tags',
  handler(async (req, res) => {
    // Only include enabled shops in tag counts
    const tags = await ShopModel.aggregate([
      {
        $match: { enabled: { $ne: false } }
      },
      {
        $unwind: '$tags',
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: '$count',
        },
      },
    ]).sort({ count: -1 });

    const all = {
      name: 'All',
      count: await ShopModel.countDocuments({ enabled: { $ne: false } }),
    };

    tags.unshift(all);

    res.send(tags);
  })
);

router.get(
  '/search/:searchTerm',
  handler(async (req, res) => {
    const { searchTerm } = req.params;
    const searchRegex = new RegExp(searchTerm, 'i');

    // Only search among enabled shops
    const shops = await ShopModel.find({ 
      name: { $regex: searchRegex },
      enabled: { $ne: false }
    });
    res.send(shops);
  })
);

router.get(
  '/tag/:tag',
  handler(async (req, res) => {
    const { tag } = req.params;
    // Only return enabled shops for the given tag
    const shops = await ShopModel.find({ 
      tags: tag,
      enabled: { $ne: false }
    });
    res.send(shops);
  })
);

router.get(
  '/:shopId',
  handler(async (req, res) => {
    const { shopId } = req.params;
    const shop = await ShopModel.findById(shopId);
    
    // If the shop doesn't exist or is disabled, return 404
    if (!shop || shop.enabled === false) {
      return res.status(404).send('Shop not found or unavailable');
    }
    
    res.send(shop);
  })
);

router.get(
  '/:shopId/foods',
  handler(async (req, res) => {
    const { shopId } = req.params;
    
    // First check if shop exists and is enabled
    const shop = await ShopModel.findById(shopId);
    if (!shop) {
      return res.status(404).send('Shop not found');
    }
    
    // If shop is disabled, return an empty list of foods
    if (shop.enabled === false) {
      return res.send([]);
    }
    
    const foods = await FoodModel.find({ shop: shopId });
    res.send(foods);
  })
);

// Admin routes for shops with shop admin support
router.post(
  '/',
  auth,
  handler(async (req, res) => {
    const { name, description, imageUrl, address, contact, tags, openingTime, closingTime } = req.body;

    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(403).send('Only Admin or Owner Can Create Shops');
      return;
    }

    const shop = await ShopModel.create({
      name,
      description,
      imageUrl,
      address,
      contact,
      tags,
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '22:00'
    });

    res.send(shop);
  })
);

router.put(
  '/:shopId',
  auth,
  handler(async (req, res) => {
    const { name, description, imageUrl, address, contact, tags, openingTime, closingTime } = req.body;
    const { shopId } = req.params;

    // Check if user has permission to update this shop
    if (!req.user.isAdmin && !req.user.isOwner) {
      if (req.user.isShopAdmin) {
        // Ensure managedShops exists and is an array
        if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
          res.status(403).send('You do not have permission to update shops');
          return;
        }
        
        // Check if this shop is in their managedShops
        if (!req.user.managedShops.some(id => id.toString() === shopId)) {
          res.status(403).send('You do not have permission to update this shop');
          return;
        }
      } else {
        res.status(403).send('Only Admin, Owner or Shop Admin Can Update Shops');
        return;
      }
    }

    const shop = await ShopModel.findByIdAndUpdate(
      shopId,
      {
        name,
        description,
        imageUrl,
        address,
        contact,
        tags,
        openingTime,
        closingTime
      },
      { new: true }
    );

    res.send(shop);
  })
);

router.delete(
  '/:shopId',
  auth,
  handler(async (req, res) => {
    const { shopId } = req.params;

    // Only global admin or owner can delete shops
    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(403).send('Only Admin or Owner Can Delete Shops');
      return;
    }

    // Delete all foods associated with this shop first
    await FoodModel.deleteMany({ shop: shopId });

    // Then delete the shop
    await ShopModel.findByIdAndDelete(shopId);
    res.send({ success: true });
  })
);

// Add a new endpoint to toggle shop enabled status
router.patch(
  '/:shopId/toggle-enabled',
  auth,
  handler(async (req, res) => {
    const { shopId } = req.params;
    const { enabled } = req.body;
    
    // First find the existing shop to check permissions
    const existingShop = await ShopModel.findById(shopId);
    if (!existingShop) {
      res.status(404).send('Shop not found!');
      return;
    }

    // Check if user has permission to update this shop
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can update any shop
    } else if (req.user.isShopAdmin) {
      // Ensure managedShops exists and is an array
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        res.status(403).send('You do not have permission to update shops');
        return;
      }
      
      // Check if this shop is in their managedShops
      if (!req.user.managedShops.some(id => id.toString() === shopId)) {
        res.status(403).send('You do not have permission to update this shop');
        return;
      }
    } else {
      res.status(403).send('Only Admin, Owner, or Shop Admin Can Update Shop Status');
      return;
    }

    // Determine if this is an override situation
    let manualOverride = false;
    const now = new Date();
    
    // Get current time in IST (UTC+5:30)
    const istTime = new Date(now.getTime() + (330 * 60000));
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Check if the current time is within opening hours
    const isRegularlyOpen = isShopOpen(currentTimeString, existingShop.openingTime, existingShop.closingTime);
    
    // If manual status differs from the natural status, it's an override
    if ((enabled && !isRegularlyOpen) || (!enabled && isRegularlyOpen)) {
      manualOverride = true;
    } else {
      manualOverride = false;
    }
    
    // Update the shop with new status
    const updatedShop = await ShopModel.findByIdAndUpdate(
      shopId, 
      { 
        enabled, 
        manualOverride,
        lastOverrideTime: manualOverride ? now : existingShop.lastOverrideTime 
      },
      { new: true }
    );
    
    res.send(updatedShop);
  })
);

// Add endpoint to toggle taxable status of a shop
router.patch(
  '/:shopId/toggle-taxable',
  auth,
  handler(async (req, res) => {
    const { shopId } = req.params;
    const { taxable } = req.body;
    
    // First find the existing shop to check permissions
    const existingShop = await ShopModel.findById(shopId);
    if (!existingShop) {
      res.status(404).send('Shop not found!');
      return;
    }

    // Check if user has permission to update this shop
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can update any shop
    } else {
      res.status(403).send('Only Admin or Owner Can Update Shop Taxable Status');
      return;
    }
    
    // Update the taxable status
    const updatedShop = await ShopModel.findByIdAndUpdate(
      shopId, 
      { taxable },
      { new: true }
    );
    
    res.send(updatedShop);
  })
);

// Add endpoint to toggle enabled status for all shops a user manages
router.patch(
  '/toggle-all-shops',
  auth,
  handler(async (req, res) => {
    const { enabled } = req.body;
    
    if (!req.user.isAdmin && !req.user.isOwner && !req.user.isShopAdmin) {
      res.status(403).send('You do not have permission to update shop status');
      return;
    }
    
    let filter = {};
    
    // If shop admin, restrict to only managed shops
    if (req.user.isShopAdmin && !req.user.isAdmin && !req.user.isOwner) {
      if (!req.user.managedShops || !req.user.managedShops.length === 0) {
        res.status(403).send('You do not manage any shops');
        return;
      }
      
      filter = { _id: { $in: req.user.managedShops } };
    }
    
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istTime = new Date(now.getTime() + (330 * 60000));
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Get all affected shops
    const shops = await ShopModel.find(filter);
    
    // Update each shop, handling manual override logic
    const updatePromises = shops.map(shop => {
      const isRegularlyOpen = isShopOpen(currentTimeString, shop.openingTime, shop.closingTime);
      const manualOverride = (enabled && !isRegularlyOpen) || (!enabled && isRegularlyOpen);
      
      return ShopModel.findByIdAndUpdate(
        shop._id,
        { 
          enabled, 
          manualOverride,
          lastOverrideTime: manualOverride ? now : shop.lastOverrideTime
        }
      );
    });
    
    await Promise.all(updatePromises);
    res.send({ success: true });
  })
);

export default router;