import { useState } from 'react';
import logo from '../../assets/logo.png';
import styles from './SignUp.module.scss';
import { CONFIG } from '../../../config';
import type {
  IErrorResponse,
  IResponseSuccess,
  IUser,
} from '../../shared/types';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { emailRegex, passwordRegex } from '../../shared/globals';
import checkCircleUrl from '../../assets/check-green.svg';
import invalidCircleUrl from '../../assets/times-red-circle.svg';
import { useNavigate } from 'react-router';

interface IFormInput {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}
export const SignUp = () => {
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<IFormInput>({ mode: 'onChange' });
  const [password, cpassword] = watch(['password', 'confirmPassword']);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    setLoadingSubmit(true);
    setError('');

    try {
      const response = await fetch(CONFIG.API_URL + 'authenticate/sign-up', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const parsedResponse: IResponseSuccess<IUser> | IErrorResponse =
        await response.json();

      if (!response.ok) {
        if ('message' in parsedResponse) {
          setError(parsedResponse.message);
        }
      } else {
        if (parsedResponse.statusCode === 200) {
          navigate('/');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoadingSubmit(false);
    }
  };
  return (
    <div className={`background ${styles.signUpForm}`}>
      <div className="container text-center pb-5">
        <div className={styles.header}>
          <img src={logo} alt="" />
        </div>

        <h1 className="mb-1">Welcome to Disney!</h1>
        <p>Fill in the following fields</p>

        <div className={styles['form-container']}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="text-start">
              <label className="form-label" htmlFor="email">
                Email:
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: true,
                  pattern: emailRegex,
                })}
                className={`form-control` + (errors.email ? ' error' : '')}
                placeholder="Enter your email"
              />
              <div className="error-message">
                {errors.email
                  ? errors.email.type === 'required'
                    ? 'this field is required.'
                    : 'this is not a valid email. '
                  : ''}
              </div>
            </div>
            <div className="text-start">
              <label className="form-label" htmlFor="name">
                Name:
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: true, minLength: 3 })}
                className={`form-control` + (errors.name ? ' error' : '')}
                placeholder="Enter your name"
              />
              <div className="error-message">
                {errors.name
                  ? errors.name.type === 'required'
                    ? 'this field is required.'
                    : 'Name cannot be less than 3 characters. '
                  : ''}
              </div>
            </div>
            <div className="text-start">
              <label className="form-label" htmlFor="password">
                Password:
              </label>
              <input
                id="password"
                type="password"
                className={`form-control` + (errors.password ? ' error' : '')}
                {...register('password', {
                  required: true,
                  pattern: passwordRegex,
                })}
                placeholder="Enter your password"
              />
              <div className="error-message">
                {errors.password
                  ? errors.password.type === 'required'
                    ? 'this field is required.'
                    : 'Passwords must be at least 8 characters long and contain at least one letter, one number, and one special character. '
                  : ''}
              </div>
            </div>

            <div className={'text-start ' + styles['confirm-password']}>
              <label className="form-label" htmlFor="cpassword">
                Confirm password:
              </label>
              <input
                id="cpassword"
                type="password"
                className="form-control"
                {...register('confirmPassword', {
                  required: true,
                  validate: (value, formValues) =>
                    value === formValues.password,
                })}
                placeholder="Enter your password"
              />
              {password && cpassword ? (
                errors.confirmPassword?.type === 'validate' ? (
                  <img
                    className={styles['validation-icon']}
                    src={invalidCircleUrl}
                    alt="invalid"
                  />
                ) : (
                  <img
                    className={styles['validation-icon']}
                    src={checkCircleUrl}
                    alt="valid"
                  />
                )
              ) : null}
              <div className="error-message">
                {errors.confirmPassword?.type === 'required'
                  ? 'this field is required.'
                  : ''}
              </div>
            </div>
            <div className="error-message  mt-2">{error}</div>
            <button
              type="submit"
              className="btn-su primary w-100 mt-1"
              disabled={loadingSubmit || !isValid}
            >
              Submit
              {loadingSubmit && <div className={styles.loader}></div>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
