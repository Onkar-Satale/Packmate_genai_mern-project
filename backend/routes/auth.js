const express = require("express");
const { register, login, refreshToken, logout } = require("../controllers/authController");
const { registerValidator, loginValidator } = require("../validators/authValidator");

const router = express.Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

module.exports = router;
