const axios = require('axios');
const ApiError = require('../utils/ApiError');

const genaiUrl = process.env.GENAI_SERVICE_URL || 'http://localhost:5001';
const genaiApiSecret = process.env.GENAI_API_SECRET || '';

exports.prefetchWeather = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/prefetch-weather`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.data.detail || 'GenAI Error', err.response.status));
    }
    next(new ApiError('Failed to communicate with GenAI service', 500));
  }
};

exports.generatePackingList = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/generate-packing-list`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.data.detail || 'GenAI Error', err.response.status));
    }
    next(new ApiError('Failed to communicate with GenAI service', 500));
  }
};

exports.downloadPackingList = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/download-packing-list`, req.body, {
      headers: { 'x-api-key': genaiApiSecret },
      responseType: 'stream'
    });
    
    // Pass headers specific to the file download from FastAPI
    res.set({
      'Content-Disposition': response.headers['content-disposition'],
      'Content-Type': response.headers['content-type'],
    });

    response.data.pipe(res);
  } catch (err) {
    if (err.response) {
      return next(new ApiError(err.response.data.detail || 'GenAI Error', err.response.status));
    }
    next(new ApiError('Failed to communicate with GenAI service', 500));
  }
};
