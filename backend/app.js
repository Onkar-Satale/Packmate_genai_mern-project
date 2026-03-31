const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require("path");

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://YOUR-DEPLOYED-FRONTEND-LINK.com", // Fallback defaults to deployment directly
  credentials: true
}));

// 2. Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser()); // Enable HTTP-only cookie parsing
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// OpenAPI / Swagger Documentation
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
try {
  const swaggerDocument = YAML.load(path.join(__dirname, "docs/swagger.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.error("Failed to load swagger.yaml", e);
}

// 3. Activity Logging
app.use(morgan("dev"));

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, 
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api/", apiLimiter);

// 5. Mount API Routes
app.use('/api', authRoutes);
app.use('/api/trips', tripRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Backend is running securely' });
});

// 6. Centralized Error Pipeline
app.use(errorHandler);

module.exports = app;
