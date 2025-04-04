import { useState, createContext, useContext } from 'react';
import * as userService from '../services/userService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

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
          changePassword 
        }}
      >
        {children}
      </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);