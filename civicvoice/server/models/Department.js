const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'department'], default: 'department' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Department', departmentSchema);
