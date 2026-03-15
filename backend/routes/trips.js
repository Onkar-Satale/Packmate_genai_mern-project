const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// ✅ SAVE TRIP
router.post("/", auth, async (req, res) => {
  try {
    const body = req.body;

    const tripData = {
      userId: req.userId,

      // Required
      destination: body.destination || body.location,
      startDate: body.startDate,
      endDate: body.endDate,
      totalDays: body.totalDays || body.days,
      tripType: body.tripType,

      travelMode: body.travelMode,
      accommodation: body.accommodation,
      roomType: body.roomType,
      laundry: body.laundry === true || body.laundry === "Yes",
      budget: body.budget,

      shopping: body.shopping === true || body.shopping === "Yes",
      photographyGear: body.photographyGear === true || body.photographyGear === "Yes",
      workLaptop: body.workLaptop === true || body.workLaptop === "Yes",

      weatherSensitivity: body.weatherSensitivity || "Normal",
      activityLevel: body.activityLevel || "Moderate",
      foodPreference: body.foodPreference || "No preference",
      dietaryNotes: body.dietaryNotes || "",
      medicalNotes: body.medicalNotes || "",

      // Travelers
      kids: Number(body.kids) || 0,
      elders: Number(body.elders) || 0,
      peoples: body.peoples || [],

      // Notes (FIXED)
      notes: Array.isArray(body.notes) ? body.notes : [],

      // Packing List (SAFE FIX)
      packingList: Array.isArray(body.packingList)
        ? body.packingList.filter(p => typeof p === "object")
        : [],

      photos: body.photos || []
    };

    const trip = new Trip(tripData);
    await trip.save();

    res.status(201).json(trip);

  } catch (err) {
    console.error("SAVE TRIP ERROR 👉", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET USER'S TRIPS
router.get("/", auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 }); // ✅ req.userId
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// ✅ GET SINGLE TRIP
router.get("/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

// ✅ UPDATE TRIP
router.put("/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update trip" });
  }

});

// ✅ DELETE TRIP  ✅✅✅ (FIXED)
router.delete("/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await trip.deleteOne();
    res.json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

// Set storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // save to backend/uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ✅ UPLOAD PHOTOS
router.put("/:id/upload", auth, upload.array("photos"), async (req, res) => {
  try {
    const uploadedFiles = req.files.map(
      (file) => `/uploads/${file.filename}`
    );

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $push: { photos: { $each: uploadedFiles } } },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json({ photos: trip.photos });
  } catch (err) {
    console.error("UPLOAD PHOTOS ERROR 👉", err);
    res.status(500).json({ error: err.message });
  }
});




// ✅ ADD / UPDATE NOTES FOR A TRIP
router.put("/:id/notes", auth, async (req, res) => {
  try {
    const { notes } = req.body;

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { notes },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(trip.notes);
  } catch (err) {
    console.error("UPDATE NOTES ERROR 👉", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
