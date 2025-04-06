import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams, Link } from 'react-router-dom';
import classes from './loginPage.module.css';
import Title from '../../components/Title/Title';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset
  } = useForm();
  const navigate = useNavigate();
  const { user, login, validateReturnUrl } = useAuth();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl');
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    
    // Validate the return URL based on user's permissions
    const validatedUrl = validateReturnUrl(returnUrl, user);
    if (location.pathname === '/login') {
      navigate(validatedUrl, { replace: true });
    }
  }, [user, returnUrl, navigate, location.pathname, validateReturnUrl]);

  const submit = async (data) => {
    try {
      // Don't send empty strings to the backend to avoid undefined comparisons
      const email = data.email || undefined;
      const contact = data.contact || undefined;
      const password = data.password;
      
      // Check that at least one identifier is provided
      if (!email && !contact) {
        toast.error('Please provide either Email or Contact Number');
        return;
      }
      
      // Pass email, contact and password to login function
      const result = await login(email, contact, password);
      
      // If user is blocked, reset the form
      if (result && result.blocked) {
        reset({
          email: '',
          contact: '',
          password: ''
        });
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className={classes.container} >
      <div className={classes.details}>
        <Title title="Login" />
        <form onSubmit={handleSubmit(submit)} noValidate>
          <Input
            label="Email"
            type="email"
            {...register('email', {
              validate: (value) => {
                // At least one field (email or contact) must be filled
                const contact = document.querySelector('input[name="contact"]')?.value;
                return (value || contact) ? true : 'Either Email or Contact Number is required';
              },
              pattern: {
                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/,
                message: 'Email Is Not Valid'
              }
            })}
            error={errors.email}
          />
          <div className={classes.orDivider}>OR</div>
          <Input
            label="Contact Number"
            type="tel"
            {...register('contact', { 
              validate: (value) => {
                // At least one field (email or contact) must be filled
                const email = document.querySelector('input[name="email"]')?.value;
                return (value || email) ? true : 'Either Email or Contact Number is required';
              },
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number'
              }
            })}
            error={errors.contact}
          />
          <Input
            label="Password"
            type="password"
            {...register('password', { 
              required: true,
              minLength: 5,
            })}
            error={errors.password}
          />
          <Button text="Login" type="submit" />
          <div className={classes.register}>
            New user? &nbsp;
            <Link to={`/register${returnUrl ? '?returnUrl=' + returnUrl : ''}`}>
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
