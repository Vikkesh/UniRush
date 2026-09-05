import nodemailer from 'nodemailer';
import { OTPModel } from '../models/otp.model.js';
import crypto from 'crypto';

// Create a function to get the transporter when needed
const getTransporter = () => {
 
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 15000,
  });
};

// Email content template for OTP
const createOTPEmailContent = (email, otp) => {
  return {
    from: `UniRush <fieryvikkesh@gmail.com>`,
    to: email,
    subject: 'Your OTP for SNU UniRush Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">SNU UniRush Registration</h2>
        <p style="color: #666; font-size: 16px;">Hi there,</p>
        <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for SNU UniRush registration is:</p>
        <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This OTP is valid for 5 mins. Please do not share it with anyone.</p>
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
  };
};

// Email content template for Password Reset OTP
const createPasswordResetEmailContent = (email, otp) => {
  return {
    from: `UniRush <fieryvikkesh@gmail.com>`,
    to: email,
    subject: 'Your OTP for SNU UniRush Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">SNU UniRush Password Reset</h2>
        <p style="color: #666; font-size: 16px;">Hi there,</p>
        <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for resetting your SNU UniRush password is:</p>
        <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This OTP is valid for 5 mins. Please do not share it with anyone.</p>
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
  };
};

// Email content template for Email Change Verification OTP
const createEmailChangeEmailContent = (email, otp) => {
  return {
    from: `UniRush <fieryvikkesh@gmail.com>`,
    to: email,
    subject: 'Verify Your New Email Address for SNU UniRush',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">SNU UniRush Email Verification</h2>
        <p style="color: #666; font-size: 16px;">Hi there,</p>
        <p style="color: #666; font-size: 16px;">You requested to change your email address on SNU UniRush. To verify this new email address, please use the following One-Time Password (OTP):</p>
        <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This OTP is valid for 5 mins. If you did not request this change, please ignore this email or contact support.</p>
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
  };
};

// Send OTP email
export const sendOTPEmail = async (email, otp, isPasswordReset = false, isEmailChange = false) => {
  try {
    // For development purposes, log OTP to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`OTP for ${email}: ${otp}`);
    }

    // Only send actual email in production to avoid email service restrictions
    if (process.env.NODE_ENV === 'production') {
      const transporter = getTransporter();
      let emailContent;
      
      if (isEmailChange) {
        emailContent = createEmailChangeEmailContent(email, otp);
      } else if (isPasswordReset) {
        emailContent = createPasswordResetEmailContent(email, otp);
      } else {
        emailContent = createOTPEmailContent(email, otp);
      }
      
      const info = await transporter.sendMail(emailContent);
      console.log(`Email sent to ${email}: ${info.messageId}`);
    }
    
    return true;
  } catch (error) {
    // Log error but don't fail process
    console.error('Error sending OTP email:', error.message);
    return true;
  }
};

// Generate OTP and send email
export const generateAndSendOTP = async (email, isPasswordReset = false, isEmailChange = false) => {
  try {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Save OTP to database (overwrite any existing OTP for this email)
    await OTPModel.findOneAndDelete({ email });
    await OTPModel.create({ email, otp });
    
    // Send OTP via email
    await sendOTPEmail(email, otp, isPasswordReset, isEmailChange);
    
    return true;
  } catch (error) {
    console.error('Error generating and sending OTP:', error.message);
    throw error;
  }
};
