import React, { useEffect, useRef, useState } from 'react';
import './Home3.css';
import img6 from '../assets/6.png';
import img7 from '../assets/7.png';
import img8 from '../assets/8.png';
import img9 from '../assets/9.png';
import img10 from '../assets/10.png';
import img11 from '../assets/11.png';

const Home3 = () => {
  const featureRef = useRef(null);
  const scenarioRef = useRef(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [scenariosVisible, setScenariosVisible] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null, // Use the viewport
      threshold: 0.1, // Trigger wahen 10% of the section is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === featureRef.current && entry.isIntersecting) {
          setFeaturesVisible(true);
        }
        if (entry.target === scenarioRef.current && entry.isIntersecting) {
          setScenariosVisible(true);
        }
      });
    }, observerOptions);

    if (featureRef.current) observer.observe(featureRef.current);
    if (scenarioRef.current) observer.observe(scenarioRef.current);

    return () => {
      if (featureRef.current) observer.unobserve(featureRef.current);
      if (scenarioRef.current) observer.unobserve(scenarioRef.current);
    };
  }, []);

  return (
    <div>
      {/* Header Section */}
      <div className="header">
        <h1>Experience Stress-Free Travel with PackMate</h1>
        <p>
          PackMate's AI Packing Assistant revolutionizes your travel preparation by offering personalized packing lists tailored to your destination, weather, and activities. Enjoy a seamless and interactive experience that ensures you never forget essentials, adapts to real-time weather updates, and saves you time and stress.
        </p>
      </div>

      {/* Features Section */}
      <div
        ref={featureRef}
        className={`features ${featuresVisible ? 'animate' : ''}`}
      >
        {[
          {
            title: 'Tailored Packing Lists for Every Trip',
            description:
              'Our AI Packing Assistant creates customized packing lists based on your travel details, ensuring you have everything you need for a perfect trip.',
            img: img6,
          },
          {
            title: 'Real-Time Weather Adaptation',
            description:
              'Stay prepared for any weather with our AI’s real-time updates, adjusting your packing list to match current conditions at your destination.',
            img: img7,
          },
          {
            title: 'Interactive and User-Friendly Experience',
            description:
              'Enjoy a seamless and engaging packing experience with our intuitive interface, designed to make travel preparation enjoyable and efficient.',
            img: img8,
          },
        ].map((feature, index) => (
          <div key={index} className="featureCard">
            <img src={feature.img} alt={feature.title} />
            <div className="content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>

            </div>
          </div>
        ))}
      </div>

      {/* Travel Scenarios Section */}
      <div
        ref={scenarioRef}
        className={`travelScenarios ${scenariosVisible ? 'animate' : ''}`}
      >
        <h2>Explore Travel Scenarios</h2>
        <div className="scenarioCards">
          {[
            {
              title: 'Beach Vacation',
              description:
                'PackMate’s AI suggests light clothing, swimwear, and sun protection essentials for a perfect beach getaway.',
              img: img9,
            },
            {
              title: 'Business Trip',
              description:
                'For business travelers, PackMate recommends formal attire, tech gadgets, and travel-friendly accessories.',
              img: img10,
            },
            {
              title: 'Mountain Adventure',
              description:
                'Heading to the mountains? Our AI suggests warm layers, skiing gear, and safety equipment.',
              img: img11,
            },
          ].map((scenario, index) => (
            <div key={index} className="scenarioCard">
              <img src={scenario.img} alt={scenario.title} />
              <div className="content">
                <h3>{scenario.title}</h3>
                <p>{scenario.description}</p>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home3;