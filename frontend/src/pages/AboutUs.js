import React from 'react';
import './ContactUs.css';

export default function ContactUs() {

  const cards = [
    {
      icon: "💡",
      title: "Our Mission",
      desc: "To simplify travel planning and enhance the travel experience through innovative technology."
    },
    {
      icon: "⚜️",
      title: "Our Values",
      desc: "We believe in innovation, user-centric design, sustainability, and trust."
    },
    {
      icon: "🎗️",
      title: "Meet Our Team",
      desc: "Our dedicated team includes experts in travel technology, AI, and marketing."
    }
  ];

  return (
    <div className="contact-container">

      <main role="main">
        <section>
          <h4>Get in Touch</h4>
          <h2>Meet PackMate Team</h2>
          <p>
            At PackMate, we are committed to simplifying travel through innovative technology.
            Our mission is to enhance your travel experience with personalized packing solutions tailored to your needs.
          </p>
        </section>

        <div className="contact-grid">
          {cards.map((card, index) => (
            <div className="contact-card" key={index}>
              <div className="icon" aria-hidden="true">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>

        <section className="contact-info">
          <h3>Contact Us</h3>
          <p>Email:onkarsatale4@gmail.com</p>
          <p>Phone: +91 8446004736</p>
        </section>

      </main>
    </div>
  );
}