const express = require("express");
const router = express.Router();
const {
  requestOTP,
  verifyOTP,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

console.log("✅ Auth routes loaded");

// Public routes
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);

// Protected route
router.get("/me", protect, getMe);

module.exports = router;
