
import { dbconnect } from './src/config/database.config.js';
import { ShopModel } from './src/models/shop.model.js';
import { FoodModel } from './src/models/food.model.js';

async function clearImageData() {
  try {
    console.log('Connecting to database...');
    await dbconnect();
    
    console.log('Clearing image URLs from shops...');
    const shopResult = await ShopModel.updateMany({}, { imageUrl: '' });
    console.log('Updated shops:', shopResult.modifiedCount);
    
    console.log('Clearing image URLs from foods...');
    const foodResult = await FoodModel.updateMany({}, { imageUrl: '' });
    console.log('Updated foods:', foodResult.modifiedCount);
    
    console.log('Operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing image data:', error);
    process.exit(1);
  }
}

clearImageData();

