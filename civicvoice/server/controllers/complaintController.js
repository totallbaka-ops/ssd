const Complaint = require('../models/Complaint');
const { parseComplaintText } = require('../utils/complaintParser');
const { getCoordinates } = require('../utils/geocode');

// Generate random complaint ID
const generateComplaintId = () => 'CV-' + Date.now().toString().slice(-6);

// POST /api/complaints (Protected)
exports.createComplaint = async (req, res) => {
  try {
    // 💡 MODIFIED: Added locationGeo and evidence to read from the frontend payload
    const { 
      issueType, 
      description, 
      rawText, 
      locationText, 
      locationGeo, // <-- From frontend map
      longitude,   // <-- From other sources (e.g., API)
      latitude,    // <-- From other sources (e.g., API)
      evidence,    // <-- From frontend (array of URLs)
      severity 
    } = req.body;

    // 🧠 Step 1: Decide whether to use manual data or NLP parsed data
    let issueData = {};
    if (issueType && description) {
      issueData = { issueType, description, locationText, severity };
    } else if (rawText) {
      issueData = parseComplaintText(rawText);
    } else {
      return res.status(400).json({ message: 'Complaint text or fields are required' });
    }

    // 🗺️ Step 2: Handle location (Priority: GeoJSON > lon/lat > text)
    // ---
    // 💡 FIXED LOCATION LOGIC
    // ---
    let lng;
    let lat;

    // Priority 1: Check for locationGeo from frontend (MapPicker)
    if (locationGeo && locationGeo.type === 'Point' && Array.isArray(locationGeo.coordinates) && locationGeo.coordinates.length === 2) {
      lng = locationGeo.coordinates[0];
      lat = locationGeo.coordinates[1];
    }
    // Priority 2: Check for manual longitude/latitude fields
    else if (longitude && latitude && !isNaN(parseFloat(longitude)) && !isNaN(parseFloat(latitude))) {
      lng = parseFloat(longitude);
      lat = parseFloat(latitude);
    }
    // Priority 3: Fallback to geocoding the locationText
    else if (issueData.locationText || locationText) {
      try {
        const coords = await getCoordinates(issueData.locationText || locationText);
        lng = coords[0];
        lat = coords[1];
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError.message);
        // This is the error you were getting. We now only return it if all else fails.
      }
    }

    // Fallback if no coordinates found at all
    if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ message: 'Could not determine coordinates for this location' });
    }

    // 🧱 Step 3: Create the complaint entry
    // ---
    // 💡 FIXED MEDIA LOGIC
    //    Reads the 'evidence' array from req.body instead of 'req.files'
    // ---
    let mediaList = [];
    if (Array.isArray(evidence)) {
      mediaList = evidence.map(url => ({
        url: url,
        type: url.endsWith('mp4') || url.endsWith('mov') ? 'video/mp4' : 'image/jpeg' // Simple type-guessing
      }));
    } else if (req.files) {
      // Keep old logic as a fallback
      mediaList = req.files.map((f) => ({ url: `/uploads/${f.filename}`, type: f.mimetype }));
    }

    const complaint = await Complaint.create({
      complaintId: generateComplaintId(),
      reporter: req.user.id, // Assumes auth middleware provides req.user
      issueType: issueData.issueType || 'others',
      description: issueData.description,
      locationText: issueData.locationText || locationText || "Location pinned on map",      locationGeo: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      severity: issueData.severity || severity || 'medium',
      media: mediaList, // <-- Use the processed mediaList
      summary: `Citizen reported a ${issueData.issueType} issue: "${issueData.description}" at ${issueData.locationText || locationText}.`,
    });

    res.status(201).json({
      message: 'Complaint created successfully',
      complaint,
    });
  } catch (err) {
    console.error('❌ Error creating complaint:', err);
    res.status(500).json({ message: 'Server error while creating complaint', error: err.message });
  }
};

// GET /api/complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('reporter', 'mobile');
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching complaints' });
  }
};

// GET /api/complaints/:id
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('reporter', 'mobile');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching complaint' });
  }
};

/**
* @desc    Get all complaints for the logged-in user
 * @route   GET /api/complaints/my-complaints
 * @access  Protected
 */
exports.getMyComplaints = async (req, res) => {
  try {
    // req.user.id is provided by the 'protect' middleware
    const complaints = await Complaint.find({ reporter: req.user.id })
      .sort({ createdAt: -1 })
      .select('complaintId issueType description status createdAt'); // Select only the fields we need

    res.json(complaints);
  } catch (err) {
    console.error('Error fetching user complaints:', err.message);
    res.status(500).json({ message: 'Error fetching complaints' });
  }
};

// GET /api/complaints/public
exports.getPublicComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({}, 'complaintId issueType locationText locationGeo status upvotes createdAt').lean();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching public complaints' });
  }
};

// POST /api/complaints/:id/upvote
exports.upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (!Array.isArray(complaint.upvoters)) complaint.upvoters = [];

    // Assumes auth middleware provides req.user
    if (complaint.upvoters.some(u => u.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already upvoted' });
    }

    complaint.upvotes = (complaint.upvotes || 0) + 1;
    complaint.upvoters.push(req.user.id);
    await complaint.save();

    res.json({ message: 'Upvoted successfully', upvotes: complaint.upvotes });
  } catch (err) {
    res.status(500).json({ message: 'Error upvoting complaint', error: err.message });
  }
};

// POST /api/complaints/:id/rate
// POST /api/complaints/:id/rate
exports.rateComplaint = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating) return res.status(400).json({ message: 'Rating is required' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Initialize array if it doesn't exist (for old records)
    if (!complaint.ratings) complaint.ratings = [];

    // Check if user already rated
    const existingRatingIndex = complaint.ratings.findIndex(
      (r) => r.user.toString() === req.user.id
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      complaint.ratings[existingRatingIndex].value = parseInt(rating);
    } else {
      // Add new rating
      complaint.ratings.push({ user: req.user.id, value: parseInt(rating) });
    }

    await complaint.save();

    res.json({ message: 'Rating submitted successfully', ratings: complaint.ratings });
  } catch (err) {
    console.error("Error rating complaint:", err);
    res.status(500).json({ message: 'Error rating complaint' });
  }
};