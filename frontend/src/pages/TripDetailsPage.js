import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./TripDetailsPage.css";

const TripDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ show: false, noteIdx: null });
    const [isUploading, setIsUploading] = useState(false);
    const [isTickingMode, setIsTickingMode] = useState(false);
    const [draftPackingList, setDraftPackingList] = useState([]);
    const [isSavingPackingList, setIsSavingPackingList] = useState(false);


    const handleDeleteNote = async (idx) => {
        const updatedNotes = notes.filter((_, i) => i !== idx);
        try {
            await api.put(`/trips/${id}`, { notes: updatedNotes });
            setNotes(updatedNotes);
            toast.success("Note deleted successfully");
        } catch (err) {
            console.error("Failed to delete note", err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || "Failed to delete note");
        }
    };

    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [photoEditMode, setPhotoEditMode] = useState(false);
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
    const noteTextRef = useRef(null); // Fix for Android predictive text swallowing React state
    
    // const [noteText, setNoteText] = useState(""); // current note text input
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
        if (!noteTextRef.current) return;
        
        const currentText = noteTextRef.current.value;
        if (!currentText.trim()) return;

        noteTextRef.current.value = "";
        setShowAdd(false);

        let updatedNotes = [...notes];
        if (isEditMode && selectedNoteIndex !== null) {
            updatedNotes[selectedNoteIndex] = { ...updatedNotes[selectedNoteIndex], text: currentText, date: new Date().toLocaleString() };
        } else {
            updatedNotes.push({ text: currentText, date: new Date().toLocaleString() });
        }

        try {
            await api.put(`/trips/${id}`, { notes: updatedNotes });
            setNotes(updatedNotes);
            setIsEditMode(false);
            setSelectedNoteIndex(null);
            toast.success("Note saved successfully!");
        } catch (err) {
            console.error("Failed to save note", err);
            toast.error(err.response?.data?.message || "Failed to save note");
        }
    };

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const res = await api.get(`/trips/${id}`);
                setTrip(res.data?.data || null);
                setNotes(Array.isArray(res.data?.data?.notes) ? res.data.data.notes : []);
            } catch (err) {
                console.error("Failed to fetch trip details", err);
                toast.error(err.response?.data?.message || "Failed to fetch trip details");
            }
        };
        fetchTripDetails();
    }, [id]);

    if (!trip) return <p>Loading trip details...</p>;

    // -------- Notes Handlers --------


    const handleAddPhotos = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("photos", file));

        try {
            const res = await api.put(`/trips/${id}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setTrip({ ...trip, photos: res.data?.data?.photos || [] });
            toast.success("Photos uploaded successfully!");
        } catch (err) {
            console.error("Failed to upload photos", err);
            toast.error(err.response?.data?.message || "Failed to upload photos");
        } finally {
            setIsUploading(false);
        }
    };

    const togglePhotoSelect = (index) => {
        setSelectedPhotos((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleDeleteSelectedPhotos = async () => {
        const remainingPhotos = trip.photos.filter((_, index) => !selectedPhotos.includes(index));

        try {
            await api.put(`/trips/${id}`, { photos: remainingPhotos });
            setTrip({ ...trip, photos: remainingPhotos });
            setSelectedPhotos([]);
            toast.success("Photos deleted successfully!");
        } catch (err) {
            console.error("Failed to delete photos", err);
            toast.error(err.response?.data?.message || "Failed to delete photos");
        }
    };

    const selectAllPhotos = () => {
        if (!trip.photos) return;
        setSelectedPhotos(trip.photos.map((_, index) => index));
    };

    const handleStartTicking = () => {
        setDraftPackingList(structuredClone(trip.packingList));
        setIsTickingMode(true);
    };

    const handleCancelTicking = () => {
        setIsTickingMode(false);
        setDraftPackingList([]);
    };

    const handleResetTicking = () => {
        const updatedDraft = draftPackingList.map(section => ({
            ...section,
            items: section.items.map(item => {
                if (typeof item === "string") return { name: item, completed: false };
                return { ...item, completed: false };
            })
        }));
        setDraftPackingList(updatedDraft);
    };

    const handleSaveTicking = async () => {
        try {
            setIsSavingPackingList(true);
            await api.put(`/trips/${id}`, { packingList: draftPackingList });
            setTrip({ ...trip, packingList: draftPackingList });
            setIsTickingMode(false);
            toast.success("Packing list saved!");
        } catch (err) {
            console.error("Failed to save packing list", err);
            toast.error(err.response?.data?.message || "Failed to save packing list");
        } finally {
            setIsSavingPackingList(false);
        }
    };

    const handleToggleDraftItem = (sectionIdx, itemIdx) => {
        const updatedDraft = [...draftPackingList];
        const items = [...updatedDraft[sectionIdx].items];
        if (typeof items[itemIdx] === "string") {
            items[itemIdx] = { name: items[itemIdx], completed: true };
        } else {
            items[itemIdx] = { ...items[itemIdx], completed: !items[itemIdx].completed };
        }
        updatedDraft[sectionIdx] = { ...updatedDraft[sectionIdx], items };
        setDraftPackingList(updatedDraft);
    };    return (
        <div className="trip-details-page">
            <ToastContainer position="top-right" autoClose={3000} />
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                        <h2 style={{ margin: 0 }}>Packing List</h2>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {!isTickingMode ? (
                                <button className="edit-photos-btn" onClick={handleStartTicking} style={{ backgroundColor: "#3a009e", color: "white", borderColor: "#3a009e" }}>
                                    ✅ Start Ticking
                                </button>
                            ) : (
                                <>
                                    <button className="edit-photos-btn" onClick={handleResetTicking} style={{ borderColor: "#f97316", color: "#f97316" }}>
                                        🔄 Refresh
                                    </button>
                                    <button className="edit-photos-btn" onClick={handleCancelTicking}>
                                        ❌ Cancel
                                    </button>
                                    <button className="edit-photos-btn" onClick={handleSaveTicking} style={{ backgroundColor: "#10b981", color: "white", borderColor: "#10b981", opacity: isSavingPackingList ? 0.6 : 1, cursor: isSavingPackingList ? "not-allowed" : "pointer" }} disabled={isSavingPackingList}>
                                        {isSavingPackingList ? "💾 Saving..." : "💾 Save"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {trip.packingList && trip.packingList.length > 0 ? (
                        (isTickingMode ? draftPackingList : trip.packingList).map((section, idx) => (
                            <div key={section._id || idx} className="packing-section">
                                <h3>{section.category}</h3>

                                <ul>
                                    {section.items.map((item, i) => {
                                        const isCompleted = typeof item === "string" ? false : item.completed;
                                        // Remove any stray newlines from generated item text to prevent wrapping
                                        const itemName = typeof item === "string" ? item.replace(/\n/g, ' ') : item.name.replace(/\n/g, ' ');
                                        return (
                                            <li key={i} style={{ 
                                                display: "flex", 
                                                justifyContent: "flex-start", 
                                                alignItems: "center", 
                                                gap: "10px", 
                                                marginBottom: "8px",
                                                textAlign: "left",
                                                width: "100%"
                                            }}>
                                                {isTickingMode && (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isCompleted} 
                                                        onChange={() => handleToggleDraftItem(idx, i)} 
                                                        style={{ margin: 0, flexShrink: 0, cursor: "pointer", width: "18px", height: "18px" }}
                                                    />
                                                )}
                                                <span style={{ 
                                                    textDecoration: isCompleted ? "line-through" : "none", 
                                                    color: isCompleted ? "#888" : "#333",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    textAlign: "left",
                                                }}>
                                                    {itemName}
                                                </span>
                                            </li>
                                        );
                                    })}
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
                                ref={noteTextRef}
                                defaultValue={""}
                            />
                            <button 
                                className="save-note-btn" 
                                onPointerDown={(e) => e.preventDefault()}
                                onClick={handleSaveNote}
                            >
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
                <label className="add-photo-btn" style={{ opacity: isUploading ? 0.6 : 1, pointerEvents: isUploading ? "none" : "auto" }}>
                    {isUploading ? "Uploading..." : "+ Add Photos"}
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={isUploading}
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
                            const baseURL = process.env.REACT_APP_API_URL?.replace("/api", "") || "";
                            const photoURL = photo.startsWith("http") ? photo : `${baseURL}${photo}`;
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
                                        : `${process.env.REACT_APP_API_URL?.replace("/api", "") || ""}${trip.photos[currentPhotoIndex]}`
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
