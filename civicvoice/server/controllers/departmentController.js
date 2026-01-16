const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // 👈 ADD THIS LINE

// 🧩 Register department (Admin only)
// 🧩 Register department (Admin only)
exports.registerDepartment = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // ---
    // ⬇️ FIXED: Clean the email before searching or saving
    // ---
    const cleanEmail = email.trim().toLowerCase();

    const existing = await Department.findOne({ email: cleanEmail }); // <-- Use cleaned email
    if (existing) return res.status(400).json({ message: 'Department already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const department = await Department.create({
      name,
      email: cleanEmail, // <-- Save cleaned email
      phone,
      password: hashedPassword,
    });
       
    console.log('Department created:', department);

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (err) {
    res.status(500).json({ message: 'Error registering department', error: err.message });
  }
};

// 🔐 Department login
// 🔐 Department login
exports.loginDepartment = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`[LOGIN ATTEMPT] Received email: "${email}"`);

    if (!email) {
       console.log("[LOGIN FAILED] Email was empty.");
       return res.status(400).json({ message: 'Email is required' });
    }

    const searchEmail = email.trim().toLowerCase();
    console.log(`[LOGIN ATTEMPT] Searching for email: "${searchEmail}"`);

    // ---
    // ⬇️ MODIFIED QUERY: We are bypassing the Mongoose model
    //    and querying the collection directly to find the bug.
    // ---
    const department = await mongoose.connection.db.collection('departments').findOne({ email: searchEmail });


    console.log(`[LOGIN ATTEMPT] Direct query found: ${department ? department.email : 'null'}`);

    if (!department) {
      console.log(`[LOGIN FAILED] User not found in 'departments' collection.`);
      return res.status(400).json({ message: 'Department not found' });
    }

    const isMatch = await bcrypt.compare(password, department.password);
    if (!isMatch) {
      console.log(`[LOGIN FAILED] Password mismatch for: "${searchEmail}"`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: department._id, role: 'department', name: department.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`[LOGIN SUCCESS] Token generated for: "${searchEmail}"`);
    res.json({ message: 'Login successful', token });

  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

// 📋 Get complaints assigned to department
exports.getDepartmentComplaints = async (req, res) => {
  try {
    const departmentName = req.user.name || req.params.dept;
    const complaints = await Complaint.find({ assignedDepartment: departmentName })
      .sort({ createdAt: -1 })
      .populate('reporter', 'mobile');

    res.json({ complaints });
  } catch (err)
 {
  res.status(500).json({ message: 'Error fetching department complaints', error: err.message });  }
};

// 🔄 Update complaint status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    await complaint.save();

    res.json({ message: `Status updated to ${status}`, complaint });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

// ----------------------------------------------------
// ✅ NEW FUNCTION ADDED
// ----------------------------------------------------
/**
 * @desc    Get all departments (for Admin Dashboard)
 * @route   GET /api/department
 * @access  Protected/Admin
 */
exports.getAllDepartments = async (req, res) => {
  try {
    // Find all departments, select only the fields needed for the dashboard
    const departments = await Department.find({}, 'name email phone'); 
    res.status(200).json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};