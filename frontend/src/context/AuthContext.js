import React, { createContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth without accessing localStorage for token
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Hydrate access token using HttpOnly refreshToken cookie
        const res = await api.post('/refresh-token');
        if (res.data?.success && res.data.data?.token) {
          const newToken = res.data.data.token;
          setToken(newToken);
          setAccessToken(newToken);
          
          const email = localStorage.getItem('email');
          const firstName = localStorage.getItem('firstName');
          const lastName = localStorage.getItem('lastName');
          if (email && firstName) {
            setUser({ email, firstName, lastName: lastName !== "undefined" && lastName !== null ? lastName : "" });
          }
        }
      } catch (error) {
        // Only log if the error is not an expected 401 Unauthorized
        if (error.response?.status !== 401) {
          console.error("Auth load error:", error);
        }
        setUser(null);
        setToken(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for the centralized logout event emitted from axiosConfig.js
    const handleLogoutEvent = () => {
        setUser(null);
        setToken(null);
        setAccessToken(null);
        localStorage.removeItem('email');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        
        // Prevent redirect loop if already on home page
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    };
    
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = (userData) => {
    const { token: newToken, email, firstName, lastName } = userData;

    setUser({ email, firstName, lastName });
    setToken(newToken);
    setAccessToken(newToken); // Update in memory variable securely

    // Explicitly ONLY saving identifiable info, never tokens
    localStorage.setItem('email', email);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
  };

  const logout = async () => {
    try {
      await api.post('/logout'); // Assumes backend returns an instruction to clear the refresh token cookie
    } catch (err) {
      console.error("Logout error", err);
    }
    // Triggers full cleanup by firing the custom event
    window.dispatchEvent(new Event('auth:logout'));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};