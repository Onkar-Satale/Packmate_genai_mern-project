import './Navbar.css';
import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoClick = () => {
    user ? navigate('/account') : navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    toast.success("Logged out successfully");
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
    <>
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
            <button className="auth-btn" onClick={handleLogoutClick}>
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

    {/* Logout Modal */}
    {showLogoutModal && (
      <div className="delete-modal-overlay" style={{ zIndex: 9999 }}>
        <div className="delete-modal">
          <p>Do you want to logout or not?</p>
          <div className="delete-modal-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => setShowLogoutModal(false)}
              className="modal-btn cancel-btn"
            >
              No
            </button>
            <button 
              onClick={confirmLogout}
              className="modal-btn confirm-btn"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;