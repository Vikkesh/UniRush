import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams, Link } from 'react-router-dom';
import classes from './loginPage.module.css';
import Title from '../../components/Title/Title';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

export default function LoginPage() {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl');
  useEffect(() => {
    if (!user) return;

    returnUrl ? navigate(returnUrl) : navigate('/');
  }, [navigate, returnUrl, user]);

  const submit = async ({ email, password }) => {
    await login(email, password);
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
              required: true,
              pattern: {
                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/,
                message: 'Email Is Not Valid'
              }
            })}
            error={errors.email}
          />


          <Input
            label="Password"
            type="password"
            {...register('password', { required: true })}
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
