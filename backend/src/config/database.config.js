import { connect, set } from "mongoose";
import { UserModel } from '../models/user.model.js';
import { FoodModel } from '../models/food.model.js';
import { ShopModel } from '../models/shop.model.js';
import { sample_users, sample_foods, sample_shops } from '../data.js';
import bcrypt from 'bcryptjs';

const PASSWORD_HASH_SALT_ROUNDS = 10;
set('strictQuery', true);

export const dbconnect = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    console.log('Attempting to connect to MongoDB with URI:', process.env.MONGO_URI);
    await connect(process.env.MONGO_URI);
    await seedUsers();
    await seedShops(); // Add shops first
    await seedFoods(); // Then foods (since they reference shops)
    console.log('Connected successfully to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}; 

async function seedUsers() {
  const usersCount = await UserModel.countDocuments();
  if (usersCount > 0) { 
    console.log('Users seed is already done!');
    return;
  }

  for (let user of sample_users) {
    user.password = await bcrypt.hash(user.password, PASSWORD_HASH_SALT_ROUNDS);
    await UserModel.create(user);
  }

  console.log('Users seed is done!');
}  

async function seedShops() {
  const shopsCount = await ShopModel.countDocuments();
  if (shopsCount > 0) {
    console.log('Shops seed is already done!');
    return;
  }

  try {
    // Create all shops
    for (const shop of sample_shops) {
      await ShopModel.create(shop);
    }
    console.log('Shops seed is done!');
  } catch (error) {
    console.error('Error seeding shops:', error);
  }
}

async function seedFoods() {
  const foods = await FoodModel.countDocuments();
  if (foods > 0) {
    console.log('Foods seed is already done!');
    return;
  }

  for (const food of sample_foods) {
    food.imageUrl = `/foods/${food.imageUrl}`;
    await FoodModel.create(food);
  }

  console.log('Foods seed Is Done!');
}