const tripService = require("../services/tripService");

exports.createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.userId, req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

exports.getUserTrips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const tripsResult = await tripService.getUserTrips(req.userId, page, limit);
    res.json({ success: true, ...tripsResult });
  } catch (err) {
    next(err);
  }
};

exports.getTrip = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.userId);
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.userId, req.body);
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.userId);
    res.json({ success: true, message: "Trip deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.uploadPhotos = async (req, res, next) => {
  try {
    const uploadedFiles = req.files.map((file) => file.path);
    const photos = await tripService.uploadPhotos(req.params.id, req.userId, uploadedFiles);
    res.json({ success: true, data: { photos } });
  } catch (err) {
    next(err);
  }
};

exports.updateNotes = async (req, res, next) => {
  try {
    const notes = await tripService.updateNotes(req.params.id, req.userId, req.body.notes);
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};
