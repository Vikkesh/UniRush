import { Types } from 'mongoose';

// Create ObjectIds for our sample shops
const pizzaParadiseId = new Types.ObjectId();
const burgerHavenId = new Types.ObjectId();
const asianDelightsId = new Types.ObjectId();

export const sample_shops = [
  {
    _id: pizzaParadiseId,
    name: 'Pizza Paradise',
    description: 'Best pizzas in town with authentic Italian recipes',
    imageUrl: '/shops/pizza-shop.jpg', // These images need to be added to public folder
    address: '123 Main St, Pizza Town',
    tags: ['Pizza', 'Italian', 'Fast'],
    stars: 4.5,
  },
  {
    _id: burgerHavenId,
    name: 'Burger Haven',
    description: 'Juicy burgers and crispy fries for burger lovers',
    imageUrl: '/shops/burger-shop.jpg',
    address: '456 Burger Ave, Burger City',
    tags: ['Burgers', 'American', 'Fast'],
    stars: 4.2,
  },
  {
    _id: asianDelightsId,
    name: 'Asian Delights',
    description: 'Authentic Asian cuisine from across the continent',
    imageUrl: '/shops/asian-shop.jpg',
    address: '789 Asian Blvd, Food Town',
    tags: ['Asian', 'Chinese', 'Indian'],
    stars: 4.7,
  }
];

export const sample_foods = [
  {
    id: '1',
    name: 'Pizza Pepperoni',
    cookTime: '10-20',
    price: 100,
    favorite: false,
    origins: ['italy'],
    stars: 4.5,
    imageUrl: 'food-1.jpg',
    tags: ['FastFood', 'Pizza', 'Lunch'],
    shop: pizzaParadiseId,
  },
  {
    id: '2',
    name: 'Meatball',
    price: 20,
    cookTime: '20-30',
    favorite: true,
    origins: ['persia', 'middle east', 'china'],
    stars: 5,
    imageUrl: 'food-2.jpg',
    tags: ['SlowFood', 'Lunch'],
    shop: asianDelightsId,
  },
  {
    id: '3',
    name: 'Hamburger',
    price: 5,
    cookTime: '10-15',
    favorite: false,
    origins: ['germany', 'us'],
    stars: 3.5,
    imageUrl: 'food-3.jpg',
    tags: ['FastFood', 'Hamburger'],
    shop: burgerHavenId,
  },
  {
    id: '4',
    name: 'Fried Potatoes',
    price: 2,
    cookTime: '15-20',
    favorite: true,
    origins: ['belgium', 'france'],
    stars: 3,
    imageUrl: 'food-4.jpg',
    tags: ['FastFood', 'Fry'],
    shop: burgerHavenId,
  },
  {
    id: '5',
    name: 'Chicken Soup',
    price: 11,
    cookTime: '40-50',
    favorite: false,
    origins: ['india', 'asia'],
    stars: 3.5,
    imageUrl: 'food-5.jpg',
    tags: ['SlowFood', 'Soup'],
    shop: asianDelightsId,
  },
  {
    id: '6',
    name: 'Vegetables Pizza',
    price: 9,
    cookTime: '40-50',
    favorite: false,
    origins: ['italy'],
    stars: 4.0,
    imageUrl: 'food-6.jpg',
    tags: ['FastFood', 'Pizza', 'Lunch'],
    shop: pizzaParadiseId,
  },
];

export const sample_tags = [
  { name: 'All', count: 6 },
  { name: 'FastFood', count: 4 },
  { name: 'Pizza', count: 2 },
  { name: 'Lunch', count: 3 },
  { name: 'SlowFood', count: 2 },
  { name: 'Hamburger', count: 1 },
  { name: 'Fry', count: 1 },
  { name: 'Soup', count: 1 },
];

export const sample_users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@gmail.com',
    password: '12345',
    address: 'Toronto On',
    contact: '+1234567890',
    isAdmin: false
  },
  {
    id: 2,
    name: 'Jane Doe',
    email: 'jane@gmail.com',
    password: '12345',
    address: 'Shanghai',
    contact: '+1987654321',
    isAdmin: true
  }
];