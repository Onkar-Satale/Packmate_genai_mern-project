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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ✅ delete modal state (ADDED)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ---------------- FETCH TRIPS ----------------
    const fetchTrips = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const API = process.env.REACT_APP_API_URL;
            const res = await axios.get(`${API}/api/trips`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTrips(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch trips", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                setError("Failed to load trips. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    // ---------------- DELETE TRIP (CONFIRMED) ----------------
    const confirmDeleteTrip = async () => {
        if (!tripToDelete) return;

        setIsDeleting(true);

        try {
            const token = localStorage.getItem("token");

            const API = process.env.REACT_APP_API_URL;
            await axios.delete(
                `${API}/api/trips/${tripToDelete}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // ✅ remove card instantly
            setTrips((prev) => prev.filter((t) => t._id !== tripToDelete));

            setShowDeleteModal(false);
            setTripToDelete(null);
        } catch (err) {
            console.error("Failed to delete trip", err);
        } finally {
            setIsDeleting(false);
        }
    };

    // ---------------- SEE DETAILS ----------------
    const handleSeeDetails = (tripId) => {
        navigate(`/trip/${tripId}`);
    };

    // ---------------- FILTER ----------------
    const filteredTrips = trips.filter((trip) =>
        (trip.destination || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ---------------- AUTH CHECK ----------------
    if (!user) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>Please login to view your account</h2>
            </div>
        );
    }

    if (loading) return <p>Loading trips...</p>;

    return (
        <div className="account-page-container">
            <div className="account-page-content">

                {user && (
                    <h1>
                        Welcome, {user.firstName} {user.lastName} !
                    </h1>
                )}

                {error && <p className="error-message" style={{ color: "red", textAlign: "center" }}>{error}</p>}

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

                            <h3>🌍 {trip.destination || "Unknown"}</h3>
                            <p><strong>🗓️ Start Date:</strong> {new Date(trip.startDate).toLocaleDateString()}</p>
                            <p><strong>🗓️ End Date:</strong> {new Date(trip.endDate).toLocaleDateString()}</p>
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
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPage;
