import React, { useEffect, useRef } from 'react';

const DestinationInput = ({ 
  trip, 
  handleChange, 
  handleCityCorrectionAndPrefetch, 
  setIsDestinationFocused, 
  showTempWarning, 
  isCorrecting 
}) => {
  const debounceTimeoutRef = useRef(null);

  // 1. Persistent Storage (Session & Local)
  useEffect(() => {
    if (trip) {
      localStorage.setItem('tripData', JSON.stringify(trip));
      sessionStorage.setItem('tripData', JSON.stringify(trip)); // Also sync to session
    }
  }, [trip]);

  // 2. Debounced Auto-Correction & Normal Change
  const onInputChange = (e) => {
    handleChange(e);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      handleCityCorrectionAndPrefetch(e.target.value);
    }, 800);
  };

  // 3. Blur Handling
  const onInputBlur = () => {
    setIsDestinationFocused(false);
    handleCityCorrectionAndPrefetch(trip?.destination);
  };

  // 4. Mobile Keyboard "Done/Go" Handling
  const onInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      handleCityCorrectionAndPrefetch(trip?.destination);
    }
  };

  return (
    <div className="destination-input-wrapper" style={{ width: '100%', marginBottom: '10px' }}>
      <label htmlFor="destination" className="input-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Destination</label>
      
      <input
        id="destination"
        type="text"
        name="destination"
        value={trip?.destination || ''}
        onChange={onInputChange}
        onBlur={onInputBlur}
        onKeyDown={onInputKeyDown}
        onFocus={() => setIsDestinationFocused(true)}
        placeholder="Enter a valid city name."
        className="destination-input-box"
        aria-label="Trip Destination"
        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
      />

      {/* 5. Clean Inline Validation & Feedback logic */}
      <div className="feedback-container" style={{ marginTop: '4px', minHeight: '20px' }}>
        
        {!trip?.destination && (
           <span style={{ color: "#d9534f", fontSize: "12px", display: "block" }}>
             Destination is required.
           </span>
        )}

        {isCorrecting && (
           <span style={{ color: "#0275d8", fontSize: "12px", display: "block", fontStyle: "italic" }}>
             ⏳ Correcting city name...
           </span>
        )}

        {showTempWarning && !isCorrecting && trip?.destination && (
           <span style={{ color: "#f0ad4e", fontSize: "12px", display: "block", fontWeight: "bold" }}>
             ⚠️ Temperature data unavailable for this location. A generic list will be generated.
           </span>
        )}
      </div>
    </div>
  );
};

export default DestinationInput;
