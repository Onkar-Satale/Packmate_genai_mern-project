import React from 'react';
import './ContactUs.css'; // Import the CSS file

export default function ContactUs() {
  return (
    <div>

      <main>
        <section>
          <h4>Get in Touch</h4>
          <h2>Meet PackMate Team</h2>
          <p>At PackMate, we are commited to simplifying travel through innovative technology. Our mission is to enhance your travel
            experience with personalized packing solutions tailored to your needs.
          </p>
        </section>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="icon">💡</div>
            <h3>Our Mission</h3>

            <p>To simplify travel planning and enhance the travel experience through innovative technology.
              We strive to make your journey as seamless as possible with our AI powered solutions.</p> {/* Added sentence */}
          </div>
          <div className="contact-card">
            <div className="icon">⚜️</div>
            <h3>Our Values</h3>

            <p>We believe in innovation, user-centric design sustainability, and trust. These values
              guide our decisions and help us create better travel experience for everyone.</p> {/* Added sentence */}
          </div>
          <div className="contact-card">
            <div className="icon">🎗️</div>
            <h3>Meet Our Team</h3>

            <p>Our dedicated team includes experts in travel technology, AI and marketing.
              Together, we work to ensure that PackMate delivers the best packing assistance for your travel.</p> {/* Added sentence */}
          </div>
        </div>

      </main>
    </div>
  );
}
