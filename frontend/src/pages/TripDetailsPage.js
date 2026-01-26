import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TripDetailsPage.css";

const TripDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ show: false, noteIdx: null });


    const handleDeleteNote = async (idx) => {
        const updatedNotes = notes.filter((_, i) => i !== idx);

        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/trips/${id}`,
                { notes: updatedNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotes(updatedNotes);
        } catch (err) {
            console.error("Failed to delete note", err);
        }
    };


    // Photo modal
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [photoEditMode, setPhotoEditMode] = useState(false);// Notes section edit
    const [selectedNotes, setSelectedNotes] = useState([]);



    // Add at top
    const [lightboxOpen, setLightboxOpen] = useState(false);


    // Function to open lightbox
    const openLightbox = (index) => {
        setCurrentPhotoIndex(index);
        setLightboxOpen(true);
    };
    // Navigate photos
    const prevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === 0 ? trip.photos.length - 1 : prev - 1));
    };
    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === trip.photos.length - 1 ? 0 : prev + 1));
    };

    // Close lightbox
    const closeLightbox = () => setLightboxOpen(false);
    const [showAdd, setShowAdd] = useState(false); // toggle add/edit section
    const [notes, setNotes] = useState([]); // <-- initialize as empty

    const [noteText, setNoteText] = useState(""); // current note text input
    const [selectedNoteIndex, setSelectedNoteIndex] = useState(null); // currently selected note
    const [isEditMode, setIsEditMode] = useState(false); // ✅ ADD THIS

    useEffect(() => {
        if (trip && Array.isArray(trip.notes)) {
            setNotes(trip.notes);
        }
    }, [trip]);
    // Open edit mode for selected note

    // Save note (new or edited)
    const handleSaveNote = async () => {
        if (!noteText.trim()) return;

        let updatedNotes = [...notes];

        if (isEditMode && selectedNoteIndex !== null) {
            updatedNotes[selectedNoteIndex] = {
                ...updatedNotes[selectedNoteIndex],
                text: noteText,
                date: new Date().toLocaleString()
            };
        } else {
            updatedNotes.push({
                text: noteText,
                date: new Date().toLocaleString()
            });
        }

        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/trips/${id}`,
                { notes: updatedNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotes(updatedNotes);
            setNoteText("");
            setShowAdd(false);
            setIsEditMode(false);
            setSelectedNoteIndex(null);
        } catch (err) {
            console.error("Failed to save note", err);
        }
    };


    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`http://localhost:5000/api/trips/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTrip(res.data);
                // Ensure notes is always an array
                setNotes(Array.isArray(res.data.notes) ? res.data.notes : []);
            } catch (err) {
                console.error("Failed to fetch trip details", err);
            }
        };
        fetchTripDetails();
    }, [id]);




    if (!trip) return <p>Loading trip details...</p>;

    // -------- Notes Handlers --------


    const handleAddPhotos = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const token = localStorage.getItem("token");
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("photos", files[i]);
        }

        try {
            const res = await axios.put(
                `http://localhost:5000/api/trips/${id}/upload`, // <-- new upload route
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setTrip({ ...trip, photos: res.data.photos });
        } catch (err) {
            console.error("Failed to upload photos", err);
        }
    };




    const openPhotoModal = (idx) => {
        setCurrentPhotoIndex(idx);
        setPhotoModalOpen(true);
    };

    const closePhotoModal = () => setPhotoModalOpen(false);
    const togglePhotoSelect = (index) => {
        setSelectedPhotos((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    const handleDeleteSelectedPhotos = async () => {
        const remainingPhotos = trip.photos.filter(
            (_, index) => !selectedPhotos.includes(index)
        );

        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/trips/${id}`,
                { photos: remainingPhotos },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTrip({ ...trip, photos: remainingPhotos });
            setSelectedPhotos([]);
        } catch (err) {
            console.error("Failed to delete photos", err);
        }
    };

    // Toggle note selection (like photos)
    const toggleNoteSelect = (index) => {
        setSelectedNotes((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    // Delete selected notes
    const handleDeleteSelectedNotes = async () => {
        const remainingNotes = notes.filter((_, idx) => !selectedNotes.includes(idx));
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/trips/${id}`,
                { notes: remainingNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotes(remainingNotes);
            setSelectedNotes([]);
        } catch (err) {
            console.error("Failed to delete notes", err);
        }
    };

    const selectAllPhotos = () => {
        if (!trip.photos) return;
        setSelectedPhotos(trip.photos.map((_, index) => index));
    };





    return (
        <div className="trip-details-page">
            <h1>
                Trip Details of 🌍
                <span style={{ color: "#3a009e", fontWeight: "700" }}>
                    {trip.destination}
                </span>{" "}
                Trip
            </h1>

            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="trip-details-container">
                {/* Trip Basics */}
                <div className="card">
                    <h2>Trip Basics</h2>
                    <p><strong>Destination:</strong> {trip.destination}</p>
                    <p><strong>Start Date:</strong> {trip.startDate || "dd-mm-yyyy"}</p>
                    <p><strong>End Date:</strong> {trip.endDate || "dd-mm-yyyy"}</p>
                    <p><strong>Total Days:</strong> {trip.totalDays}</p>
                    <p><strong>Trip Type:</strong> {trip.tripType || "Solo"}</p>
                </div>

                {/* Travel & Stay */}
                <div className="card">
                    <h2>Travel & Stay</h2>
                    <p><strong>Travel Mode:</strong> {trip.travelMode || "Flight"}</p>
                    <p><strong>Accommodation:</strong> {trip.accommodation || "Hotel"}</p>
                    <p><strong>Room Type:</strong> {trip.roomType || "Private"}</p>
                    <p><strong>Laundry:</strong> {trip.laundry ? "Yes" : "No"}</p>
                    <p><strong>Budget:</strong> {trip.budget || "Medium"}</p>
                </div>

                {/* Lifestyle & Comfort */}
                <div className="card">
                    <h2>Lifestyle & Comfort</h2>
                    <p><strong>Weather Sensitivity:</strong> {trip.weatherSensitivity ?? "Normal"}</p>
                    <p><strong>Activity Level:</strong> {trip.activityLevel ?? "Moderate"}</p>

                    <p><strong>Shopping Plan:</strong> {trip.shopping ? "Yes" : "No"}</p>
                    <p><strong>Photography / Video Gear:</strong> {trip.photographyGear === true ? "Yes" : "No"}</p>
                    <p><strong>Work Laptop:</strong> {trip.workLaptop === true ? "Yes" : "No"}</p>

                </div>

                {/* Food & Health */}
                <div className="card">
                    <h2>Food & Health</h2>

                    <p>
                        <strong>Food Preference:</strong>{" "}
                        {trip.foodPreference ? trip.foodPreference : "No preference"}
                    </p>

                    <p>
                        <strong>Dietary Notes:</strong>{" "}
                        {trip.dietaryNotes && trip.dietaryNotes.trim() !== ""
                            ? trip.dietaryNotes
                            : "-"}
                    </p>

                    <p>
                        <strong>Medical Notes:</strong>{" "}
                        {trip.medicalNotes && trip.medicalNotes.trim() !== ""
                            ? trip.medicalNotes
                            : "-"}
                    </p>
                </div>


                {/* Travelers */}
                <div className="card">
                    <h2>Travelers Information</h2>
                    <p><strong>Kids:</strong> {trip.kids || 0}</p>
                    <p><strong>Elders:</strong> {trip.elders || 0}</p>
                    {trip.peoples && trip.peoples.map((person, index) => (
                        <div key={index} className="traveler-card">
                            <p><strong>Traveler {index + 1}:</strong> {person.name || "None"}</p>
                            <p>Age: {person.age || "None"}</p>
                            <p>Gender: {person.gender || "None"}</p>
                            <p>Medical Notes: {person.medicalNotes || "None"}</p>

                        </div>
                    ))}
                </div>

                {/* Packing List */}
                <div className="card packing-list-card">
                    <h2>Packing List</h2>

                    {trip.packingList && trip.packingList.length > 0 ? (
                        trip.packingList.map((section, idx) => (
                            <div key={section._id || idx} className="packing-section">
                                <h3>{section.category}</h3>

                                <ul>
                                    {section.items.map((item, i) => (
                                        <li key={i}>{item.name}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p>No packing list generated yet.</p>
                    )}
                </div>



                {/* Notes & Learnings */}
                <div className="card notes-card">
                    <div className="notes-header">
                        <h2>Notes & Learnings</h2>
                    </div>

                    {/* Add Note Section */}
                    {showAdd && (
                        <div className="add-note-section">
                            <textarea
                                placeholder="Write your note here..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            />
                            <button className="save-note-btn" onClick={handleSaveNote}>
                                Save Note
                            </button>
                        </div>
                    )}
                    {!showAdd && (
                        <button className="add-note-btn" onClick={() => setShowAdd(true)}>
                            + Add Note
                        </button>
                    )}

                    {/* Notes List */}
                    <div className="notes-container">
                        {notes && notes.length > 0 ? (
                            notes.map((note, idx) => (
                                <div key={idx} className="note-wrapper">
                                    <div className="note-thumb">
                                        {/* X button */}
                                        <button
                                            className="note-delete-btn"
                                            onClick={() => setDeleteModal({ show: true, noteIdx: idx })}
                                        >
                                            ×
                                        </button>

                                        <p>{note.text}</p>
                                        <small>
                                            {new Date(note.date).toLocaleString()}
                                        </small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No notes added yet.</p>
                        )}
                    </div>

                    {/* Custom Delete Modal */}
                    {deleteModal.show && (
                        <div className="delete-modal-overlay">
                            <div className="delete-modal">
                                <p>Are you sure you want to delete this note?</p>
                                <div className="delete-modal-buttons">
                                    <button
                                        className="modal-btn cancel-btn"
                                        onClick={() => setDeleteModal({ show: false, noteIdx: null })}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="modal-btn confirm-btn"
                                        onClick={() => {
                                            handleDeleteNote(deleteModal.noteIdx);
                                            setDeleteModal({ show: false, noteIdx: null });
                                        }}
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>




            </div>

            {/* Photos Section */}
            <div className="card photos-card">
                <div className="photos-header">
                    <h2>Photos</h2>

                    <div style={{ display: "flex", gap: "8px" }}>
                        {photoEditMode && trip.photos?.length > 0 && (
                            <button
                                className="edit-photos-btn"
                                onClick={selectAllPhotos}
                            >
                                Select All
                            </button>
                        )}

                        <button
                            className="edit-photos-btn"
                            onClick={() => {
                                setPhotoEditMode(!photoEditMode);
                                setSelectedPhotos([]);
                            }}
                        >
                            {photoEditMode ? "Cancel" : "Edit"}
                        </button>
                    </div>
                </div>


                {/* Add Photo Button */}
                <label className="add-photo-btn">
                    + Add Photos
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        hidden
                        onChange={handleAddPhotos}
                    />
                </label>

                {photoEditMode && selectedPhotos.length > 0 && (
                    <button className="delete-photo-btn" onClick={handleDeleteSelectedPhotos}>
                        🗑 Delete Selected
                    </button>
                )}

                <div className="photos-container">
                    {trip.photos && trip.photos.length > 0 ? (
                        trip.photos.map((photo, i) => {
                            // Ensure correct URL for image
                            const photoURL = photo.startsWith("http") ? photo : `http://localhost:5000${photo}`;
                            return (
                                <div key={i} className="photo-wrapper">
                                    {photoEditMode && (
                                        <input
                                            type="checkbox"
                                            className="photo-checkbox"
                                            checked={selectedPhotos.includes(i)}
                                            onChange={() => togglePhotoSelect(i)}
                                        />
                                    )}
                                    <img
                                        src={photoURL}
                                        alt={`Trip photo ${i + 1}`}
                                        onClick={() => !photoEditMode && openLightbox(i)}
                                        className="photo-thumb"
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <p>No photos added yet.</p>
                    )}
                </div>











                {/* Lightbox Modal */}
                {lightboxOpen && trip.photos && trip.photos.length > 0 && (
                    <div
                        className="lightbox-overlay"
                        onClick={(e) =>
                            e.target.classList.contains("lightbox-overlay") && closeLightbox()
                        }
                    >
                        <div className="lightbox-content">
                            {/* Close button top-right */}
                            <button className="lightbox-close" onClick={closeLightbox}>
                                X
                            </button>

                            {/* Photo */}
                            <img
                                src={
                                    trip.photos[currentPhotoIndex].startsWith("http")
                                        ? trip.photos[currentPhotoIndex]
                                        : `http://localhost:5000${trip.photos[currentPhotoIndex]}`
                                }
                                alt={`Trip photo ${currentPhotoIndex + 1}`}
                                className="lightbox-photo"
                            />

                            {/* Navigation buttons */}
                            {trip.photos.length > 1 && (
                                <>
                                    <button className="lightbox-prev" onClick={prevPhoto}>
                                        ‹
                                    </button>
                                    <button className="lightbox-next" onClick={nextPhoto}>
                                        ›
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}











            </div>


        </div>

    );
};

export default TripDetailsPage;
