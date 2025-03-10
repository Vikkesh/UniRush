import { Router } from "express";
import { sample_foods, sample_tags } from "../data.js";
import { FoodModel } from '../models/food.model.js';
import handler from 'express-async-handler';
import auth from '../middleware/auth.mid.js';

const router = Router();

router.get(
  '/',
  handler(async (req, res) => {
    const foods = await FoodModel.find({}).populate('shop');
    res.send(foods);
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
    const { name, price, tags, shop, favorite, stars, imageUrl, origins, cookTime } = req.body;

    if (!req.user.isAdmin) {
      res.status(403).send('Only Admin Can Create Food Items');
      return;
    }

    const food = await FoodModel.create({
      name,
      price,
      tags: tags || [],
      shop,
      favorite: favorite || false,
      stars: stars || 3,
      imageUrl,
      origins: origins || [],
      cookTime
    });

    res.send(await food.populate('shop'));
  })
);

router.put(
  '/:foodId',
  auth,
  handler(async (req, res) => {
    const { name, price, tags, shop, favorite, stars, imageUrl, origins, cookTime } = req.body;
    const { foodId } = req.params;

    if (!req.user.isAdmin) {
      res.status(403).send('Only Admin Can Update Food Items');
      return;
    }

    const updatedFood = await FoodModel.findByIdAndUpdate(
      foodId,
      {
        name,
        price,
        tags: Array.isArray(tags) ? tags : [],
        shop,
        favorite: favorite || false,
        stars: stars || 3,
        imageUrl,
        origins: Array.isArray(origins) ? origins : [],
        cookTime
      },
      { new: true }
    ).populate('shop');

    if (!updatedFood) {
      res.status(404).send('Food not found!');
      return;
    }

    res.send(updatedFood);
  })
);

router.delete(
  '/:foodId',
  auth,
  handler(async (req, res) => {
    const { foodId } = req.params;

    if (!req.user.isAdmin) {
      res.status(403).send('Only Admin Can Delete Food Items');
      return;
    }

    await FoodModel.findByIdAndDelete(foodId);
    res.send({ success: true });
  })
);

export default router;