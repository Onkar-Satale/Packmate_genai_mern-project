import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HowItWorks.css';
import img12 from '../assets/12.png';
import img13 from '../assets/13.png';
import BotpressChat from './Botpresschat';

export default function HowItWorks() {
  const navigate = useNavigate();
  const introRef = useRef(null);
  const detailsRef = useRef(null);
  const [introVisible, setIntroVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  const [coords, setCoords] = useState(null);
  const [error, setError] = useState("");
  const [locationName, setLocationName] = useState("");

  // NEW: state to show FastAPI UI

  // Intersection Observer for animation
  useEffect(() => {
    const observerOptions = { root: null, threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === introRef.current) {
            setIntroVisible(true);
            animateNumbers();
          } else if (entry.target === detailsRef.current) {
            setDetailsVisible(true);
          }
        }
      });
    }, observerOptions);

    if (introRef.current) observer.observe(introRef.current);
    if (detailsRef.current) observer.observe(detailsRef.current);

    return () => {
      if (introRef.current) observer.unobserve(introRef.current);
      if (detailsRef.current) observer.unobserve(detailsRef.current);
    };
  }, []);

  const animateNumbers = () => {
    let targetNum1 = 95;
    let targetNum2 = 1000;
    let step1 = (targetNum1 - num1) / 60;
    let step2 = (targetNum2 - num2) / 60;

    let iterations = 0;
    const interval = setInterval(() => {
      iterations++;
      if (iterations >= 60) clearInterval(interval);
      
      setNum1((prev) => Math.min(prev + step1, targetNum1));
      setNum2((prev) => Math.min(prev + step2, targetNum2));
    }, 36);
  };

  // UPDATED Try Now button click
  const handleClick = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      localStorage.setItem('redirectAfterLogin', '/packing-assistant');
      navigate('/login');
      return;
    }

    navigate('/packing-assistant'); // ✅ THIS IS THE FIX
  };


  // Geolocation fetch
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setCoords({ latitude, longitude });
        try {
          const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY;
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await response.json();
          if (data?.results?.length > 0) setLocationName(data.results[0].formatted);
          else setError("No location found.");
        } catch (err) {
          console.error(err);
          setError("Failed to fetch location.");
        }
      },
      (err) => {
        setError("Unable to retrieve location: " + err.message);
      }
    );
  }, []);

  return (
    <div className="how-it-works-container">
      {
        <main className="main-content">
          {/* Intro Section */}
          <section ref={introRef} className={`intro-section ${introVisible ? 'animate' : ''}`}>
            <div className="intro-content">
              <img src={img12} alt="AI Packing Assistant" className="intro-image" />
              <div className="text-content">
                <h2 className="section-title">Revolutionize Your Packing with AI</h2>
                <p className="section-description">
                  PackMate's AI assistant simplifies your travel preparation by offering personalized packing suggestions.
                </p>
                <div className="stats-container">
                  <div className="stat">
                    <h3 className="stat-value">{Math.round(num1)}%</h3>
                    <p className="stat-description">User approval rate</p>
                  </div>
                  <button className="try-now-button" onClick={handleClick}>
                    Try Now
                  </button>
                  <div className="stat">
                    <h3 className="stat-value">{Math.round(num2)}+</h3>
                    <p className="stat-description">Successful AI-assisted trips</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Details Section */}
          <section ref={detailsRef} className={`details-section ${detailsVisible ? 'animate' : ''}`}>
            <img src={img13} alt="Travel Details Input" className="details-image" />
            <div className="details-text">
              <h2 className="section-title">Effortlessly Input Your Travel Details</h2>
              <p className="section-description">
                Simply enter your destination, travel dates, and planned activities. Our AI analyzes the information to provide you with a personalized packing checklist.
              </p>
              <ul className="details-list">
                <li>Enter your travel destination and dates</li>
                <li>Select your planned activities</li>
                <li>Receive a customized packing list</li>
              </ul>
            </div>
          </section>

          {/* Location Debug */}
          <section className="location-debug" style={{ textAlign: "center", marginTop: "2rem" }}>
            <h3>📍 Location Debug</h3>
            {coords ? (
              <>
                <p>Latitude: {coords.latitude}</p>
                <p>Longitude: {coords.longitude}</p>
                {locationName && <p>🗺️ You are at: {locationName}</p>}
              </>
            ) : (
              <p style={{ color: "red" }}>{error || "Fetching location..."}</p>
            )}
          </section>
        </main>
      }
      <BotpressChat />
    </div>
  );
}
