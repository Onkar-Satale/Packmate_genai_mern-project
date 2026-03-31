import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on refresh
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      const firstName = localStorage.getItem('firstName');
      const lastName = localStorage.getItem('lastName');

      if (storedToken && email && firstName && lastName) {
        setUser({ email, firstName, lastName });
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Auth load error:", error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    const { token, email, firstName, lastName } = userData;

    setUser({ email, firstName, lastName });
    setToken(token);

    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};