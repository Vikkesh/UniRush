import React from 'react'
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import ShopPage from './pages/Shop/ShopPage';
import FoodPage from './pages/Food/FoodPage';
import CartPage from './pages/Cart/CartPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import AuthRoute from './components/AuthRoute/AuthRoute';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import PaymentPage from './pages/Payment/PaymentPage';
import OrderTrackPage from './pages/OrderTrack/OrderTrackPage';
import ProfilePage from './pages/Profile/ProfilePage';
import OrdersPage from './pages/Orders/OrdersPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import DeliveryRoute from './components/DeliveryRoute/DeliveryRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />}/>
      <Route path="/search/:searchTerm" element={<HomePage />} />
      <Route path="/tag/:tag" element={<HomePage />} />
      <Route path="/shop/:id" element={<ShopPage />} />
      <Route path="/food/:id" element={<FoodPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/checkout"
        element={
          <AuthRoute><CheckoutPage /></AuthRoute >
        }
      />
      <Route
        path="/payment"
        element={
          <AuthRoute><PaymentPage /></AuthRoute >
        }
      />
      <Route
        path="/track/:orderId"
        element={
          <AuthRoute><OrderTrackPage /></AuthRoute >
        }
      />
      <Route
        path="/profile"
        element={
          <AuthRoute><ProfilePage /></AuthRoute >
        }
      />
      <Route
        path="/orders/:filter?"
        element={
          <AuthRoute><OrdersPage /></AuthRoute >
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AuthRoute>
            <DeliveryRoute>
              <AdminDashboardPage />
            </DeliveryRoute>
          </AuthRoute>
        }
      />
    </Routes>
  );
}
