import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './Login.css';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill both fields");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });

      // Save all auth data to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('firstName', res.data.firstName);
      localStorage.setItem('lastName', res.data.lastName);

      // ✅ Update AuthContext with full user info including token
      login({
        token: res.data.token,
        email: res.data.email,
        firstName: res.data.firstName,
        lastName: res.data.lastName
      });

      toast.success("Login successful! Redirecting...");

      // Redirect user
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        setTimeout(() => { window.location.href = redirectUrl; }, 1500);
      } else {
        setTimeout(() => { navigate('/'); }, 1500); // default: go Home page
      }

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrap">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="login-container">
        <h2>Login to Your Account</h2>
        <form onSubmit={handleLogin} className="login-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Logging you in...' : 'Login'}
          </button>
        </form>

        <footer className="footer-login">
          <p>Don't have an account? <a href="/signup">Sign Up</a></p>
        </footer>
      </div>
    </div>
  );
}
