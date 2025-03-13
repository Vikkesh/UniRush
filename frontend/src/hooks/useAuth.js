import { useState, createContext, useContext } from 'react';
import * as userService from '../services/userService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(userService.getUser());
  
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

    const register = async data => {
      try {
        const user = await userService.register(data);
        setUser(user);
        toast.success('Register Successful');
      } catch (err) {
        toast.error(err.response.data);
      }
    };
    const logout = () => {
        // Get the previous user ID before logout
        const prevUserId = user?._id || 'guest';
        
        // Clear user-specific cart data
        if (prevUserId) {
          const userCartKey = `user-cart-${prevUserId}`;
          localStorage.removeItem(userCartKey);
        }
        
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
    }
    const changePassword = async passwords => {
      await userService.changePassword(passwords);
      logout();
      toast.success('Password Changed Successfully, Please Login Again!');
    };
  

 return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );

};
    export const useAuth = () => useContext(AuthContext);