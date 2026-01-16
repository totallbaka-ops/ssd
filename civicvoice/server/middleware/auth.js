const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Department = require("../models/Department");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token, not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "department") {
      req.user = await Department.findById(decoded.id).select("-password");
    } else {
      req.user = await User.findById(decoded.id).select("-otp -otpExpires");
    }

    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    res.status(401).json({ message: "Token invalid or expired" });
  }
};
