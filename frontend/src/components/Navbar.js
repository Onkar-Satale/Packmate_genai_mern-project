import './Navbar.css';
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    user ? navigate('/account') : navigate('/login');
  };

  return (
    <div className="navbar">

      {/* 🔥 TOP ROW (LOGO + BUTTONS SAME LINE) */}
      <div className="navbar-top">
        <div className="navbar-left">
          <span className="avatar-circle" onClick={handleLogoClick}>
            {user?.firstName
              ? user.firstName.charAt(0).toUpperCase()
              : user?.email
                ? user.email.charAt(0).toUpperCase()
                : ''}
          </span>
          <span className="website-name">PackMate</span>
        </div>

        <div className="navbar-right">
          {!user ? (
            <>
              <Link to="/login"><button className="auth-btn">Login</button></Link>
              <Link to="/signup"><button className="auth-btn">Sign Up</button></Link>
            </>
          ) : (
            <button className="auth-btn" onClick={logout}>Logout</button>
          )}
        </div>
      </div>

      {/* 🔽 LINKS ROW */}
      <div className="navbar-center">
        {['Home', 'How it works', 'Features', 'About Us', 'Contact Us'].map((text, i) => (
          <Link
            key={i}
            to={text === 'Home' ? '/' : `/${text.toLowerCase().replace(/\s+/g, '-')}`}
            className="nav-link"
          >
            {text}
          </Link>
        ))}
      </div>

    </div>
  );
};

export default Navbar;
