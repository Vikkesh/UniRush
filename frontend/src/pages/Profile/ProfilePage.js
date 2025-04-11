import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import classes from './profilePage.module.css';
import Title from '../../components/Title/Title';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import ChangePassword from '../../components/Button/ChangePassword';

export default function ProfilePage() {
  const {
    user,
    updateProfile,
    initiateEmailChange,
    verifyEmailChangeOTP,
    emailChangeStep,
    emailChangeData,
    resetEmailChange
  } = useAuth();

  // Create a separate state for OTP to ensure it's completely independent
  const [otpValue, setOtpValue] = useState("");
  
  // Use separate form instances for different steps
  const profileForm = useForm({
    defaultValues: {
      name: user.name,
      email: user.email,
      contact: user.contact,
      address: user.address
    }
  });
  
  const finalForm = useForm({
    defaultValues: {
      name: user.name,
      email: user.email, // This will be updated to the new email once verified
      contact: user.contact,
      address: user.address
    }
  });

  // Update form values when user data changes
  useEffect(() => {
    if (emailChangeStep === 'email') {
      profileForm.reset({
        name: user.name,
        email: user.email,
        contact: user.contact,
        address: user.address
      });
    } else if (emailChangeStep === 'complete' && emailChangeData.newEmail) {
      finalForm.reset({
        name: user.name,
        email: emailChangeData.newEmail,
        contact: user.contact,
        address: user.address
      });
    }
  }, [emailChangeStep, user, emailChangeData, profileForm, finalForm]);

  // Reset OTP value when changing steps
  useEffect(() => {
    setOtpValue("");
  }, [emailChangeStep]);

  const handleSubmitProfile = async data => {
    // If the email is unchanged, just update the profile
    if (data.email === user.email) {
      updateProfile(data);
    } else {
      // Otherwise, initiate email change process
      const result = await initiateEmailChange(data.email);
      if (!result) {
        // If failed, revert to original email
        profileForm.setValue('email', user.email);
      }
    }
  };
  
  const handleSubmitOTP = async e => {
    e.preventDefault(); // Prevent default form submission
    await verifyEmailChangeOTP(otpValue);
  };
  
  const handleSubmitFinal = async data => {
    await updateProfile(data);
  };

  const cancelEmailChange = () => {
    resetEmailChange();
  };

  return (
    <div className={classes.container}>
      <div className={classes.details}>
        <Title title="Update Profile" />
        
        {emailChangeStep === 'email' ? (
          // Regular profile form
          <form onSubmit={profileForm.handleSubmit(handleSubmitProfile)}>
            <Input
              type="text"
              label="Name"
              {...profileForm.register('name', {
                required: true,
                minLength: 3,
              })}
              error={profileForm.formState.errors.name}
            />
            <Input
              type="email"
              label="Email"
              {...profileForm.register('email', {
                required: true,
                pattern: {
                  value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/i,
                  message: 'Email Is Not Valid'
                },
              })}
              error={profileForm.formState.errors.email}
            />
            <Input
              type="tel"
              label="Contact Number"
              {...profileForm.register('contact', {
                required: true,
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit phone number'
                }
              })}
              error={profileForm.formState.errors.contact}
            />
            <Input
              type="text"
              label="Address"
              {...profileForm.register('address', {
                required: true,
                minLength: 5,
              })}
              error={profileForm.formState.errors.address}
            />

            <Button type="submit" text="Update" backgroundColor="#009e84" />
          </form>
        ) : emailChangeStep === 'otp' ? (
          // OTP verification for email change - using controlled input instead of react-hook-form
          <form onSubmit={handleSubmitOTP}>
            <div className={classes.emailChangeInfo}>
              <p>We've sent a verification code to <strong>{emailChangeData.newEmail}</strong></p>
              <p>Please enter the code below to verify your new email address.</p>
            </div>
            <div className={classes.inputContainer}>
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="Enter 6-digit verification code"
                className={classes.inputField}
                required
                minLength={6}
                maxLength={6}
              />
            </div>
            <div className={classes.buttonGroup}>
              <Button type="submit" text="Verify" backgroundColor="#009e84" />
              <Button type="button" text="Cancel" backgroundColor="#e63946" onClick={cancelEmailChange} />
            </div>
          </form>
        ) : (
          // Final step after OTP verification
          <form onSubmit={finalForm.handleSubmit(handleSubmitFinal)}>
            <div className={classes.emailChangeInfo}>
              <p>Your new email <strong>{emailChangeData.newEmail}</strong> has been verified.</p>
              <p>Click Update to save your changes.</p>
            </div>
            <Input
              type="text"
              label="Name"
              {...finalForm.register('name', {
                required: true,
                minLength: 3,
              })}
              error={finalForm.formState.errors.name}
            />
            <Input
              type="email"
              label="Email"
              {...finalForm.register('email', {
                required: true,
                pattern: {
                  value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/i,
                  message: 'Email Is Not Valid'
                },
              })}
              error={finalForm.formState.errors.email}
              disabled={true}
            />
            <Input
              type="tel"
              label="Contact Number"
              {...finalForm.register('contact', {
                required: true,
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit phone number'
                }
              })}
              error={finalForm.formState.errors.contact}
            />
            <Input
              type="text"
              label="Address"
              {...finalForm.register('address', {
                required: true,
                minLength: 5,
              })}
              error={finalForm.formState.errors.address}
            />
            <div className={classes.buttonGroup}>
              <Button type="submit" text="Update Profile" backgroundColor="#009e84" />
              <Button type="button" text="Cancel" backgroundColor="#e63946" onClick={cancelEmailChange} />
            </div>
          </form>
        )}
        
        <ChangePassword />
      </div>
    </div>
  );
}