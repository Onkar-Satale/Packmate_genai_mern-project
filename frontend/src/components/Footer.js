import React from 'react';
import { FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Footer.css'; // For custom styles

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">© Created with 💜 HackElite</p>
        <div className="social-icons">
          {/* Add actual icons here later */}
          <a href="https://www.instagram.com/rajwardhan._b"><FaInstagram className="social-icon" /></a>
          <a href="https://www.linkedin.com/in/satale-onkar-7332b0220/"><FaLinkedin className="social-icon" /></a>
          <a href="https://x.com/VijayM89311?t=e4vHjB05h0XuXOTMmDI6vw&s=09">
          <FaTwitter className="social-icon" />
          </a> {/* Using the FaTwitter icon from react-icons */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;