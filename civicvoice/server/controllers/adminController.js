// backend/controllers/adminController.js
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// 🧩 Twilio client setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// --- 📧 DEPARTMENT EMAIL DIRECTORY ---
// Map the dropdown names to actual email addresses.
// For testing, we send ALL emails to your main EMAIL_USER so you can verify they work.
const DEPARTMENT_EMAILS = {
  "Water Supply Department": process.env.EMAIL_USER, // Change to real email later
  "Sanitation & Waste": process.env.EMAIL_USER,
  "Roads & Traffic": process.env.EMAIL_USER,
  "Electricity Board": process.env.EMAIL_USER,
  "General Administration": process.env.EMAIL_USER,
  "Health Department": process.env.EMAIL_USER
};

// ✅ GET /api/admin/complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err);
    res.status(500).json({ message: 'Error fetching complaints', error: err.message });
  }
};

// ✅ PUT /api/admin/verify/:id
exports.verifyComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'verified';
    await complaint.save();

    res.json({ message: 'Complaint verified successfully', complaint });
  } catch (err) {
    console.error("❌ Error verifying complaint:", err);
    res.status(500).json({ message: 'Error verifying complaint', error: err.message });
  }
};

// ✅ PUT /api/admin/assign/:id
// This is where the forwarding email logic happens
exports.assignDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('reporter', 'mobile email');
    
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // 1. Update Database
    complaint.assignedDepartment = department;
    complaint.status = 'forwarded';
    await complaint.save();

    console.log(`✅ Complaint ${complaint.complaintId} assigned to ${department}`);

    // 2. Send Email to the Department
    const targetEmail = DEPARTMENT_EMAILS[department];
    
    if (targetEmail) {
      await sendDepartmentNotification(targetEmail, department, complaint);
    } else {
      console.warn(`⚠️ No email found for department: ${department}`);
    }

    res.json({
      message: `Complaint forwarded to ${department}`,
      complaint,
    });
  } catch (err) {
    console.error("❌ Error assigning department:", err);
    res.status(500).json({ message: 'Error assigning department', error: err.message });
  }
};

// ✅ PUT /api/admin/escalate/:id
exports.escalateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'forwarded'; 
    complaint.assignedDepartment = "General Administration"; 
    await complaint.save();

    res.json({
      message: 'Complaint manually escalated',
      complaint,
    });
  } catch (err) {
    console.error("❌ Error escalating complaint:", err);
    res.status(500).json({ message: 'Error escalating complaint', error: err.message });
  }
};

// ✅ PUT /api/admin/resolve/:id
exports.resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('reporter', 'mobile email');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'resolved';
    await complaint.save();

    console.log('✅ Complaint marked as resolved:', complaint.complaintId);

    // Notify User via Email
    if (complaint.reporter?.email) {
      await sendEmailNotification(
        complaint.reporter.email,
        complaint.complaintId,
        complaint.issueType,
        complaint.locationText
      );
    }

    // Notify User via SMS
    if (complaint.reporter?.mobile) {
      await sendSMSNotification(
        complaint.reporter.mobile,
        complaint.complaintId,
        complaint.issueType
      );
    }

    res.json({
      message: 'Complaint resolved successfully',
      complaint,
    });
  } catch (err) {
    console.error("❌ Error resolving complaint:", err);
    res.status(500).json({ message: 'Error resolving complaint', error: err.message });
  }
};

// ✅ GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const statusBreakdown = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const departmentBreakdown = await Complaint.aggregate([
      { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
    ]);
    const escalatedComplaints = await Complaint.countDocuments({ status: 'escalated' });

    const resolvedComplaints = await Complaint.find({ status: 'resolved' }, 'createdAt updatedAt');
    const avgResolutionDays =
      resolvedComplaints.length > 0
        ? resolvedComplaints.reduce(
            (acc, c) => acc + (c.updatedAt - c.createdAt) / (1000 * 60 * 60 * 24),
            0
          ) / resolvedComplaints.length
        : 0;

    const analytics = {
      totalComplaints,
      statusBreakdown,
      departmentBreakdown,
      escalatedComplaints,
      averageResolutionDays: avgResolutionDays.toFixed(2),
    };

    res.json(analytics);
  } catch (err) {
    console.error("❌ Error generating analytics:", err);
    res.status(500).json({ message: 'Error generating analytics', error: err.message });
  }
};

// --- HELPERS ---

// 🏢 New Helper: Send Email to Department
const sendDepartmentNotification = async (toEmail, deptName, complaint) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Create links for evidence media
    // Note: Assuming your server runs on localhost:5001 for accessing uploads
    const serverBaseUrl = "http://localhost:5001"; 
    const mediaLinks = (complaint.media || [])
      .map((m, i) => `<a href="${serverBaseUrl}${m.url}">Evidence ${i + 1} (${m.type})</a>`)
      .join('<br>');

    const mailOptions = {
      from: `"CivicVoice Admin" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `URGENT: New Complaint Assigned - ${complaint.complaintId}`,
      html: `
        <h2>New Complaint Assigned</h2>
        <p><strong>Department:</strong> ${deptName}</p>
        <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
        <p><strong>Issue Type:</strong> ${complaint.issueType.toUpperCase()}</p>
        <hr />
        <h3>Description</h3>
        <p>${complaint.description}</p>
        <hr />
        <h3>Location</h3>
        <p>${complaint.locationText}</p>
        <p><strong>Coordinates:</strong> ${complaint.locationGeo.coordinates.join(', ')}</p>
        <hr />
        <h3>Evidence</h3>
        <p>${mediaLinks || "No media attached."}</p>
        <br />
        <p>Please take action immediately.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Department notification sent to ${toEmail} for ${deptName}`);
  } catch (err) {
    console.error("❌ Failed to send department email:", err.message);
  }
};

// 📧 Send User Email Helper
const sendEmailNotification = async (toEmail, complaintId, issueType, locationText) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CivicVoice" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Complaint Resolved: ${complaintId} ✅`,
      text: `Good news! Your complaint regarding ${issueType} has been resolved. Thank you for reporting!`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${toEmail}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
};

// 💬 Send SMS Helper
const sendSMSNotification = async (mobile, complaintId, issueType) => {
  try {
    const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;
    const message = `CivicVoice Update: Your complaint ${complaintId} regarding "${issueType}" has been RESOLVED ✅. Thank you for helping improve your city!`;

    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE,
      to: formattedMobile,
      body: message,
    });

    console.log(`💬 SMS notification sent to ${formattedMobile}`);
  } catch (err) {
    console.error("❌ Failed to send SMS message:", err.message);
  }
};