const mongoose = require("mongoose");

const TravelerSchema = new mongoose.Schema({
  name: { type: String },  // <-- add this
  age: Number,
  gender: String,
  medicalNotes: String
});

const PackingItemSchema = new mongoose.Schema({
  name: String,
  quantity: String
});

const PackingCategorySchema = new mongoose.Schema({
  category: String,
  items: [PackingItemSchema]
});

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // -------- Trip Basics --------
  destination: { type: String, required: true },
  startDate: String,
  endDate: String,
  totalDays: Number,
  tripType: String,

  // -------- Travel & Stay --------
  travelMode: String,
  accommodation: String,
  roomType: String,
  laundry: Boolean,
  budget: String,

  // -------- Lifestyle --------
  weatherSensitivity: String,
  activityLevel: String,
  shopping: Boolean,
  photographyGear: Boolean,
  workLaptop: Boolean,

  // -------- Food & Health --------
  foodPreference: String,
  dietaryNotes: String,
  medicalNotes: String,

  // -------- Travelers --------
  kids: Number,
  elders: Number,
  peoples: [TravelerSchema],

  // -------- Packing --------
  packingList: [PackingCategorySchema],

  // -------- Notes & Photos --------
  notes: [
    {
      text: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  photos: [String],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Trip", TripSchema);
