import React from 'react';
import ReactDOM from 'react-dom/client';  // Import ReactDOM from 'react-dom/client'
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // import AuthProvider


// Create a root element and render the App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <AuthProvider>  {/* wrap app */}
    <App />
  </AuthProvider>

);
