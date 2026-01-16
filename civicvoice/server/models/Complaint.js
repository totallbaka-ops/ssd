const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: String,
  type: { type: String }, // image/video
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issueType: {
      type: String,
      required: true,
      enum: ['water', 'waste', 'roads', 'electricity', 'others'],
    },
    description: {
      type: String,
      required: true,
    },
    locationText: {
      type: String,
      required: true,
    },
    locationGeo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    media: [mediaSchema],
    status: {
      type: String,
      enum: ['pending', 'verified', 'forwarded', 'in_progress', 'resolved', 'escalated'],
      default: 'pending',
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignedDepartment: {
      type: String,
      default: 'unassigned',
    },
    summary: {
      type: String,
    },
    
    // ---
    // ⬇️ MODIFIED: Store Array of Ratings instead of single number
    // ---
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: Number, min: 1, max: 5 }
      }
    ],

    lastEscalatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

complaintSchema.index({ locationGeo: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);