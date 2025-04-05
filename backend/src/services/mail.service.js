import nodemailer from 'nodemailer';
import { OTPModel } from '../models/otp.model.js';
import crypto from 'crypto';

// Create a function to get the transporter when needed
const getTransporter = () => {
 
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
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
    from: `UniRush <unirush.team@unirush.in>`,
    to: email,
    subject: 'Your OTP for SNU UniRush Registration',
    text: `Your OTP for SNU UniRush registration is: ${otp}\nThis OTP is valid for 5 mins.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">SNU Food Site Registration</h2>
        <p style="color: #666; font-size: 16px;">Hi there,</p>
        <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for SNU Food Site registration is:</p>
        <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This OTP is valid for a limited time. Please do not share it with anyone.</p>
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `,
  };
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    // For development purposes, log OTP to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`OTP for ${email}: ${otp}`);
    }

    // Only send actual email in production to avoid email service restrictions
    if (process.env.NODE_ENV === 'production') {
      const transporter = getTransporter();
      const info = await transporter.sendMail(createOTPEmailContent(email, otp));
      console.log(`Email sent to ${email}: ${info.messageId}`);
    }
    
    return true;
  } catch (error) {
    // Log error but don't fail registration process
    console.error('Error sending OTP email:', error.message);
    return true;
  }
};

// Generate OTP and send email
export const generateAndSendOTP = async (email) => {
  try {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Save OTP to database (overwrite any existing OTP for this email)
    await OTPModel.findOneAndDelete({ email });
    await OTPModel.create({ email, otp });
    
    // Send OTP via email
    await sendOTPEmail(email, otp);
    
    return true;
  } catch (error) {
    console.error('Error generating and sending OTP:', error.message);
    throw error;
  }
};