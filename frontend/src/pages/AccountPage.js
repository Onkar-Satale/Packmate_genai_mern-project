import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./AccountPage.css";

const AccountPage = () => {
    const { user } = useContext(AuthContext); // ✅ REAL USER
    const [trips, setTrips] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // ✅ delete modal state (ADDED)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);

    // ---------------- FETCH TRIPS ----------------
    const fetchTrips = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get("http://localhost:5000/api/trips", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTrips(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch trips", err);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    // ---------------- DELETE TRIP (CONFIRMED) ----------------
    const confirmDeleteTrip = async () => {
        if (!tripToDelete) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/trips/${tripToDelete}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // ✅ remove card instantly
            setTrips((prev) => prev.filter((t) => t._id !== tripToDelete));

            setShowDeleteModal(false);
            setTripToDelete(null);
        } catch (err) {
            console.error("Failed to delete trip", err);
        }
    };

    // ---------------- SEE DETAILS ----------------
    const handleSeeDetails = (tripId) => {
        navigate(`/trip/${tripId}`);
    };

    // ---------------- FILTER ----------------
    const filteredTrips = trips.filter((trip) =>
        trip.destination?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ---------------- AUTH CHECK ----------------
    if (!user) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>Please login to view your account</h2>
            </div>
        );
    }

    return (
        <div className="account-page-container">
            <div className="account-page-content">

                {user && (
                    <h1>
                        Welcome, {user.firstName} {user.lastName} !
                    </h1>
                )}




                {/* Search */}
                <div className="trip-search">
                    <input
                        type="text"
                        placeholder="Search trips by destination..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <h2>Your Trips</h2>
                <p><strong>Total Trips:</strong> {trips.length}</p>

                <br></br>

                {filteredTrips.length === 0 && (
                    <p>You haven't planned any trips yet.</p>
                )}

                <div className="trip-cards">
                    {filteredTrips.map((trip) => (
                        <div key={trip._id} className="trip-card">

                            {/* ❌ DELETE BUTTON (UPDATED) */}
                            <button
                                className="delete-trip-btn"
                                onClick={() => {
                                    setTripToDelete(trip._id);
                                    setShowDeleteModal(true);
                                }}
                            >
                                X
                            </button>

                            <h3>🌍 {trip.destination}</h3>
                            <p><strong>🗓️ Start Date:</strong> {trip.startDate}</p>
                            <p><strong>🗓️ End Date:</strong> {trip.endDate}</p>
                            <p><strong>🗓️ Total Days:</strong> {trip.totalDays}</p>
                            <p><strong>👤 Trip Type:</strong> {trip.tripType || "Solo"}</p>
                            <p><strong>✈️ Travel:</strong> {trip.travelMode || "Flight"}</p>
                            <p><strong>🏨 Stay:</strong> {trip.accommodation || "Hotel"}</p>
                            <p><strong>💰 Budget:</strong> {trip.budget || "Medium"}</p>

                            <button
                                className="details-btn"
                                onClick={() => handleSeeDetails(trip._id)}
                            >
                                See Details
                            </button>
                        </div>
                    ))}
                </div>

            </div>

            {/* ✅ CUSTOM DELETE MODAL */}
            {showDeleteModal && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete Trip?</h3>
                        <p>This action cannot be undone.</p>

                        <div className="delete-modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setTripToDelete(null);
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-delete-btn"
                                onClick={confirmDeleteTrip}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPage;
