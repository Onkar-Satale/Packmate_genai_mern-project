const Trip = require("./models/Trip");
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/packmate", { useNewUrlParser: true, useUnifiedTopology: true });

async function fixTrips() {
  const trips = await Trip.find({});
  for (let trip of trips) {
    let changed = false;
    if (!Array.isArray(trip.notes)) { trip.notes = []; changed = true; }
    if (!Array.isArray(trip.people)) { trip.people = []; changed = true; }
    if (!Array.isArray(trip.photos)) { trip.photos = []; changed = true; }
    if (changed) await trip.save();
  }
  console.log("All trips fixed ✅");
  process.exit();
}

fixTrips();
