# **UniRush** 
A comprehensive full-scale business operation that facilitates small and medium enterprises (SMEs) in university campuses by providing them with a dedicated E-commerce platform and seamless integration with delivery partners to enhance operations and sales.

This scalable web application offers broad mobile and desktop GUI support for campus food and goods ordering, eliminating the need for students to commute across campus for purchases.

## Live Demo
https://unirush-dv6o.onrender.com/

## Video Demo
![](https://github.com/Vikkesh/UniRush-demo/blob/main/Screen%20Recording%202026-05-31%20192957.gif)
## User Roles

- **Customer (Students)**: Browse products, place orders, track deliveries, and manage their profiles
- **Shop Owner**: Manage inventory, view sales statistics, process orders, and handle business operations
- **Delivery Personnel**: Accept delivery assignments, update order status, and manage delivery routes
- **Admin**: User management, platform oversight, analytics, and system configuration

## Features

### 🛒 **E-commerce Platform**
- Comprehensive product catalog with category-based browsing
- Real-time inventory management for shop owners
- Shopping cart with order customization options
- Order history and tracking for customers

### 📊 **Business Analytics**
- Sales statistics dashboard for shop owners
- Revenue tracking and performance metrics
- Order analytics and customer insights
- Administrative reports and platform overview

### 🚚 **Delivery Management**
- Seamless integration with delivery partners
- Real-time order status tracking
- Delivery personnel assignment and management
- Route optimization for efficient deliveries

### 💳 **Payment Integration**
- Razorpay integration supporting multiple payment modes
- Secure transaction processing
- Payment history and receipt management
- Refund and cancellation support

### 🔐 **Security & Authentication**
- Robust role-based access control system
- Auth Middleware for request interception
- JSON Web Token (JWT) generation and validation
- Secure OTP generation using Crypto.js

### 📧 **Communication System**
- Automated email delivery using NodeMailer (SMTP)
- Brevo (Sendinblue) integration for reliable communication
- Order confirmations, status updates, and authentication emails
- Customer support and notification system

### 🔔 **Real-time Notification System**
- Socket.io implementation for instant notifications
- Webhook integration for real-time order updates
- Push notifications for order status changes
- Live delivery tracking with real-time location updates
- Instant messaging between customers and delivery personnel

### 📱 **Mobile-First Design**
- Amazing GUI styled specifically for mobile devices
- Responsive design optimized for all screen sizes
- Touch-friendly interface with intuitive navigation
- Progressive Web App (PWA) capabilities
- Cross-platform compatibility for seamless user experience

## Tech Stack

| Layer              | Technology                           |
|-------------------|--------------------------------------|
| **Frontend**       | React.js with responsive design      |
| **Backend**        | Node.js, Express.js                 |
| **Database**       | MongoDB with optimized querying     |
| **Payment**        | Razorpay Integration                 |
| **Authentication** | JWT with role-based access control  |
| **Email Service**  | NodeMailer + Brevo (Sendinblue)     |
| **Security**       | Crypto.js for OTP generation        |
| **Notifications**  | Socket.io + Webhooks                |
| **Design**         | Mobile-first responsive UI          |

## Performance Optimizations

- **Database Optimization**: Implemented indexing and sharding techniques for improved performance
- **Query Efficiency**: 50% improvement in order retrieval speed through optimized database querying
- **Scalable Architecture**: Handles 100+ daily orders with real-time status tracking
- **Storage Optimization**: Sharding implementation for reduced compute requirements



## Screenshots

> **📸 Demo Screenshots Available**
> 
![Image](https://github.com/user-attachments/assets/cae79c64-092b-4394-b9c4-2648131a114a)
![Image](https://github.com/user-attachments/assets/01039d78-8c3c-4d0c-aa4c-b3acbe374df2)
![Image](https://github.com/user-attachments/assets/d15fcbd2-6c08-435d-a026-6b7db380e132)
![Image](https://github.com/user-attachments/assets/1decdafb-0c33-4a21-b9ad-8f6cd4d06f63)
![Image](https://github.com/user-attachments/assets/db1e5ba0-23e8-4e0b-bbb2-526d6e0e62d8)
![Image](https://github.com/user-attachments/assets/ef1ab205-fabe-44b2-a8c0-6bcd0536b950)
![Image](https://github.com/user-attachments/assets/d51f0583-7224-4f6b-ba4c-0de9fefcf6c2)
![Image](https://github.com/user-attachments/assets/8b2b1399-3038-4b15-8b83-f241d0091ca6)
![Image](https://github.com/user-attachments/assets/b80408b4-db05-4920-ab45-ed90e96fca53)
![Image](https://github.com/user-attachments/assets/cab58b6f-fa6f-4940-b3b7-0309321b5f4b)
![Image](https://github.com/user-attachments/assets/d1840bbe-0e50-4d1a-a0ea-79810b15e38a)

## API Documentation

UniRush provides comprehensive RESTful APIs for all major functionalities:

- **Authentication**: User login, registration, and role-based access
- **Products**: Product catalog, inventory management, and search
- **Orders**: Order processing, status tracking, and history
- **Users**: Profile management and user operations
- **Payments**: Razorpay integration and transaction handling
- **Analytics**: Business intelligence and performance metrics
- **Notifications**: Real-time updates via Socket.io and webhooks



## Future Enhancements

🌐 **Multi-Campus Support**:
Expansion to support multiple university campuses on a single platform.

