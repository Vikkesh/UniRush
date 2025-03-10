import { Router } from "express";
import { sample_shops } from "../data.js";
import { ShopModel } from '../models/shop.model.js';
import handler from 'express-async-handler';
import { FoodModel } from '../models/food.model.js';
import auth from '../middleware/auth.mid.js';

const router = Router();

router.get(
  '/',
  handler(async (req, res) => {
    const shops = await ShopModel.find({});
    res.send(shops);
  })
);

router.get(
  '/tags',
  handler(async (req, res) => {
    const tags = await ShopModel.aggregate([
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
      count: await ShopModel.countDocuments(),
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

    const shops = await ShopModel.find({ name: { $regex: searchRegex } });
    res.send(shops);
  })
);

router.get(
  '/tag/:tag',
  handler(async (req, res) => {
    const { tag } = req.params;
    const shops = await ShopModel.find({ tags: tag });
    res.send(shops);
  })
);

router.get(
  '/:shopId',
  handler(async (req, res) => {
    const { shopId } = req.params;
    const shop = await ShopModel.findById(shopId);
    res.send(shop);
  })
);

router.get(
  '/:shopId/foods',
  handler(async (req, res) => {
    const { shopId } = req.params;
    const foods = await FoodModel.find({ shop: shopId });
    res.send(foods);
  })
);

// Admin routes for shops
router.post(
  '/',
  auth,
  handler(async (req, res) => {
    const { name, description, imageUrl, address, tags, stars } = req.body;

    if (!req.user.isAdmin) {
      res.status(403).send('Only Admin Can Create Shops');
      return;
    }

    const shop = await ShopModel.create({
      name,
      description,
      imageUrl,
      address,
      tags,
      stars: stars || 3
    });

    res.send(shop);
  })
);

router.put(
  '/:shopId',
  auth,
  handler(async (req, res) => {
    const { name, description, imageUrl, address, tags, stars } = req.body;
    const { shopId } = req.params;

    if (!req.user.isAdmin) {
      res.status(403).send('Only Admin Can Update Shops');
      return;
    }

    const shop = await ShopModel.findByIdAndUpdate(
      shopId,
      {
        name,
        description,
        imageUrl,
        address,
        tags,
        stars
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

    if (!req.user.isAdmin) {
      res.status(403).send('Only Admin Can Delete Shops');
      return;
    }

    // Check if there are foods assigned to this shop
    const foodCount = await FoodModel.countDocuments({ shop: shopId });
    if (foodCount > 0) {
      res.status(400).send(`Cannot delete shop with ${foodCount} food items assigned to it. Please reassign or delete these items first.`);
      return;
    }

    await ShopModel.findByIdAndDelete(shopId);
    res.send({ success: true });
  })
);

export default router;