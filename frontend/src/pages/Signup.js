import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './Login.css';
import { AuthContext } from '../context/AuthContext';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Signup() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    // 🔹 ADDED first & last name
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            toast.error("⚠️ Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("❌ Passwords do not match");
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/register`, {
                firstName,
                lastName,
                email,
                password
            });

            // 🔹 Store auth data
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', res.data.email);
            localStorage.setItem('firstName', res.data.firstName);
            localStorage.setItem('lastName', res.data.lastName);

            // 🔹 Update AuthContext
            login({
                token: res.data.token, 
                email: res.data.email,
                firstName: res.data.firstName,
                lastName: res.data.lastName
            });


            toast.success("🎉 Signup successful! Redirecting...");

            const redirectUrl = localStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                localStorage.removeItem('redirectAfterLogin');
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
            } else {
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            }

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Signup failed");
        }
    };

    return (
        <div className="login-page-wrap">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="login-container">
                <h2>Create Your Account</h2>

                <form onSubmit={handleSignup} className="login-form">

                    {/* 🔹 ADDED First Name */}
                    <label>First Name</label>
                    <input
                        type="text"
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />

                    {/* 🔹 ADDED Last Name */}
                    <label>Last Name</label>
                    <input
                        type="text"
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />

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

                    <label>Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <button type="submit" className="login-btn">Sign Up</button>
                </form>

                <footer className="footer-login">
                    <p>
                        Already have an account? <a href="/login">Login</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
