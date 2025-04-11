import { Router } from "express";
import { sample_foods, sample_tags } from "../data.js";
import { FoodModel } from '../models/food.model.js';
import handler from 'express-async-handler';
import { verifyToken as auth } from '../middleware/auth.mid.js';
import mongoose from 'mongoose';  // Import mongoose for ObjectId conversion
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  }
});

const router = Router();

router.get(
  '/',
  handler(async (req, res) => {
    // Only return enabled food items to regular users
    const foods = await FoodModel.find({ enabled: true }).populate('shop');
    res.send(foods);
  })
);

// Admin route to get foods based on permissions
router.get(
  '/admin',
  auth,
  handler(async (req, res) => {
    // If user is admin or owner, return all foods
    if (req.user.isAdmin || req.user.isOwner) {
      const foods = await FoodModel.find({}).populate('shop');
      return res.send(foods);
    }
    
    // If user is shop admin, return only foods from their managed shops
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
      
      const foods = await FoodModel.find({ shop: { $in: shopIds } }).populate('shop');
      return res.send(foods);
    }
    
    // If not admin or shop admin, return forbidden
    return res.status(403).send('Access Denied');
  })
);

router.get(
  '/tags',
  handler(async (req, res) => {
    const tags = await FoodModel.aggregate([
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
      count: await FoodModel.countDocuments(),
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

    const foods = await FoodModel.find({ name: { $regex: searchRegex } }).populate('shop');
    res.send(foods);
  })
);

router.get(
  '/tag/:tag',
  handler(async (req, res) => {
    const { tag } = req.params;
    const foods = await FoodModel.find({ tags: tag }).populate('shop');
    res.send(foods);
  })
);

router.get(
  '/:foodId',
  handler(async (req, res) => {
    const { foodId } = req.params;
    const food = await FoodModel.findById(foodId).populate('shop');
    res.send(food);
  })
);

// Admin routes for food items
router.post(
  '/',
  auth,
  handler(async (req, res) => {
    const { name, price, tags, shop, imageUrl, description } = req.body;
    
    // Check if user has permission to create food items
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can create food for any shop
    } else if (req.user.isShopAdmin) {
      // Ensure managedShops exists and is an array
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        res.status(403).send('You do not have permission to add food items');
        return;
      }
      
      // Check if shop admin has permission for this shop
      if (!req.user.managedShops.some(managedShop => managedShop.toString() === shop)) {
        res.status(403).send('You do not have permission to add food items to this shop');
        return;
      }
    } else {
      res.status(403).send('Only Admin, Owner, or Shop Admin Can Create Food Items');
      return;
    }
    
    const food = await FoodModel.create({
      name,
      price,
      tags: tags || [],
      shop,
      imageUrl,
      description
    });
    res.send(await food.populate('shop'));
  })
);

router.put(
  '/:foodId',
  auth,
  handler(async (req, res) => {
    const { name, price, tags, shop, imageUrl, description } = req.body;
    const { foodId } = req.params;
    
    // First find the existing food to check permissions
    const existingFood = await FoodModel.findById(foodId);
    if (!existingFood) {
      res.status(404).send('Food not found!');
      return;
    }

    // Check if user has permission to update this food item
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can update any food
    } else if (req.user.isShopAdmin) {
      // Ensure managedShops exists and is an array
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        res.status(403).send('You do not have permission to update food items');
        return;
      }
      
      // Check if shop admin has permission for this shop
      const existingShopId = existingFood.shop.toString();
      if (!req.user.managedShops.some(managedShop => managedShop.toString() === existingShopId)) {
        res.status(403).send('You do not have permission to update food items for this shop');
        return;
      }
      
      // Ensure shop admin can't move food to a shop they don't manage
      if (shop && shop !== existingShopId && !req.user.managedShops.some(managedShop => managedShop.toString() === shop)) {
        res.status(403).send('You do not have permission to move food items to that shop');
        return;
      }
    } else {
      res.status(403).send('Only Admin, Owner, or Shop Admin Can Update Food Items');
      return;
    }
    
    const updatedFood = await FoodModel.findByIdAndUpdate(
      foodId,
      {
        name,
        price,
        tags: Array.isArray(tags) ? tags : [],
        shop,
        imageUrl,
        description
      },
      { new: true }
    ).populate('shop');
    
    res.send(updatedFood);
  })
);

router.delete(
  '/:foodId',
  auth,
  handler(async (req, res) => {
    const { foodId } = req.params;
    
    // First find the existing food to check permissions
    const existingFood = await FoodModel.findById(foodId);
    if (!existingFood) {
      res.status(404).send('Food not found!');
      return;
    }

    // Check if user has permission to delete this food item
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can delete any food
    } else if (req.user.isShopAdmin) {
      // Ensure managedShops exists and is an array
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        res.status(403).send('You do not have permission to delete food items');
        return;
      }
      
      // Check if shop admin has permission for this shop
      const existingShopId = existingFood.shop.toString();
      if (!req.user.managedShops.some(managedShop => managedShop.toString() === existingShopId)) {
        res.status(403).send('You do not have permission to delete food items for this shop');
        return;
      }
    } else {
      res.status(403).send('Only Admin, Owner, or Shop Admin Can Delete Food Items');
      return;
    }
    
    await FoodModel.findByIdAndDelete(foodId);
    res.send({ success: true });
  })
);

