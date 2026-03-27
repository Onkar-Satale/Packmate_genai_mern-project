import './Navbar.css';
import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    user ? navigate('/account') : navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    'Home',
    'How it works',
    'Features',
    'About Us',
    'Contact Us'
  ];

  return (
    <div className="navbar">

      {/* 🔥 TOP ROW */}
      <div className="navbar-top">

        <div className="navbar-left">
          <span
            className="avatar-circle"
            onClick={handleLogoClick}
            role="button"
            aria-label="User Profile"
          >
            {user?.firstName
              ? user.firstName.charAt(0).toUpperCase()
              : user?.email
                ? user.email.charAt(0).toUpperCase()
                : 'U'}
          </span>

          <span className="website-name">PackMate</span>
        </div>

        <div className="navbar-right">
          {!user ? (
            <>
              <NavLink to="/login">
                <button className="auth-btn">Login</button>
              </NavLink>

              <NavLink to="/signup">
                <button className="auth-btn">Sign Up</button>
              </NavLink>
            </>
          ) : (
            <button className="auth-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>

      </div>

      {/* 🔽 NAV LINKS */}
      <div className="navbar-center">
        {navItems.map((text, i) => {
          const path =
            text === 'Home'
              ? '/'
              : `/${text.toLowerCase().replace(/\s+/g, '-')}`;

          return (
            <NavLink
              key={i}
              to={path}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {text}
            </NavLink>
          );
        })}
      </div>

    </div>
  );
};

export default Navbar;