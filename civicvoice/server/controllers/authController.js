const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const twilio = require("twilio"); // 1. Import Twilio

// 2. Initialize Twilio Client
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const MOBILE_REGEX = /^(\+91)?\s?\d{10}$/;

// 3. REAL OTP Sender (Replaces the Mock)
const sendOTP = async (mobile, otp) => {
  // If we are in "Development" mode and using a specific test number, we can skip cost
  // But to block fake numbers like 1234567890, we must attempt to send.
  
  try {
    // Ensure number has country code for Twilio (Default to India +91 if missing)
    const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

    await client.messages.create({
      body: `Your CivicVoice Verification Code is: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: formattedMobile,
    });
    
    console.log(`✅ SMS sent successfully to ${formattedMobile}`);
  } catch (error) {
    console.error("❌ Twilio SMS Failed:", error.message);
    throw new Error("Invalid mobile number or SMS failed."); // This triggers the catch block below
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// POST /api/auth/request-otp
exports.requestOTP = async (req, res) => {
  console.log("📩 Incoming /request-otp:", req.body);
  try {
    const { mobile } = req.body;

    // 1. Validation
    if (!mobile) return res.status(400).json({ message: "Mobile number required" });
    if (!MOBILE_REGEX.test(mobile)) return res.status(400).json({ message: "Invalid mobile number format" });

    // 2. Block Obvious Dummy Numbers (Optional Extra Layer)
    if (mobile === "1234567890" || mobile === "0000000000") {
       return res.status(400).json({ message: "Please provide a real mobile number." });
    }

    let user = await User.findOne({ mobile });
    if (!user) user = await User.create({ mobile });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.otp = hashedOTP;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // 3. Send Real OTP
    // If this fails (e.g. number is 1234567890), it throws an error
    await sendOTP(mobile, otp);

    res.status(200).json({ message: "OTP sent successfully", mobile });
  } catch (err) {
    console.error("❌ Error in requestOTP:", err.message);
    
    // Send a specific error message to the frontend if it was Twilio that failed
    if (err.message.includes("Invalid mobile") || err.message.includes("SMS failed")) {
        return res.status(400).json({ message: "Could not send SMS. Is the number correct?" });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  console.log("📩 Incoming /verify-otp:", req.body);
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json({ message: "Mobile and OTP required" });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    const isValid = user.otp === hashedOTP && user.otpExpires > Date.now();

    if (!isValid) return res.status(400).json({ message: "Invalid or expired OTP" });

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: { id: user._id, mobile: user.mobile },
    });
  } catch (err) {
    console.error("❌ Error in verifyOTP:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-otp -otpExpires");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};