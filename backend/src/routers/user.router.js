import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { BAD_REQUEST } from '../constants/httpStatus.js';
import handler from 'express-async-handler';
import { UserModel } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import auth from '../middleware/auth.mid.js';
const router = Router();
const PASSWORD_HASH_SALT_ROUNDS = 10;

router.post('/login', handler(async (req, res) => {
  const { email, contact, password } = req.body;

  // Build query based on provided credentials
  const query = {};
  if (email) query.email = email;
  if (contact) query.contact = contact;
  
  // If neither email nor contact is provided, return error
  if (Object.keys(query).length === 0) {
    res.status(BAD_REQUEST).send('Email or Contact number is required');
    return;
  }

  // Find user by email or contact
  const user = await UserModel.findOne(query);
  
  // Check if user exists before attempting password comparison
  if (!user) {
    res.status(BAD_REQUEST).send('User not found!');
    return;
  }
  
  // Now safely compare passwords since we know user exists
  if (await bcrypt.compare(password, user.password)) {
    res.send(generateTokenResponse(user));
    return;
  } else {
    res.status(BAD_REQUEST).send('Password is incorrect!');
  }
}));

router.post(
  '/register',
  handler(async (req, res) => {
    const { name, email, password, address, contact } = req.body; // Added contact

    const user = await UserModel.findOne({ email });

    if (user) {
      res.status(BAD_REQUEST).send('User already exists, please login!');
      return;
    }
    const hashedPassword = await bcrypt.hash(
      password,
      PASSWORD_HASH_SALT_ROUNDS
    );
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      address,
      contact, // Added contact field
    };
    const result = await UserModel.create(newUser);
    res.send(generateTokenResponse(result));
  })
);
router.put(
  '/updateProfile',
  auth,
  handler(async (req, res) => {
    const { name, address, contact } = req.body; // Added contact
    const user = await UserModel.findByIdAndUpdate(
      req.user.id,
      { name, address, contact }, // Added contact
      { new: true }
    );
    res.send(generateTokenResponse(user));
  })
);

router.put(
  '/changePassword',
  auth,
  handler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      res.status(BAD_REQUEST).send('Change Password Failed!');
      return;
    }

    const equal = await bcrypt.compare(currentPassword, user.password);

    if (!equal) {
      res.status(BAD_REQUEST).send('Current Password Is Not Correct!');
      return;
    }

    user.password = await bcrypt.hash(newPassword, PASSWORD_HASH_SALT_ROUNDS);
    await user.save();

    res.send();
  })
);

const generateTokenResponse = user => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    address: user.address,
    contact: user.contact, // Return contact in response
    isAdmin: user.isAdmin,
    token,
  };
};
export default router;