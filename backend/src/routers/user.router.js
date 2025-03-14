import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { BAD_REQUEST, UNAUTHORIZED } from '../constants/httpStatus.js';
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
  
  // Check if user is blocked
  if (user.isBlocked) {
    res.status(UNAUTHORIZED).send('Your account has been blocked. Please contact support.');
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
    // Get current user first
    const currentUser = await UserModel.findById(req.user.id);
    if (!currentUser) {
      res.status(BAD_REQUEST).send('User not found!');
      return;
    }

    // Create update object with only provided fields
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.address) updateData.address = req.body.address;
    
    // Handle contact update separately to check for duplicates
    if (req.body.contact && req.body.contact !== currentUser.contact) {
      const existingUserWithContact = await UserModel.findOne({ contact: req.body.contact });
      if (existingUserWithContact) {
        res.status(BAD_REQUEST).send('Contact number already exists!');
        return;
      }
      updateData.contact = req.body.contact;
    }
    
    // Handle email update separately to check for duplicates
    if (req.body.email && req.body.email !== currentUser.email) {
      const existingUser = await UserModel.findOne({ email: req.body.email });
      if (existingUser) {
        res.status(BAD_REQUEST).send('Email already exists!');
        return;
      }
      updateData.email = req.body.email.toLowerCase();
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      res.send(generateTokenResponse(currentUser));
      return;
    }

    // Update user with new data
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      res.status(BAD_REQUEST).send('Update failed!');
      return;
    }

    res.send(generateTokenResponse(updatedUser));
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

// Admin routes for user management
// Get all users (admin only)
router.get(
  '/admin/all',
  auth,
  handler(async (req, res) => {
    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(UNAUTHORIZED).send('Only admins and owners can access this resource');
      return;
    }

    try {
      const users = await UserModel.find({}, '-password');
      res.send(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(BAD_REQUEST).send('Failed to fetch users');
    }
  })
);

// Update user by admin
router.put(
  '/admin/:userId',
  auth,
  handler(async (req, res) => {
    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(UNAUTHORIZED).send('Only admins and owners can update users');
      return;
    }

    const { userId } = req.params;
    const { name, email, address, contact } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;

    // Handle email update with duplicate check
    if (email) {
      const existingUser = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        res.status(BAD_REQUEST).send('Email already exists!');
        return;
      }
      updateData.email = email.toLowerCase();
    }

    // Handle contact update with duplicate check
    if (contact) {
      const existingUserWithContact = await UserModel.findOne({ contact, _id: { $ne: userId } });
      if (existingUserWithContact) {
        res.status(BAD_REQUEST).send('Contact number already exists!');
        return;
      }
      updateData.contact = contact;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(BAD_REQUEST).send('No fields to update');
      return;
    }

    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, select: '-password' }
      );

      if (!updatedUser) {
        res.status(BAD_REQUEST).send('User not found');
        return;
      }

      res.send(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(BAD_REQUEST).send('Failed to update user');
    }
  })
);

// Toggle user block status
router.put(
  '/admin/:userId/block',
  auth,
  handler(async (req, res) => {
    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(UNAUTHORIZED).send('Only admins and owners can block/unblock users');
      return;
    }

    const { userId } = req.params;
    const { isBlocked } = req.body;

    try {
      // Prevent admin from blocking themselves
      if (userId === req.user.id && isBlocked) {
        res.status(BAD_REQUEST).send('You cannot block your own account');
        return;
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { isBlocked },
        { new: true, select: '-password' }
      );

      if (!updatedUser) {
        res.status(BAD_REQUEST).send('User not found');
        return;
      }

      res.send(updatedUser);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      res.status(BAD_REQUEST).send('Failed to update user block status');
    }
  })
);

// Toggle admin role
router.put(
  '/admin/:userId/role',
  auth,
  handler(async (req, res) => {
    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(UNAUTHORIZED).send('Only admins and owners can change user roles');
      return;
    }

    const { userId } = req.params;
    const { isAdmin } = req.body;

    try {
      // Prevent admin from removing their own admin rights
      if (userId === req.user.id && !isAdmin) {
        res.status(BAD_REQUEST).send('You cannot remove your own admin privileges');
        return;
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { isAdmin },
        { new: true, select: '-password' }
      );

      if (!updatedUser) {
        res.status(BAD_REQUEST).send('User not found');
        return;
      }

      res.send(updatedUser);
    } catch (error) {
      console.error('Error toggling admin role:', error);
      res.status(BAD_REQUEST).send('Failed to update user role');
    }
  })
);

// Toggle delivery role
router.put(
  '/admin/:userId/delivery',
  auth,
  handler(async (req, res) => {
    if (!req.user.isAdmin && !req.user.isOwner) {
      res.status(UNAUTHORIZED).send('Only admins and owners can assign delivery personnel');
      return;
    }

    const { userId } = req.params;
    const { isDelivery } = req.body;

    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { isDelivery },
        { new: true, select: '-password' }
      );

      if (!updatedUser) {
        res.status(BAD_REQUEST).send('User not found');
        return;
      }

      res.send(updatedUser);
    } catch (error) {
      console.error('Error toggling delivery role:', error);
      res.status(BAD_REQUEST).send('Failed to update delivery status');
    }
  })
);

// Toggle owner role
router.put(
  '/admin/:userId/owner',
  auth,
  handler(async (req, res) => {
    if (!req.user.isOwner) {
      res.status(UNAUTHORIZED).send('Only owners can assign owner privileges');
      return;
    }
    const { userId } = req.params;
    const { isOwner } = req.body;
    try {
      // Prevent an owner from removing their own owner rights
      if (userId === req.user.id && !isOwner) {
        res.status(BAD_REQUEST).send('You cannot remove your own owner privileges');
        return;
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { isOwner },
        { new: true, select: '-password' }
      );
      if (!updatedUser) {
        res.status(BAD_REQUEST).send('User not found');
        return;
      }
      res.send(updatedUser);
    } catch (error) {
      console.error('Error toggling owner role:', error);
      res.status(BAD_REQUEST).send('Failed to update owner status');
    }
  })
);

const generateTokenResponse = user => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      isDelivery: user.isDelivery,
      isOwner: user.isOwner,
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
    contact: user.contact,
    isAdmin: user.isAdmin,
    isDelivery: user.isDelivery,
    isOwner: user.isOwner,
    token,
  };
};

export default router;