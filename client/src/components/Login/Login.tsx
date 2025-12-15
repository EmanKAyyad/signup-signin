import React, { useState } from 'react';
import loginImg from '../../assets/login.png';
import logo from '../../assets/logo.png';
import styles from './Login.module.scss';
import { CONFIG } from '../../../config';
import { useNavigate } from 'react-router';
import type {
  IErrorResponse,
  IResponseSuccess,
  IUser,
} from '../../shared/types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoadingSubmit(true);

    try {
      const response = await fetch(CONFIG.API_URL + 'authenticate', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: IResponseSuccess<IUser> | IErrorResponse =
        await response.json();

      if (!response.ok) {
        if ('message' in data) {
          setError(data.message);
        }
      }

      if ('data' in data) {
        localStorage.setItem('$$sut', data.data.token || '');
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="background">
      <div className="container text-center">
        <div className={styles.header}>
          <img src={logo} alt="" />
        </div>
        <div className="row">
          <div className="col d-none d-md-block">
            <img className="w-100" src={loginImg} alt="logo image" />
          </div>
          <div className="col">
            <h1 className="mb-5">Welcome Back!</h1>

            <div className={styles['login-container']}>
              <form onSubmit={handleSubmit}>
                <div className="text-start mb-3">
                  <label className="form-label" htmlFor="email">
                    Email:
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    className="form-control"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="text-start">
                  <label className="form-label" htmlFor="password">
                    Password:
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <div className="error-message">{error}</div>
                <button
                  type="submit"
                  className="btn-su primary mt-4 w-100"
                  disabled={loadingSubmit}
                >
                  Login
                  {loadingSubmit && <div className={styles.loader}></div>}
                </button>
                <p className={styles['login-footer']}>
                  Don't have an account? <a href="/signup">Sign Up</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
