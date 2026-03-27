import React from 'react';
import { FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">© Created with 💜 HackElite</p>

        <div className="social-icons">
          
          <a 
            href="https://www.instagram.com/rajwardhan._b" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaInstagram className="social-icon" />
          </a>

          <a 
            href="https://www.linkedin.com/in/satale-onkar-7332b0220/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaLinkedin className="social-icon" />
          </a>

          <a 
            href="https://x.com/VijayM89311?t=e4vHjB05h0XuXOTMmDI6vw&s=09" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaTwitter className="social-icon" />
          </a>

        </div>
      </div>
    </footer>
  );
};

export default Footer;