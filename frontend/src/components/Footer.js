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
            href={process.env.REACT_APP_SOCIAL_INSTAGRAM} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaInstagram className="social-icon" />
          </a>

          <a 
            href={process.env.REACT_APP_SOCIAL_LINKEDIN} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaLinkedin className="social-icon" />
          </a>

          <a 
            href={process.env.REACT_APP_SOCIAL_TWITTER} 
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