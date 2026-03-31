import React, { useEffect, useRef, useState } from 'react';
import './HowItWorks.css';
import img14 from '../assets/14.png';
import img15 from '../assets/15.png';
import img16 from '../assets/16.png';

export default function HowItWorks() {
  const intro1Ref = useRef(null);
  const detailsRef = useRef(null);
  const intro2Ref = useRef(null);
  
  const [intro1Visible, setIntro1Visible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [intro2Visible, setIntro2Visible] = useState(false);
  
  const [num1, setNum1] = useState(0); // For 95%
  const [num2, setNum2] = useState(0); // For 1000+

  useEffect(() => {
    const observerOptions = {
      root: null, // Observe in the viewport
      threshold: 0.1, // Trigger when 10% of the section is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === intro1Ref.current) {
            setIntro1Visible(true);
            animateNumbers(); // Start number animation when intro section is visible
          } else if (entry.target === detailsRef.current) {
            setDetailsVisible(true);
          } else if (entry.target === intro2Ref.current) {
            setIntro2Visible(true);
          }
        }
      });
    }, observerOptions);

    if (intro1Ref.current) observer.observe(intro1Ref.current);
    if (detailsRef.current) observer.observe(detailsRef.current);
    if (intro2Ref.current) observer.observe(intro2Ref.current);

    return () => {
      if (intro1Ref.current) observer.unobserve(intro1Ref.current);
      if (detailsRef.current) observer.unobserve(detailsRef.current);
      if (intro2Ref.current) observer.unobserve(intro2Ref.current);
    };
  }, []);

  // Number animation function
  const animateNumbers = () => {
    let targetNum1 = 95;
    let targetNum2 = 1000;

    let step1 = (targetNum1 - num1) / 60; // Adjust the 60 for duration control
    let step2 = (targetNum2 - num2) / 60;

    const interval = setInterval(() => {
      setNum1((prevNum1) => {
        let newNum = prevNum1 + step1;
        if (newNum >= targetNum1) {
          newNum = targetNum1;
          clearInterval(interval);
        }
        return newNum;
      });
      setNum2((prevNum2) => {
        let newNum = prevNum2 + step2;
        if (newNum >= targetNum2) {
          newNum = targetNum2;
        }
        return newNum;
      });
    }, 16); // Approximately 60fps, 1000ms / 60 = ~16ms
  };



  return (
    <div className="how-it-works-container">
      <main className="main-content">
        {/* Intro Section */}
        <section
          ref={intro1Ref}
          className={`intro-section ${intro1Visible ? 'animate' : ''}`}
        >
          <div className="intro-content">
            <img src={img14} alt="AI Packing Assistant" className="intro-image" />
            <div className="text-content">
              <h2 className="section-title">Revolutionize Your Packing with AI</h2>
              <p className="section-description">
                PackMate's Al ensures you pack smartly by analyzing your travel itinerary.
                It considers the weather, destination, and planned activities to
                create a personalized packing list. This way, you can focus on
                enjoying your trip without worrying about missing essentials.
              </p>

              {/* <ul className="details-list detlistleft">
              <li>Enter your travel destination and dates</li>
              <li>Select your planned activities</li>
              <li>Receive a customized packing list</li>
            </ul> */}
              <p></p>
              <div className="details-p1">
                <p>❄️Weather-based packing suggestions</p>
                <p>🗺️Locaion-specific essentials</p>
                <p>🎯Activity-focused recommendations</p>
              </div>

            </div>
          </div>
        </section>

        {/* Details Section */}
        <section
          ref={detailsRef}
          className={`details-section ${detailsVisible ? 'animate' : ''}`}
        >
          <img src={img15} alt="Travel Details Input" className="details-image" />
          <div className="details-text">
            <h2 className="section-title">Enhance Your Packing Experience with Interactive Animations</h2>
            <p className="-description">
              PackMate's Al assistant transforms packing into an engaging experience with interactive animations.
              These visuals guide you through the packing process,
              ensuring you never miss an essential item. Enjoy a seamless and fun preparation for your travels.
            </p>
            <ul className="details-list">
              <li>Enter your travel destination and dates</li>
              <li>Select your planned activities</li>
              <li>Receive a customized packing list</li>
            </ul>
          </div>
        </section>

        <section
          ref={intro2Ref}
          className={`intro-section ${intro2Visible ? 'animate' : ''}`}
        >
          <div className="intro-content">
            <img src={img16} alt="AI Packing Assistant" className="intro-image" />
            <div className="text-content">
              <h2 className="section-title">Key Factors for Tailored Packing Suggestions</h2>
              <p className="section-description">
                PackMate's Al analyzes weather conditions, destination specifics, and planned activities to offer
                personalized packing advice.
                This ensures you have everything you need, whether you're exploring a city or relaxing on a beach.
              </p>

              {/* <ul className="details-list detlistleft">
              <li>Enter your travel destination and dates</li>
              <li>Select your planned activities</li>
              <li>Receive a customized packing list</li>
            </ul> */}
              <p></p>
              <div className="details-p1">

                <p>☁️Weather-based Clothing and Gear recommendation</p>
                <p>✈️Locaion-specific Packing tips</p>
                <p>🧩Activity-oriented Pacing lists</p>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
