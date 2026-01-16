// server.js
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const mediaRoutes = require("./routes/media"); // <--- ADD THIS LINE

dotenv.config();

const app = express();

// -----------------------
// Basic middleware
// -----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------
// Request logger (dev)
// -----------------------
app.use((req, res, next) => {
  console.log("🟢 Incoming request:", req.method, req.url, "from:", req.headers.origin || req.ip);
  next();
});

// -----------------------
// CORS - configured for Vite dev server by default
// -----------------------
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Ensure preflight (OPTIONS) are handled for all routes
app.options("*", cors());

// -----------------------
// Static uploads folder
// -----------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -----------------------
// MongoDB connection
// -----------------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/civicvoice";
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((conn) => { // <-- Receive 'conn' here
    console.log("✅ MongoDB connected");

    // This line goes INSIDE the curly braces
    console.log(`✅✅✅ SERVER CONNECTED TO DATABASE: ${conn.connection.db.databaseName}`);
  }) // <-- The ')' for .then() goes here
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -----------------------
// Routes (keep existing route files)
// -----------------------
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");
const departmentRoutes = require("./routes/department");

// Register routes AFTER CORS and body parsers
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/ai", require("./routes/ai")); // <--- ADD AI ROUTES

// -----------------------
// Escalation scheduler (if you have it)
// -----------------------
try {
  const scheduleEscalationJob = require("./utils/escalationScheduler");
  if (typeof scheduleEscalationJob === "function") {
    scheduleEscalationJob();
    console.log("🔁 Escalation scheduler started (if configured).");
  }
} catch (e) {
  console.warn("⚠️ Escalation scheduler not loaded:", e.message);
}

// -----------------------
// Health checks
// -----------------------
app.get("/test", (req, res) => {
  res.status(200).json({ message: "Backend accessible ✅" });
});

app.get("/", (req, res) => {
  res.send("CivicVoice backend is running 🚀");
});

// -----------------------
// 404 handler
// -----------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (frontend origin: ${FRONTEND_ORIGIN})`));
