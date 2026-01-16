const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  getPublicComplaints,
  upvoteComplaint,
  rateComplaint,
  getMyComplaints, // 👈 1. IMPORT THE NEW FUNCTION
} = require('../controllers/complaintController');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ✅ Create complaint (Protected)
router.post('/', protect, upload.array('media', 5), createComplaint);

// ✅ Public complaint map data — put BEFORE /:id
router.get('/public/list', getPublicComplaints);

router.get('/my-complaints', protect, getMyComplaints); // 👈 2. PROTECTED ROUTE FOR USER'S COMPLAINTS

// ✅ Get all complaints
router.get('/', getAllComplaints);

// ✅ Get specific complaint by ID
router.get('/:id', getComplaintById);

// ✅ Upvote complaint
router.post('/:id/upvote', protect, upvoteComplaint);

// ✅ Rate complaint
router.post('/:id/rate', protect, rateComplaint);

module.exports = router;
