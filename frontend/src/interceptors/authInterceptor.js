import axios from 'axios';
import { toast } from 'react-toastify';

// Flag to prevent multiple simultaneous logouts
let isLoggingOut = false;

axios.interceptors.request.use(
  req => {
    const user = localStorage.getItem('user');
    const token = user && JSON.parse(user).token;
    if (token) {
      req.headers['Authorization'] = `Bearer ${token}`;
    }
    return req;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling authentication errors
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response && error.response.status === 401) {
      // Prevent multiple simultaneous logout attempts
      if (!isLoggingOut) {
        isLoggingOut = true;
        
        // Clear all user-related data from storage
        localStorage.removeItem('user');
        sessionStorage.clear(); // Clear any session data
        
        // Clear any ongoing network requests to prevent unnecessary API calls
        // Cancel any pending requests if using axios cancel tokens
        
        // Show user-friendly message about session expiry
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          toast.error('Your session has expired. You will be redirected to login.');
        }
        
        // Small delay to ensure storage is cleared and message is shown
        setTimeout(() => {
          // Redirect to login page with current path for redirect after login
          const currentPath = window.location.pathname;
          const redirectParam = currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
          window.location.href = `/login${redirectParam}`;
          
          // Reset flag after redirect
          setTimeout(() => {
            isLoggingOut = false;
          }, 500);
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);