const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.Mixed, // Supports ObjectId or String bookingId (e.g. BK_8921)
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  riderName: {
    type: String,
    required: true,
    trim: true,
    default: 'Rider'
  },
  riderAvatar: {
    type: String,
    default: ''
  },
  driverId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500,
    default: '',
    trim: true
  },
  badges: [{
    type: String
  }],
  tipAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
