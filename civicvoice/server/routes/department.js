const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerDepartment,
  loginDepartment,
  getDepartmentComplaints,
  updateStatus,
  getAllDepartments,
} = require('../controllers/departmentController');

// ⭐ PUT SPECIFIC ROUTES FIRST

// Department login (NO protect middleware - it's a login route!)
router.post('/login', loginDepartment);

// Admin registers a department
router.post('/register', protect, registerDepartment);

// Get assigned complaints
router.get('/complaints/:dept?', protect, getDepartmentComplaints);

// Update complaint status
router.put('/update/:id', protect, updateStatus);

// ⭐ PUT GENERIC ROUTES LAST
// GET /api/department - Get all departments
router.get('/', protect, getAllDepartments);

module.exports = router;