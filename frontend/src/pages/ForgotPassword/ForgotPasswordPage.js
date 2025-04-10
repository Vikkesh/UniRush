import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import classes from './forgotPassword.module.css';
import Title from '../../components/Title/Title';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

export default function ForgotPasswordPage() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { 
        passwordResetStep, 
        initiatePasswordReset, 
        verifyPasswordResetOTP, 
        completePasswordReset, 
        resetPasswordReset, 
        passwordResetData 
    } = auth;
    
    // For OTP inputs
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    // Email Form
    const EmailForm = () => {
        const { register, handleSubmit, formState: { errors } } = useForm();
        
        const submitEmail = async (data) => {
            setIsLoading(true);
            try {
                await initiatePasswordReset(data.email);
            } finally {
                setIsLoading(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit(submitEmail)} className={classes.form}>
                <div className={classes.formHeader}>
                    <h2>Reset Your Password</h2>
                    <p>Enter your email to receive a verification code</p>
                </div>
                
                <Input
                    type="email"
                    label="Email"
                    placeholder="Enter your registered email address"
                    {...register('email', {
                        required: true,
                        pattern: {
                            value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/,
                            message: 'Please enter a valid email address'
                        }
                    })}
                    error={errors.email}
                />
                
                <Button 
                    type="submit" 
                    text={isLoading ? "Sending..." : "Send Code"} 
                    disabled={isLoading}
                />
                
                <div className={classes.links}>
                    <Link to="/login" className={classes.backToLogin}>
                        ← Back to login
                    </Link>
                </div>
            </form>
        );
    };

    // OTP Form
    const OtpForm = () => {
        // Handle OTP input change
        const handleOtpChange = (e, index) => {
            const value = e.target.value;
            
            // Only accept numeric input
            if (value && !/^\d+$/.test(value)) return;
            
            const newOtpValues = [...otpValues];
            
            // If pasting a full OTP
            if (value.length > 1) {
                const pastedOtp = value.split('').slice(0, 6);
                for (let i = 0; i < pastedOtp.length; i++) {
                    if (i + index < 6) {
                        newOtpValues[i + index] = pastedOtp[i];
                    }
                }
                setOtpValues(newOtpValues);
                
                // Focus on the appropriate field
                const focusIndex = Math.min(5, index + value.length);
                if (otpRefs.current[focusIndex]) {
                    otpRefs.current[focusIndex].focus();
                }
                return;
            }
            
            // Handle single character input
            newOtpValues[index] = value;
            setOtpValues(newOtpValues);
            
            // Auto-focus next input if this one is filled
            if (value && index < 5) {
                otpRefs.current[index + 1].focus();
            }
        };
        
        // Handle backspace in OTP input
        const handleOtpKeyDown = (e, index) => {
            if (e.key === 'Backspace') {
                if (!otpValues[index] && index > 0) {
                    // If current field is empty and backspace is pressed, focus previous field
                    const newOtpValues = [...otpValues];
                    newOtpValues[index - 1] = '';
                    setOtpValues(newOtpValues);
                    otpRefs.current[index - 1].focus();
                }
            }
        };
        
        const submitOtp = async () => {
            const otp = otpValues.join('');
            if (otp.length !== 6) {
                return;
            }
            
            setIsLoading(true);
            try {
                await verifyPasswordResetOTP(otp);
            } finally {
                setIsLoading(false);
            }
        };
        
        const resendOtp = async () => {
            if (passwordResetData?.email) {
                setIsLoading(true);
                try {
                    await initiatePasswordReset(passwordResetData.email);
                    setOtpValues(['', '', '', '', '', '']);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        return (
            <div className={classes.form}>
                <div className={classes.formHeader}>
                    <h2>Verify Your Email</h2>
                    <p>Enter the 6-digit code sent to your email</p>
                    <div className={classes.emailDisplay}>
                        {passwordResetData?.email}
                    </div>
                </div>
                
                <div className={classes.otpContainer}>
                    {otpValues.map((value, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={value}
                            onChange={(e) => handleOtpChange(e, index)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            className={classes.otpInput}
                            ref={el => otpRefs.current[index] = el}
                            autoFocus={index === 0}
                        />
                    ))}
                </div>
                
                <Button 
                    onClick={submitOtp} 
                    text={isLoading ? "Verifying..." : "Verify"} 
                    disabled={isLoading || otpValues.some(v => !v)}
                />
                
                <div className={classes.resendContainer}>
                    <button 
                        type="button" 
                        onClick={resendOtp} 
                        className={classes.resendButton}
                        disabled={isLoading}
                    >
                        Resend code
                    </button>
                </div>
                
                <button 
                    type="button" 
                    onClick={resetPasswordReset}
                    className={classes.backButton}
                >
                    ← Change email
                </button>
            </div>
        );
    };
    
    // Password Reset Form
    const ResetForm = () => {
        const { register, handleSubmit, watch, formState: { errors } } = useForm();
        const password = watch('newPassword');
        
        const submitReset = async (data) => {
            setIsLoading(true);
            try {
                const success = await completePasswordReset(data.newPassword);
                if (success) {
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit(submitReset)} className={classes.form}>
                <div className={classes.formHeader}>
                    <h2>Reset Your Password</h2>
                    <p>Create a new password for your account</p>
                </div>
                
                <Input
                    type="password"
                    label="New Password"
                    {...register('newPassword', {
                        required: true,
                        minLength: {
                            value: 5,
                            message: 'Password must be at least 5 characters'
                        },
                    })}
                    error={errors.newPassword}
                />

                <Input
                    type="password"
                    label="Confirm Password"
                    {...register('confirmPassword', {
                        required: true,
                        validate: value => value === password || "Passwords don't match"
                    })}
                    error={errors.confirmPassword}
                />
                
                <Button 
                    type="submit" 
                    text={isLoading ? "Resetting..." : "Reset Password"} 
                    disabled={isLoading}
                />
                
                <button 
                    type="button" 
                    onClick={() => auth.passwordResetStep = 'otp'}
                    className={classes.backButton}
                >
                    ← Back to verification
                </button>
            </form>
        );
    };
    
    // Render the appropriate form based on current step
    const renderForm = () => {
        switch (passwordResetStep) {
            case 'otp':
                return <OtpForm />;
            case 'reset':
                return <ResetForm />;
            case 'email':
            default:
                return <EmailForm />;
        }
    };
    
    return (
        <div className={classes.container}>
            <div className={classes.content}>
                <div className={classes.formContainer}>
                    <div className={classes.stepIndicator}>
                        <div className={`${classes.step} ${passwordResetStep === 'email' ? classes.active : ''} ${passwordResetStep === 'otp' || passwordResetStep === 'reset' ? classes.completed : ''}`}>1</div>
                        <div className={classes.line}></div>
                        <div className={`${classes.step} ${passwordResetStep === 'otp' ? classes.active : ''} ${passwordResetStep === 'reset' ? classes.completed : ''}`}>2</div>
                        <div className={classes.line}></div>
                        <div className={`${classes.step} ${passwordResetStep === 'reset' ? classes.active : ''}`}>3</div>
                    </div>
                    {renderForm()}
                </div>
            </div>
        </div>
    );
}