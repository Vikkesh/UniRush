import { Router } from 'express';
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from '../constants/httpStatus.js';
import { UserModel } from '../models/user.model.js';
import { OTPModel } from '../models/otp.model.js';
import { BypassModel } from '../models/bypass.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { verifyToken, isOwner, isAdmin, isAdminOrOwner } from '../middleware/auth.mid.js';
import { sendOTPEmail, generateAndSendOTP } from '../services/mail.service.js';

const router = Router();

// Helper function to check if email domain is valid or in the bypass list
const isEmailDomainValid = async (email) => {
  // Check if the email uses the @snu.edu.in domain
  if (email.endsWith('@snu.edu.in')) {
    return true;
  }
  
  // Check if this email is in the bypass list
  const bypassEntry = await BypassModel.findOne({ email });
  return !!bypassEntry;
};

// Step 1: Initiate Registration (Email Validation & OTP Generation)
router.post('/register/initiate', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email format
    if (!email || !email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/i)) {
      return res.status(BAD_REQUEST).send('Invalid email format');
    }
    
    // Check if the email is already registered
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(BAD_REQUEST).send('Email already exists');
    }
    
    // Validate email domain or check bypass list
    const isValidDomain = await isEmailDomainValid(email);
    if (!isValidDomain) {
      return res.status(FORBIDDEN).send('Only @snu.edu.in emails are allowed to register. Contact administration for exceptions.');
    }
    
    // Generate OTP and send email
    await generateAndSendOTP(email);
    
    res.status(OK).send('OTP sent successfully');
  } catch (error) {
    console.error('Error in registration initiation:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
  }
});

// Step 2: Complete Registration (OTP Verification & User Creation)
router.post('/register/complete', async (req, res) => {
  try {
    const { email, otp, name, contact, password, address } = req.body;
    
    // Validate all required fields
    if (!email || !otp || !name || !contact || !password || !address) {
      return res.status(BAD_REQUEST).send('All fields are required');
    }
    
    // Validate contact (10-digit number)
    if (!contact.match(/^[0-9]{10}$/)) {
      return res.status(BAD_REQUEST).send('Contact must be a 10-digit number');
    }
    
    // Check if contact already exists
    const existingContact = await UserModel.findOne({ contact });
    if (existingContact) {
      return res.status(BAD_REQUEST).send('Contact already exists');
    }
    
    // Verify OTP
    const otpRecord = await OTPModel.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(BAD_REQUEST).send('Invalid or expired OTP');
    }
    
    // Hash password
    const encryptedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password: encryptedPassword,
      address,
      contact,
      isAdmin: false,
      isOwner: false,
      isDelivery: false,
      isShopAdmin: false,
      isBlocked: false
    });
    
    // Generate token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isOwner: newUser.isOwner,
        isDelivery: newUser.isDelivery,
        isShopAdmin: newUser.isShopAdmin,
        managedShops: newUser.isShopAdmin ? newUser.managedShops : undefined,
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Delete OTP record after successful verification
    await OTPModel.findOneAndDelete({ email });
    
    // Return user data with token
    res.status(OK).send({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      address: newUser.address,
      contact: newUser.contact,
      isAdmin: newUser.isAdmin,
      isOwner: newUser.isOwner,
      isDelivery: newUser.isDelivery,
      isShopAdmin: newUser.isShopAdmin,
      token,
    });
    
  } catch (error) {
    console.error('Error in registration completion:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
  }
});

