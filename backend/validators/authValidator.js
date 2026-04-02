const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, errorMsg));
  }
  next();
};

const registerValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").optional().trim(),
  body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  validateRequest,
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

module.exports = {
  registerValidator,
  loginValidator,
  validateRequest
};
