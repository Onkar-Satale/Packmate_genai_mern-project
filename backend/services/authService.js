const User = require("../models/User");
const jwt = require("jsonwebtoken");

class AuthService {
  async findUserByEmail(email) {
    // Explicitly select password for querying since we set 'select: false' in the Schema
    return await User.findOne({ email }).select("+password");
  }

  async findUserById(userId) {
    return await User.findById(userId);
  }

  async registerUser(userData) {
    // Password hashing is now intercepted inherently by User.js
    const user = await User.create(userData);
    return user;
  }

  async verifyPassword(plainPassword, user) {
    return await user.comparePassword(plainPassword);
  }

  generateAuthToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // Short-lived access token
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'refresh_fallback',
      { expiresIn: "7d" } // Long-lived refresh token
    );
  }

  async storeRefreshToken(userId, token) {
    return await User.findByIdAndUpdate(userId, { refreshToken: token });
  }

  async clearRefreshToken(userId) {
    return await User.findByIdAndUpdate(userId, { $unset: { refreshToken: "" } });
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_fallback');
  }
}

module.exports = new AuthService();
