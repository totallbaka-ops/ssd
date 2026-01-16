// routes/media.js

const express = require("express");
const router = express.Router();
// You need 'multer' to handle file uploads
const multer = require("multer");

// Configure multer (e.g., save to disk)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this 'uploads/' folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Define the POST route for '/upload'
// This will be combined with '/api/media' in server.js
// Final path: /api/media/upload
router.post("/upload", upload.single("file"), (req, res) => {
  // 'upload.single("file")' is the middleware that handles the file
  // 'file' must match the key name from your frontend FormData
  
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Send back the path to the file
  res.status(200).json({
    message: "File uploaded successfully",
    filePath: `/uploads/${req.file.filename}`, // The path to access the file
  });
});

module.exports = router;