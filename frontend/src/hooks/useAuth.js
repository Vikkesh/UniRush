import { useState, createContext, useContext } from 'react';
import * as userService from '../services/userService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

// Function to validate access to specific routes based on user roles
const validateReturnUrl = (url, user) => {
  if (!url) return '/';
  
  // Admin dashboard and related routes
  if (url.startsWith('/admin')) {
    // If not logged in or no permissions, redirect to home
    if (!user) return '/';
    
    // Dashboard access based on role
    if (url.startsWith('/admin/dashboard')) {
      // Admin, owner, shop admin, or delivery can access dashboard
      if (user.isAdmin || user.isOwner || user.isShopAdmin || user.isDelivery) {
        // For delivery personnel without other roles, force them to orders section
        if (user.isDelivery && !user.isAdmin && !user.isOwner && !user.isShopAdmin) {
          return '/admin/dashboard?section=orders';
        }
        return url;
      }
      return '/';
    }
    
    // Only admin or owner can access these routes
    if (url.includes('/users') || url.includes('/shops') || url.includes('/settings')) {
      return (user.isAdmin || user.isOwner) ? url : '/';
    }
  }
  
  // Profile and orders pages require any authenticated user
  if (url.startsWith('/profile') || url.startsWith('/orders')) {
    return user ? url : '/';
  }
  
  // If no specific rules, return the original URL or home for invalid URLs
  return url;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(userService.getUser());
    const [registerStep, setRegisterStep] = useState('email'); // 'email', 'otp', 'details'
    const [registrationData, setRegistrationData] = useState({});
  
    const login = async (email, contact, password) => {
      try {
        const user = await userService.login(email, contact, password);
        setUser(user);
        toast.success('Login Successful');
        return { success: true };
      } catch (err) {
        // Check if this is a blocked account response (401 Unauthorized)
        if (err.response && err.response.status === 401) {
          toast.error(err.response.data || 'Your account has been blocked.');
          return { success: false, blocked: true };
        } else {
          toast.error(err.response?.data || 'Login failed. Please try again.');
          return { success: false };
        }
      }
    };
    
    // Initiate registration by sending OTP
    const initiateRegister = async (email) => {
      try {
        await userService.initiateRegister(email);
        // Save email for later and move to OTP verification step
        setRegistrationData({ email });
        setRegisterStep('otp');
        toast.success('OTP sent to your email!');
        return true;
      } catch (err) {
        toast.error(err.response?.data || 'Failed to initiate registration');
        return false;
      }
    };
    
    // Verify OTP and move to details step
    const verifyOTP = async (otp) => {
      try {
        // Just verify here, don't submit yet
        if (!registrationData.email) {
          toast.error('Email address missing. Please start over.');
          setRegisterStep('email');
          return false;
        }
        
        // Save OTP for later submission
        setRegistrationData({
          ...registrationData,
          otp
        });
        
        // Move to details step
        setRegisterStep('details');
        toast.success('OTP verified successfully!');
        return true;
      } catch (err) {
        toast.error(err.response?.data || 'Invalid OTP');
        return false;
      }
    };
    
    // Complete registration with all details
    const completeRegister = async (userData) => {
      try {
        // Combine stored email and OTP with user details
        const registerData = {
          ...registrationData,
          ...userData
        };
        
        const user = await userService.completeRegister(registerData);
        setUser(user);
        
        // Reset registration state
        setRegistrationData({});
        setRegisterStep('email');
        
        toast.success('Registration Successful');
        return true;
      } catch (err) {
        toast.error(err.response?.data || 'Registration Failed');
        return false;
      }
    };
    
    // Reset registration state
    const resetRegistration = () => {
      setRegistrationData({});
      setRegisterStep('email');
    };

    // Legacy register function
    const register = async (registerData) => {
      try {
        const user = await userService.register(registerData);
        setUser(user);
        toast.success('Registration Successful');
      } catch (err) {
        toast.error(err.response?.data || 'Registration Failed');
      }
    };

    const logout = () => {
        userService.logout();
        setUser(null);
        toast.success('Logout Successful');
      };

    const updateProfile = async user => {
      try {
        const updatedUser = await userService.updateProfile(user);
        if (updatedUser) {
          setUser(updatedUser);
          toast.success('Profile Update Was Successful');
        }
      } catch (err) {
        toast.error(err.response.data);
      }
    };

    const changePassword = async passwords => {
      await userService.changePassword(passwords);
      logout();
      toast.success('Password Changed Successfully, Please Login Again!');
    };
  
    return (
      <AuthContext.Provider 
        value={{ 
          user, 
          login, 
          logout, 
          register,
          initiateRegister,
          verifyOTP,
          completeRegister,
          resetRegistration,
          registerStep, 
          setRegisterStep,
          registrationData,
          updateProfile, 
          changePassword,
          validateReturnUrl
        }}
      >
        {children}
      </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);