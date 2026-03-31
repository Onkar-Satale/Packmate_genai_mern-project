const authService = require("../services/authService");
const ApiError = require("../utils/ApiError");

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) return next(new ApiError(400, "User already exists"));

    const user = await authService.registerUser({ firstName, lastName, email, password });
    
    const token = authService.generateAuthToken(user._id);
    const refreshToken = authService.generateRefreshToken(user._id);
    await authService.storeRefreshToken(user._id, refreshToken);
    
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        token,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.findUserByEmail(email);
    if (!user) return next(new ApiError(401, "Invalid credentials"));

    const isMatch = await authService.verifyPassword(password, user);
    if (!isMatch) return next(new ApiError(401, "Invalid credentials"));

    const token = authService.generateAuthToken(user._id);
    const refreshToken = authService.generateRefreshToken(user._id);
    await authService.storeRefreshToken(user._id, refreshToken);
    
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: {
        token,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return next(new ApiError(401, "No refresh token available"));
    
    const decoded = authService.verifyRefreshToken(refreshToken);
    const user = await authService.findUserById(decoded.userId).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return next(new ApiError(401, "Invalid refresh token"));
    }
    
    const token = authService.generateAuthToken(user._id);
    res.json({ success: true, data: { token } });
  } catch(err) {
    next(new ApiError(401, "Refresh token expired or invalid"));
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      try {
        const decoded = authService.verifyRefreshToken(refreshToken);
        await authService.clearRefreshToken(decoded.userId);
      } catch (e) {
        // Ignore token expiration issues during logout
      }
    }
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch(err) {
    next(err);
  }
};

