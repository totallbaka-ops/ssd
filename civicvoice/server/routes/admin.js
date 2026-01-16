const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllComplaints,
  verifyComplaint,
  assignDepartment,
  getAnalytics,
  escalateComplaint,
  resolveComplaint  // 👈 new import
} = require('../controllers/adminController');

// Admin routes
router.get('/complaints', protect, getAllComplaints);
router.put('/verify/:id', protect, verifyComplaint);
router.put('/assign/:id', protect, assignDepartment);
router.put('/escalate/:id', protect, escalateComplaint);
router.put('/resolve/:id', protect, resolveComplaint); // 👈 new route
router.get('/analytics', protect, getAnalytics);

module.exports = router;