// Add a new endpoint to toggle food enabled status
router.patch(
  '/:foodId/toggle-enabled',
  auth,
  handler(async (req, res) => {
    const { foodId } = req.params;
    const { enabled } = req.body;
    
    // First find the existing food to check permissions
    const existingFood = await FoodModel.findById(foodId);
    if (!existingFood) {
      res.status(404).send('Food not found!');
      return;
    }

    // Check if user has permission to update this food item
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can update any food
    } else if (req.user.isShopAdmin) {
      // Ensure managedShops exists and is an array
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        res.status(403).send('You do not have permission to update food items');
        return;
      }
      
      // Check if shop admin has permission for this shop
      const existingShopId = existingFood.shop.toString();
      if (!req.user.managedShops.some(managedShop => managedShop.toString() === existingShopId)) {
        res.status(403).send('You do not have permission to update food items for this shop');
        return;
      }
    } else {
      res.status(403).send('Only Admin, Owner, or Shop Admin Can Update Food Items');
      return;
    }
    
    const updatedFood = await FoodModel.findByIdAndUpdate(
      foodId,
      { enabled: enabled },
      { new: true }
    ).populate('shop');
    
    res.send(updatedFood);
  })
);

// Add an endpoint to toggle all foods for a shop
router.patch(
  '/shop/:shopId/toggle-all',
  auth,
  handler(async (req, res) => {
    const { shopId } = req.params;
    const { enabled } = req.body;
    
    // Check if user has permission to update foods for this shop
    if (req.user.isAdmin || req.user.isOwner) {
      // Admin or owner can update any food
    } else if (req.user.isShopAdmin) {
      // Ensure managedShops exists and is an array
      if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
        res.status(403).send('You do not have permission to update food items');
        return;
      }
      
      // Check if shop admin has permission for this shop
      if (!req.user.managedShops.some(managedShop => managedShop.toString() === shopId)) {
        res.status(403).send('You do not have permission to update food items for this shop');
        return;
      }
    } else {
      res.status(403).send('Only Admin, Owner, or Shop Admin Can Update Food Items');
      return;
    }
    
    // Update all foods for the specified shop
    await FoodModel.updateMany(
      { shop: shopId },
      { enabled: enabled }
    );
    
    // Return the updated foods
    const updatedFoods = await FoodModel.find({ shop: shopId }).populate('shop');
    res.send(updatedFoods);
  })
);

// Add an endpoint to bulk import foods from a spreadsheet
router.post(
  '/bulk-import',
  auth,
  upload.single('spreadsheet'),
  handler(async (req, res) => {
    try {
      const { shop: shopId } = req.body;
      
      if (!shopId) {
        return res.status(400).send('Shop ID is required');
      }
      
      // Check if user has permission to add foods to this shop
      if (req.user.isAdmin || req.user.isOwner) {
        // Admin or owner can add foods to any shop
      } else if (req.user.isShopAdmin) {
        // Ensure managedShops exists and is an array
        if (!req.user.managedShops || !Array.isArray(req.user.managedShops)) {
          return res.status(403).send('You do not have permission to add food items');
        }
        
        // Check if shop admin has permission for this shop
        if (!req.user.managedShops.some(managedShop => managedShop.toString() === shopId)) {
          return res.status(403).send('You do not have permission to add food items to this shop');
        }
      } else {
        return res.status(403).send('Only Admin, Owner, or Shop Admin can bulk import food items');
      }

      if (!req.file) {
        return res.status(400).send('No file uploaded');
      }

      // Read the spreadsheet
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      if (!data || data.length === 0) {
        return res.status(400).send('Spreadsheet is empty or has invalid format');
      }
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      // Process each row in the spreadsheet
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Check for required columns: name and price
        const foodName = row['Food Name'] || row['Name'] || row['name'] || row['food name'] || row[0];
        let foodPrice = row['Price'] || row['price'] || row[1];
        
        // Validate the row data
        if (!foodName) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing food name`);
          continue;
        }

        // Convert price to number if it's a string
        if (typeof foodPrice === 'string') {
          foodPrice = parseFloat(foodPrice.replace(/[^0-9.]/g, ''));
        }

        if (isNaN(foodPrice) || foodPrice <= 0) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid price for '${foodName}'`);
          continue;
        }

        try {
          // Create the food item
          await FoodModel.create({
            name: foodName,
            price: foodPrice,
            tags: [],  // Default empty tags
            shop: shopId,
            description: row['Description'] || row['description'] || '',
            enabled: true
          });
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Failed to add '${foodName}' - ${error.message}`);
        }
      }
      
      res.status(200).send({
        message: `Successfully imported ${results.success} food items. ${results.failed} items failed.`,
        results
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).send(`Bulk import failed: ${error.message}`);
    }
  })
);

export default router;