// Legacy register endpoint (keep for backward compatibility)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address, contact } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !address || !contact) {
      return res.status(BAD_REQUEST).send('All fields are required');
    }
    
    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(BAD_REQUEST).send('Email already exists');
    }
    
    // Check if contact already exists
    const existingContact = await UserModel.findOne({ contact });
    if (existingContact) {
      return res.status(BAD_REQUEST).send('Contact already exists');
    }
    
    // Validate email domain or check bypass list
    const isValidDomain = await isEmailDomainValid(email);
    if (!isValidDomain) {
      return res.status(FORBIDDEN).send('Only @snu.edu.in emails are allowed to register. Contact administration for exceptions.');
    }
    
    // Hash password
    const encryptedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password: encryptedPassword,
      address,
      contact,
      isAdmin: false,
      isOwner: false,
      isDelivery: false,
      isShopAdmin: false,
      isBlocked: false
    });
    
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isOwner: newUser.isOwner,
        isDelivery: newUser.isDelivery,
        isShopAdmin: newUser.isShopAdmin,
        managedShops: newUser.isShopAdmin ? newUser.managedShops : undefined,
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(OK).send({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      address: newUser.address,
      contact: newUser.contact,
      isAdmin: newUser.isAdmin,
      isOwner: newUser.isOwner,
      isDelivery: newUser.isDelivery,
      isShopAdmin: newUser.isShopAdmin,
      token,
    });
  } catch (error) {
    console.error('Error in legacy registration:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, contact, password } = req.body;
    
    // Validate that at least email or contact is provided
    if (!email && !contact) {
      return res.status(BAD_REQUEST).send('Email or contact is required');
    }
    
    if (!password) {
      return res.status(BAD_REQUEST).send('Password is required');
    }
    
    // Find user by email or contact
    const user = await UserModel.findOne(
      email ? { email } : { contact }
    );
    
    // Check if user exists
    if (!user) {
      return res.status(BAD_REQUEST).send('Invalid credentials');
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(UNAUTHORIZED).send('Your account has been blocked. Please contact administration.');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(BAD_REQUEST).send('Invalid credentials');
    }
    
    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isOwner: user.isOwner,
        isDelivery: user.isDelivery,
        isShopAdmin: user.isShopAdmin,
        managedShops: user.isShopAdmin ? user.managedShops : undefined,
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Return user data with token
    res.status(OK).send({
      id: user.id,
      email: user.email,
      name: user.name,
      address: user.address,
      contact: user.contact,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
      isDelivery: user.isDelivery,
      isShopAdmin: user.isShopAdmin,
      token,
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
  }
});

router.put('/updateProfile', verifyToken, async (req, res) => {
  try {
    const { name, email, address, contact } = req.body;
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(BAD_REQUEST).send('User not found');
    }
    
    // Check if email is being changed and already exists for another user
    if (email !== user.email) {
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        return res.status(BAD_REQUEST).send('Email already exists');
      }
      
      // Validate email domain or check bypass list if changing email
      const isValidDomain = await isEmailDomainValid(email);
      if (!isValidDomain) {
        return res.status(FORBIDDEN).send('Only @snu.edu.in emails are allowed. Contact administration for exceptions.');
      }
    }
    
    // Check if contact is being changed and already exists for another user
    if (contact !== user.contact) {
      const existingContact = await UserModel.findOne({ contact });
      if (existingContact) {
        return res.status(BAD_REQUEST).send('Contact already exists');
      }
    }
    
    // Update user
    user.name = name;
    user.email = email;
    user.address = address;
    user.contact = contact;
    await user.save();
    
    // Update token with new user data
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isOwner: user.isOwner,
        isDelivery: user.isDelivery,
        isShopAdmin: user.isShopAdmin,
        managedShops: user.isShopAdmin ? user.managedShops : undefined,
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Return updated user data with new token
    res.status(OK).send({
      id: user.id,
      email: user.email,
      name: user.name,
      address: user.address,
      contact: user.contact,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
      isDelivery: user.isDelivery,
      isShopAdmin: user.isShopAdmin,
      token,
    });
  } catch (error) {
    console.error('Error in profile update:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
  }
});

router.put('/changePassword', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(BAD_REQUEST).send('User not found');
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(BAD_REQUEST).send('Current password is incorrect');
    }
    
    // Hash and update new password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    user.password = encryptedPassword;
    await user.save();
    
    res.status(OK).send('Password updated successfully');
  } catch (error) {
    console.error('Error in password change:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
  }
});

// Admin routes for user management
router.get('/admin/all', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.send(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to fetch users');
  }
});

router.put('/admin/:userId', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { name, email, contact, address } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Prevent admin from editing owner unless they are also owner
    if (user.isOwner && !req.user.isOwner) {
      return res.status(FORBIDDEN).send('You do not have permission to edit an owner account');
    }
    
    // Check if email is being changed and already exists for another user
    if (email !== user.email) {
      const existingEmail = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(BAD_REQUEST).send('Email already exists');
      }
      
      // Validate email domain or check bypass list if changing email
      const isValidDomain = await isEmailDomainValid(email);
      if (!isValidDomain) {
        return res.status(FORBIDDEN).send('Only @snu.edu.in emails are allowed. Contact administration for exceptions.');
      }
    }
    
    // Check if contact is being changed and already exists for another user
    if (contact !== user.contact) {
      const existingContact = await UserModel.findOne({ contact, _id: { $ne: userId } });
      if (existingContact) {
        return res.status(BAD_REQUEST).send('Contact already exists');
      }
    }
    
    // Update user
    user.name = name;
    user.email = email;
    user.address = address;
    user.contact = contact;
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error updating user by admin:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update user');
  }
});

