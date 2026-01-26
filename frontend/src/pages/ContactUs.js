import React, { useState, useContext } from 'react';
import './ContactUs.css';
import mapdis from '../assets/mapdis.png';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ContactUs() {
  const { user } = useContext(AuthContext);

  // ✅ safe extraction (works for string OR object user)
  const userEmail = typeof user === 'string' ? user : user?.email;
  const userFirstName = typeof user === 'object' ? user?.firstName : '';
  const userLastName = typeof user === 'object' ? user?.lastName : '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }

    if (!/^\+?\d{10,15}$/.test(formData.phone)) {
      toast.error('Enter a valid phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          access_key: '7c30012f-a14c-4141-b8af-64707af29229',
          subject: 'New Submission from PackMate Contact Form',
          email: formData.email,
          ...formData
        })
      });

      const result = await response.json();

      if (response.status === 200) {
        toast.success('Message sent successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        toast.error(result.message || 'Something went wrong!');
      }
    } catch (err) {
      toast.error('Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <ToastContainer position="top-right" autoClose={5000} />

      <main>
        <section>
          <h4>Get in Touch</h4>
          <h2>We’re Here to Help</h2>
          <p>Reach out to us for any inquiries or support regarding your PackMate experience.</p>
        </section>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="icon">📧</div>
            <h3>Email Us</h3>
            <p>support@packmate.com</p>
            <p>We aim to respond within 24 hours.</p>
          </div>
          <div className="contact-card">
            <div className="icon">📞</div>
            <h3>Call Us</h3>
            <p>+1-555-0125</p>
            <p>Need immediate assistance? Our team is ready to help you.</p>
          </div>
          <div className="contact-card">
            <div className="icon">📍</div>
            <h3>Visit Us</h3>
            <p>12 MG Road, 3rd Floor</p>
            <p>Bengaluru, Karnataka, India</p>
          </div>
        </div>

        <div className="form-image-grid">
          <form onSubmit={handleSubmit} className="contact-form" noValidate>

            <div className="flex">
              <div className="input-group">
                <label className="label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onFocus={() => {
                    if (userFirstName && !formData.firstName) {
                      setFormData(prev => ({ ...prev, firstName: userFirstName }));
                    }
                  }}
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onFocus={() => {
                    if (userLastName && !formData.lastName) {
                      setFormData(prev => ({ ...prev, lastName: userLastName }));
                    }
                  }}
                  className="input"
                />
              </div>
            </div>

            <div className="flex">
              <div className="input-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="abc@xyz.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => {
                    if (userEmail && !formData.email) {
                      setFormData(prev => ({ ...prev, email: userEmail }));
                    }
                  }}
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Your Message</label>
              <textarea
                rows="5"
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="submit-group">
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>

          </form>

          <div className="image-container">
            <img src={mapdis} alt="Contact" className="contact-image" />
          </div>
        </div>
      </main>
    </div>
  );
}
