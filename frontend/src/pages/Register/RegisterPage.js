import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../../components/Input/Input';
import Title from '../../components/Title/Title';
import classes from './registerPage.module.css';
import Button from '../../components/Button/Button';
import { Link } from 'react-router-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
    const auth = useAuth(); 
    const { user, registerStep, initiateRegister, verifyOTP, completeRegister, resetRegistration } = auth;
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const returnUrl = params.get('returnUrl');
    const [isLoading, setIsLoading] = useState(false);
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);
    
    useEffect(() => {
        if (!user) return;
        returnUrl ? navigate(returnUrl) : navigate('/');
    }, [user, navigate, returnUrl]);
    
    // Form for email entry
    const EmailForm = () => {
        const { register, handleSubmit, formState: { errors } } = useForm();
        
        const submitEmail = async data => {
            setIsLoading(true);
            try {
                await initiateRegister(data.email);
            } finally {
                setIsLoading(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit(submitEmail)} noValidate className={classes.form}>
                <div className={classes.formHeader}>
                    <h2>Let's get started!</h2>
                    <p>Enter your email to continue</p>
                </div>
                
                <Input
                    type="email"
                    label="Email"
                    placeholder="Enter your email address"
                    {...register('email', {
                        required: true,
                        pattern: {
                            value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/,
                            message: 'Please enter a snu email address'
                        }
                    })}
                    error={errors.email}
                />
                
                <Button 
                    type="submit" 
                    text={isLoading ? "Sending..." : "Continue"} 
                    disabled={isLoading}
                />
                
                <div className={classes.divider}>
                    <span>Already have an account?</span>
                </div>
                
                <Link 
                    to={`/login${returnUrl ? '?returnUrl=' + returnUrl : ''}`} 
                    className={classes.linkButton}
                >
                    Log In
                </Link>
            </form>
        );
    };
    
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
    
    // Form for OTP verification
    const OtpForm = () => {
        const submitOtp = async () => {
            const otp = otpValues.join('');
            if (otp.length !== 6) {
                return;
            }
            
            setIsLoading(true);
            try {
                await verifyOTP(otp);
            } finally {
                setIsLoading(false);
            }
        };
        
        const resendOtp = async () => {
            if (auth.registrationData?.email) {
                setIsLoading(true);
                try {
                    await initiateRegister(auth.registrationData.email);
                    setOtpValues(['', '', '', '', '', '']);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        return (
            <div className={classes.form}>
                <div className={classes.formHeader}>
                    <h2>Verify your email</h2>
                    <p>Enter the 6-digit code sent to your email</p>
                    <div className={classes.emailDisplay}>
                        {auth.registrationData?.email}
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
                    onClick={resetRegistration}
                    className={classes.backButton}
                >
                    ← Change email
                </button>
            </div>
        );
    };
    
    // Form for completing registration with user details
    const DetailsForm = () => {
        const { register, handleSubmit, watch, formState: { errors } } = useForm();
        const password = watch('password');
        
        const submitDetails = async data => {
            setIsLoading(true);
            try {
                await completeRegister(data);
            } finally {
                setIsLoading(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit(submitDetails)} noValidate className={classes.form}>
                <div className={classes.formHeader}>
                    <h2>Complete Your Profile</h2>
                    <p>Just a few more details to get you started</p>
                </div>
                
                <Input
                    type="text"
                    label="Name"
                    {...register('name', {
                        required: true,
                    })}
                    error={errors.name}
                />

                <Input
                    type="tel"
                    label="Contact Number"
                    {...register('contact', {
                        required: true,
                        pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Please enter a valid 10-digit phone number'
                        }
                    })}
                    error={errors.contact}
                />

                <Input
                    type="password"
                    label="Password"
                    {...register('password', {
                        required: true,
                        minLength: 5,
                    })}
                    error={errors.password}
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

                <Input 
                    type="text"
                    label="Address"
                    {...register('address', {
                        required: true,
                    })}
                    error={errors.address}
                />

                <Button 
                    type="submit" 
                    text={isLoading ? "Creating Account..." : "Create Account"} 
                    disabled={isLoading}
                />
                
                <button 
                    type="button" 
                    onClick={() => auth.setRegisterStep('otp')}
                    className={classes.backButton}
                >
                    ← Back to verification
                </button>
            </form>
        );
    };
    
    const renderForm = () => {
        switch (registerStep) {
            case 'otp':
                return <OtpForm />;
            case 'details':
                return <DetailsForm />;
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
                        <div className={`${classes.step} ${registerStep === 'email' ? classes.active : ''} ${registerStep === 'otp' || registerStep === 'details' ? classes.completed : ''}`}>1</div>
                        <div className={classes.line}></div>
                        <div className={`${classes.step} ${registerStep === 'otp' ? classes.active : ''} ${registerStep === 'details' ? classes.completed : ''}`}>2</div>
                        <div className={classes.line}></div>
                        <div className={`${classes.step} ${registerStep === 'details' ? classes.active : ''}`}>3</div>
                    </div>
                    {renderForm()}
                </div>
            </div>
        </div>
    );
}
