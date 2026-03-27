import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PackingAssistant.css";
import { useNavigate } from "react-router-dom";

export default function PackingAssistant() {
    const [trip, setTrip] = useState(
        {
            destination: "",
            startDate: "",
            endDate: "",
            totalDays: 0,
            tripType: "Solo",

            travelMode: "Flight",
            accommodation: "Hotel",
            roomType: "Private",
            laundry: false,
            budget: "Medium",

            weatherSensitivity: "Normal",
            activityLevel: "Moderate",
            walkingLevel: "Moderate",
            shopping: false,
            photographyGear: false,
            workLaptop: false,
            techUsage: "Light",
            powerAdapter: "No",

            foodPreference: "No preference",
            dietaryNotes: "",
            medicalNotes: "",

            kids: 0,
            elders: 0,

            people: [{ name: "", age: "", gender: "Female", medical: "" }],
        });

    const [packingList, setPackingList] = useState([]);
    const [summary, setSummary] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const navigate = useNavigate();
    // 🔥 RESTORE DATA ON PAGE RELOAD
    useEffect(() => {
        const savedTrip = sessionStorage.getItem("trip");
        const savedPackingList = sessionStorage.getItem("packingList");
        const savedSummary = sessionStorage.getItem("summary");


        if (savedTrip) {
            setTrip(JSON.parse(savedTrip));
        }

        if (savedPackingList) {
            setPackingList(JSON.parse(savedPackingList));
        }

        if (savedSummary) {
            setSummary(savedSummary);
        }
    }, []);
    const calculateDays = (start, end) => {
        if (!start || !end) return 1;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    // 🔥 CLEAR DATA WHEN LEAVING THIS PAGE (route change)
    useEffect(() => {
        return () => {
            sessionStorage.removeItem("trip");
            sessionStorage.removeItem("packingList");
            sessionStorage.removeItem("summary");
        };
    }, []);


    // 🔥 AUTO CALCULATE DAYS
    useEffect(() => {
        if (trip.startDate && trip.endDate) {
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            setTrip(prev => ({ ...prev, totalDays: diff > 0 ? diff : 0 }));
        }
    }, [trip.startDate, trip.endDate]);
    const [formError, setFormError] = useState("");
    const [prefetchedTemp, setPrefetchedTemp] = useState(null);
    const [isCorrectingCity, setIsCorrectingCity] = useState(false);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);
    const [lastCheckedCity, setLastCheckedCity] = useState("");
    const [showTempWarning, setShowTempWarning] = useState(false);

    const handleCityCorrectionAndPrefetch = async (city) => {
        if (!city) return;
        if (city.toLowerCase().trim() === lastCheckedCity.toLowerCase().trim()) return;

        setIsCorrectingCity(true);
        setLastCheckedCity(city);

        try {
            // Send typed city to our backend which uses Groq for instant correction & fetches weather simultaneously
            const weatherRes = await axios.post("https://packmate69.onrender.com/prefetch-weather", { location: city });

            const correctedCity = weatherRes.data.location;
            const temp = weatherRes.data.temperature;

            setTrip(prev => ({ ...prev, destination: correctedCity }));
            setPrefetchedTemp(temp);
            setLastCheckedCity(correctedCity);

            if (temp === null) {
                setShowTempWarning(true);
                setTimeout(() => setShowTempWarning(false), 5000);
            } else {
                setShowTempWarning(false);
            }

        } catch (err) {
            console.error("City correction/prefetch failed:", err);
            // fallback gracefully
            setPrefetchedTemp(null);
            setLastCheckedCity(city);
            setShowTempWarning(true);
            setTimeout(() => setShowTempWarning(false), 5000);
        } finally {
            setIsCorrectingCity(false);
        }
    };

    // Triggered automatically on blur without enter key

    const handleChange = (e, idx = null, field = null) => {
        let { name, value } = e.target;
        let finalValue = value;

        const booleanFields = [
            "shopping",
            "photographyGear",
            "workLaptop",
            "laundry"
        ];

        let fieldName = idx !== null ? field : name;

        if (booleanFields.includes(name)) {
            finalValue = value === "true";
        }

        // 1. Numeric fields (kids, elders, age): ONLY digits
        if (["kids", "elders", "age"].includes(fieldName)) {
            finalValue = String(finalValue).replace(/\D/g, "");
        }

        // 2. Text fields (dietaryNotes, medicalNotes, medical, name, destination): ONLY text (no digits)
        if (["dietaryNotes", "medicalNotes", "medical", "name", "destination"].includes(fieldName)) {
            finalValue = String(finalValue).replace(/\d/g, "");
        }

        // 3. Location Auto-correction and capitalization
        if (fieldName === "destination") {
            let valStr = String(finalValue).toLowerCase();
            const typoMap = {
                "mumbaai": "Mumbai",
                "pune": "Pune",
                "delhi": "Delhi",
                "banglore": "Bangalore",
                "goa": "Goa"
            };

            if (typoMap[valStr]) {
                finalValue = typoMap[valStr];
            } else if (finalValue.length > 0) {
                // capitalize first letter automatically
                finalValue = finalValue.charAt(0).toUpperCase() + finalValue.slice(1);
            }
        }

        if (idx !== null) {
            const people = [...trip.people];
            people[idx][field] = finalValue;
            setTrip({ ...trip, people });
        } else {
            setTrip({ ...trip, [name]: finalValue });
        }
    };



    const addTraveler = () => {
        setTrip({
            ...trip,
            people: [...trip.people, { name: "", age: "", gender: "Female", medical: "" }]
        });
    };

    const generatePackingList = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login", {
                replace: true,
                state: {
                    message: "Please login to generate a packing list"
                }
            });
            return; // ⛔ stop here
        }

        setFormError(""); // Reset error on new action
        if (!trip.destination || !trip.startDate || !trip.endDate) {
            setFormError("⚠️ Please enter destination, start date, and end date before generating your packing list.");
            return;
        }

        setIsLoading(true);
        setFormError("⏳ Please wait, AI is generating your list... (This can take up to 50 seconds on first run)");

        const payload = {
            location: trip.destination || "",
            days: trip.totalDays || 1,
            trip_type: trip.tripType || "Solo",
            purpose: trip.purpose || "Leisure",
            activities: trip.activities || "None",
            stay_type: trip.accommodation || "Hotel",
            budget: trip.budget || "Medium",
            food: trip.foodPreference || "No preference",
            luggage: trip.luggage || "Backpack",
            travel_type: trip.travelMode || "Flight",
            people: trip.people
                .map(
                    (p) =>
                        `${p.name || "Traveler"}, ${p.age || "N/A"} years, ${p.gender || "Female"}, Medical: ${p.medical || "None"}`
                )
                .join("\n"),
            temperature: prefetchedTemp
        };

        try {
            const res = await axios.post(
                "https://packmate69.onrender.com/generate-packing-list",
                payload
            );

            // convert raw list to sections for display
            const formattedList = formatPackingListForDB(res.data.packing_list);

            setPackingList(formattedList);
            setSummary(res.data.summary || "");

        } catch (err) {
            console.error("Generation failed:", err);
            setFormError("❌ Failed to generate packing list. Please try again.");
        } finally {
            setIsLoading(false);
            setFormError(""); // Clear the loading message if successful
        }
    };

    const formatPackingListForDB = (list) => {
        const sections = {};
        let current = "GENERAL";

        list.forEach(line => {
            const text = line.trim();
            if (!text) return;

            if (text === text.toUpperCase() && text.length < 30) {
                current = text;
                sections[current] = [];
            } else {
                if (!sections[current]) sections[current] = [];
                sections[current].push({
                    name: text,
                    quantity: ""
                });
            }
        });

        return Object.entries(sections).map(([category, items]) => ({
            category,
            items
        }));
    };


    const saveTrip = async () => {
        setFormError(""); // reset error
        // ✅ BASIC VALIDATION
        if (!trip.destination || !trip.startDate || !trip.endDate || trip.totalDays <= 0) {
            setFormError("⚠️ Please enter Trip Basics before saving the trip.");
            return;
        }

        if (packingList.length === 0) {
            setFormError("⚠️ Please generate packing list before saving.");
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem("token");

            if (!token) {
                setFormError("⚠️ Please login first.");
                return;
            }

            await axios.post(
                "https://packmate-backend.onrender.com/api/trips",
                {
                    destination: trip.destination,
                    startDate: trip.startDate,
                    endDate: trip.endDate,
                    totalDays: trip.totalDays || calculateDays(trip.startDate, trip.endDate),
                    tripType: trip.tripType,

                    travelMode: trip.travelMode,
                    accommodation: trip.accommodation,
                    roomType: trip.roomType,
                    laundry: trip.laundry,
                    budget: trip.budget,

                    weatherSensitivity: trip.weatherSensitivity,
                    activityLevel: trip.activityLevel,
                    shopping: trip.shopping,
                    photographyGear: trip.photographyGear,
                    workLaptop: trip.workLaptop,

                    foodPreference: trip.foodPreference,
                    dietaryNotes: trip.dietaryNotes,
                    medicalNotes: trip.medicalNotes,

                    kids: trip.kids,
                    elders: trip.elders,

                    peoples: trip.people.map(p => ({
                        name: p.name || "Traveler",
                        age: Number(p.age) || 0,
                        gender: p.gender || "Female",
                        medicalNotes: p.medical || ""   // ✅ map medical input to medicalNotes
                    })),
                    packingList: packingList, // already formatted for DB


                    notes: trip.notes || [],
                    photos: trip.photos || []
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            setFormError("✅ Trip saved successfully!");
        } catch (err) {
            console.error("Save trip failed:", err.response?.data || err.message);
            setFormError("❌ Failed to save trip. Try again.");
        } finally {
            setIsSaving(false);
        }
    };






    const downloadDocx = async () => {
        setFormError(""); // reset error
        if (packingList.length === 0) {
            setFormError("⚠️ Please generate packing list first.");
            return;
        }

        const flatPackingList = [];
        packingList.forEach(section => {
            flatPackingList.push(section.category);
            if (Array.isArray(section.items)) {
                section.items.forEach(item => {
                    flatPackingList.push(item.name || item);
                });
            }
        });

        // Map your React state to backend expected fields
        const payload = {
            summary: summary,
            packing_list: flatPackingList
        };

        try {
            setIsDownloading(true);
            const res = await axios.post(
                "https://packmate69.onrender.com/download-packing-list",
                payload,
                { responseType: "blob" }
            );

            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = "Smart_Packing_List.docx";
            a.click();
        } catch (err) {
            console.error("Download failed:", err);
            setFormError("❌ Failed to download DOCX. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };




    const removeTraveler = (index) => {
        const updated = [...trip.people];
        updated.splice(index, 1);
        setTrip({ ...trip, people: updated });
    };
    // Convert plain packing list into sections
    const parsePackingList = (list) => {
        const sections = {};
        let currentSection = "";

        list.forEach((line) => {
            line = line.trim();
            if (!line) return;

            // Section headers are all uppercase (short text)
            if (line === line.toUpperCase() && line.length < 30) {
                currentSection = line;
                sections[currentSection] = [];
            } else if (currentSection) {
                sections[currentSection].push(line);
            }
        });

        return sections; // { DOCUMENTS: [...], CLOTHING: [...], ... }
    };


    // 🔥 Step 2: Save trip to localStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("trip", JSON.stringify(trip));
    }, [trip]);


    // 🔥 Step 3: Save packingList to localStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("packingList", JSON.stringify(packingList));
    }, [packingList]);

    // 🔥 Step 4: Save summary to localStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("summary", summary);
    }, [summary]);




    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login", {
                    replace: true,
                    state: {
                        message: "Please login to use Packing Assistant"
                    }
                });
            }
        };

        // run immediately
        checkAuth();

        // listen for logout (token removal)
        window.addEventListener("storage", checkAuth);

        return () => window.removeEventListener("storage", checkAuth);
    }, [navigate]);





    return (
        <div className="container">
            <h1>🎒 Smart Packing Assistant</h1>

            {/* TRIP BASICS */}
            <section className="card">
                <h2>Trip Basics</h2>
                <label>Destination</label>
                <input
                    name="destination"
                    value={trip.destination}
                    onChange={handleChange}
                    onFocus={() => setIsDestinationFocused(true)}
                    onBlur={() => {
                        setIsDestinationFocused(false);
                        handleCityCorrectionAndPrefetch(trip.destination);
                    }}
                    placeholder="Enter a valid city name."
                />
                {isCorrectingCity && (
                    <small style={{ color: "#888", display: "block", marginTop: "5px" }}>⏳ Correcting your city name if misspelled... You can continue with your next fields.</small>
                )}
                {showTempWarning && (
                    <small style={{ color: "#d9534f", display: "block", marginTop: "5px" }}>
                        ⚠️ Temperature not available for this location. A generic list will be generated.
                    </small>
                )}

                <div className="grid">
                    <div>
                        <label>Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={trip.startDate}
                            onChange={handleChange}
                        />                    </div>
                    <div>
                        <label>End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={trip.endDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <label>Total Days</label>
                <input value={trip.totalDays} disabled />

                <label>Trip Type</label>
                <select
                    name="tripType"
                    value={trip.tripType}
                    onChange={handleChange}
                >
                    <option>Solo</option>
                    <option>Family</option>
                    <option>Couple</option>
                    <option>Friends</option>
                    <option>Business</option>
                    <option>Adventure</option>
                </select>
            </section>

            {/* TRAVEL & STAY */}
            <section className="card">
                <h2>Travel & Stay</h2>

                <div className="form-row">
                    <label>Travel Mode</label>
                    <select name="travelMode" value={trip.travelMode} onChange={handleChange}>
                        <option>Flight</option>
                        <option>Train</option>
                        <option>Car</option>
                        <option>Bus</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Accommodation</label>
                    <select name="accommodation" value={trip.accommodation} onChange={handleChange}>
                        <option>Hotel</option>
                        <option>Hostel</option>
                        <option>Resort</option>
                        <option>Homestay</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Room Type</label>
                    <select name="roomType" value={trip.roomType} onChange={handleChange}>
                        <option>Private</option>
                        <option>Shared</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Laundry</label>
                    <select name="laundry" value={trip.laundry} onChange={handleChange}>
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Budget</label>
                    <select name="budget" value={trip.budget} onChange={handleChange}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>
            </section>


            {/* LIFESTYLE & COMFORT */}
            <section className="card">
                <h2>Lifestyle & Comfort</h2>

                <div className="form-row">
                    <label>Weather Sensitivity</label>
                    <select
                        name="weatherSensitivity"
                        value={trip.weatherSensitivity}
                        onChange={handleChange}
                    >
                        <option>Normal</option>
                        <option>Cold Sensitive</option>
                        <option>Heat Sensitive</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Activity Level</label>
                    <select
                        name="activityLevel"
                        value={trip.activityLevel}
                        onChange={handleChange}
                    >
                        <option>Low</option>
                        <option>Moderate</option>
                        <option>High</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Shopping Plan</label>
                    <select
                        name="shopping"
                        value={trip.shopping}
                        onChange={handleChange}
                    >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Photography / Video Gear</label>
                    <select
                        name="photographyGear"
                        value={trip.photographyGear}
                        onChange={handleChange}
                    >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Work Laptop</label>
                    <select
                        name="workLaptop"
                        value={trip.workLaptop}
                        onChange={handleChange}
                    >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>
            </section>


            {/* HEALTH & FOOD */}
            <section className="card">
                <h2>Food & Health</h2>

                <div className="form-row">
                    <label>Food Preference</label>
                    <select
                        name="foodPreference"
                        value={trip.foodPreference}
                        onChange={handleChange}
                    >
                        <option>No preference</option>
                        <option>Vegetarian</option>
                        <option>Vegan</option>
                        <option>Non-Veg</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Dietary Notes</label>
                    <input
                        name="dietaryNotes"
                        value={trip.dietaryNotes}
                        placeholder="Allergies, restrictions..."
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <label>Medical Notes (Optional)</label>
                    <input
                        name="medicalNotes"
                        value={trip.medicalNotes}
                        placeholder="Chronic conditions, medications..."
                        onChange={handleChange}
                    />
                </div>
            </section>

            {/* ================= TRAVELERS ================= */}
            <section className="card travelers-card">
                <h2>Travelers Information</h2>

                <div className="travelers-summary">
                    <div>
                        <label>Kids</label>
                        <input
                            type="number"
                            name="kids"
                            min="0"
                            value={trip.kids}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (["e", "E", "+", "-", "."].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label>Elders</label>
                        <input
                            type="number"
                            name="elders"
                            min="0"
                            value={trip.elders}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (["e", "E", "+", "-", "."].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>
                </div>

                {(trip.people || []).map((p, i) => (
                    <div key={i} className="traveler-card">
                        <div className="traveler-header">
                            <h3>Traveler {i + 1}</h3>
                            <button
                                className="remove-traveler-btn"
                                onClick={() => removeTraveler(i)}
                            >
                                X
                            </button>
                        </div>
                        <div className="traveler-fields">
                            <div>
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={p.name}
                                    onChange={e => handleChange(e, i, "name")}
                                />
                            </div>
                            <div>
                                <label>Age</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Age"
                                    value={p.age}
                                    onChange={e => handleChange(e, i, "age")}
                                    onKeyDown={(e) => {
                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label>Gender</label>
                                <select value={p.gender} onChange={e => handleChange(e, i, "gender")}>
                                    <option>Female</option>
                                    <option>Male</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label>Medical Notes</label>
                                <input
                                    type="text"
                                    placeholder="Any medical info"
                                    value={p.medical}
                                    onChange={e => handleChange(e, i, "medical")}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button className="add-traveler-btn" onClick={addTraveler}>
                    + Add Traveler
                </button>
            </section>

            {/* ACTIONS */}
            {formError && (
                <div className={formError.includes("✅") || formError.includes("⏳") ? "form-success-message" : "form-error-message"}>
                    {formError}
                </div>
            )}
            <div className="actions">
                <button
                    onClick={generatePackingList}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                >
                    {isLoading ? "⏳ Generating..." : "🚀 Generate Packing List"}
                </button>
                <button onClick={downloadDocx} disabled={isDownloading} style={{ opacity: isDownloading ? 0.6 : 1, cursor: isDownloading ? "not-allowed" : "pointer" }}>
                    {isDownloading ? "📥 Downloading..." : "📥 Download DOCX"}
                </button>
                <button onClick={saveTrip} disabled={isSaving} style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? "not-allowed" : "pointer" }}>
                    {isSaving ? "💾 Saving..." : "💾 Save Trip"}
                </button>
            </div>

            {packingList.length > 0 && (
                <section className="packing-list">
                    <h2>Packing List</h2>

                    {packingList.length > 0 && packingList.map((section, sectionIdx) => (
                        <div key={section._id || sectionIdx} className="packing-section">
                            <h3>{section.category || "General"}</h3>
                            <div className="packing-items">
                                {Array.isArray(section.items) && section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="packing-item">
                                        {item.name || item} {/* will work even if item is string */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}


                </section>
            )}

        </div>
    );
}
