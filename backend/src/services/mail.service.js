import { OTPModel } from '../models/otp.model.js';
import crypto from 'crypto';

// Send an email through Brevo's HTTP API (port 443), since Render's free
// instances block outbound SMTP ports.
const sendViaBrevo = async ({ to, subject, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'UniRush', email: process.env.MAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo responded ${response.status}: ${await response.text()}`);
  }

  const { messageId } = await response.json();
  return messageId;
};

// Email content template for OTP
const createOTPEmailContent = (otp) => {
  return {
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
const createPasswordResetEmailContent = (otp) => {
  return {
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
const createEmailChangeEmailContent = (otp) => {
  return {
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
  // For development purposes, log OTP to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(`OTP for ${email}: ${otp}`);
  }

  // Without credentials there is nothing to send through, so fall back to the
  // console log above rather than failing the caller.
  if (!process.env.BREVO_API_KEY || !process.env.MAIL_FROM) {
    console.warn(`BREVO_API_KEY/MAIL_FROM not set - skipping email to ${email}`);
    return false;
  }

  let emailContent;

  if (isEmailChange) {
    emailContent = createEmailChangeEmailContent(otp);
  } else if (isPasswordReset) {
    emailContent = createPasswordResetEmailContent(otp);
  } else {
    emailContent = createOTPEmailContent(otp);
  }

  const messageId = await sendViaBrevo({ to: email, ...emailContent });
  console.log(`Email sent to ${email}: ${messageId}`);

  return true;
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