router.put('/admin/:userId/block', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    // Prevent blocking/unblocking self
    if (userId === req.user.id) {
      return res.status(BAD_REQUEST).send('You cannot block/unblock your own account');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Prevent admin from blocking owner unless they are also owner
    if (user.isOwner && !req.user.isOwner) {
      return res.status(FORBIDDEN).send('You do not have permission to block an owner account');
    }
    
    // Update blocked status
    user.isBlocked = isBlocked;
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error toggling user block status:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update user block status');
  }
});

router.put('/admin/:userId/admin-role', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    // Prevent removing own admin status
    if (userId === req.user.id && !isAdmin && req.user.isAdmin) {
      return res.status(BAD_REQUEST).send('You cannot remove your own admin privileges');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Update admin status
    user.isAdmin = isAdmin;
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error toggling admin role:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update admin role');
  }
});

router.put('/admin/:userId/owner-role', verifyToken, isOwner, async (req, res) => {
  try {
    const { isOwner } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    // Prevent removing own owner status
    if (userId === req.user.id && !isOwner) {
      return res.status(BAD_REQUEST).send('You cannot remove your own owner privileges');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Update owner status
    user.isOwner = isOwner;
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error toggling owner role:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update owner role');
  }
});

router.put('/admin/:userId/delivery-role', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { isDelivery } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Update delivery status
    user.isDelivery = isDelivery;
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error toggling delivery role:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update delivery role');
  }
});

router.put('/admin/:userId/shop-admin-role', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { isShopAdmin } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Update shop admin status
    user.isShopAdmin = isShopAdmin;
    
    // If removing shop admin role, also clear managed shops
    if (!isShopAdmin) {
      user.managedShops = [];
    }
    
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error toggling shop admin role:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update shop admin role');
  }
});

router.put('/admin/:userId/managed-shops', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { managedShops } = req.body;
    const userId = req.params.userId;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(BAD_REQUEST).send('Invalid user ID');
    }
    
    // Validate managed shops array
    if (!Array.isArray(managedShops)) {
      return res.status(BAD_REQUEST).send('Managed shops must be an array');
    }
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).send('User not found');
    }
    
    // Only update managed shops if user is a shop admin
    if (!user.isShopAdmin) {
      return res.status(BAD_REQUEST).send('User is not a shop admin');
    }
    
    // Update managed shops
    user.managedShops = managedShops;
    await user.save();
    
    res.send(user);
  } catch (error) {
    console.error('Error updating managed shops:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to update managed shops');
  }
});

// Email Bypass List Management (Admin/Owner only)
router.get('/admin/bypass-list', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const bypassList = await BypassModel.find().populate('addedBy', 'name email');
    res.send(bypassList);
  } catch (error) {
    console.error('Error fetching bypass list:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to fetch bypass list');
  }
});

router.post('/admin/bypass-list', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const { email, reason } = req.body;
    
    // Validate email format
    if (!email || !email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/i)) {
      return res.status(BAD_REQUEST).send('Invalid email format');
    }
    
    // Check if email already exists in bypass list
    const existing = await BypassModel.findOne({ email });
    if (existing) {
      return res.status(BAD_REQUEST).send('Email already exists in bypass list');
    }
    
    // Create new bypass entry
    const bypass = await BypassModel.create({
      email,
      reason: reason || '',
      addedBy: req.user.id
    });
    
    // Populate addedBy details for response
    await bypass.populate('addedBy', 'name email');
    
    res.status(OK).send(bypass);
  } catch (error) {
    console.error('Error adding to bypass list:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to add to bypass list');
  }
});

router.delete('/admin/bypass-list/:id', verifyToken, isAdminOrOwner, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(BAD_REQUEST).send('Invalid bypass list entry ID');
    }
    
    const result = await BypassModel.findByIdAndDelete(id);
    if (!result) {
      return res.status(NOT_FOUND).send('Bypass list entry not found');
    }
    
    res.status(OK).send({ message: 'Removed from bypass list successfully' });
  } catch (error) {
    console.error('Error removing from bypass list:', error);
    res.status(INTERNAL_SERVER_ERROR).send('Failed to remove from bypass list');
  }
});

export default router;