const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    sparse: true,
    index: true,
  },
  email: {
    type: String,
    sparse: true,
    index: true,
    default: '',
  },
  password: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
    sparse: true,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: 'RideX Passenger',
  },
  role: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    default: 'passenger',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  rating: {
    type: Number,
    default: 4.8,
  },
  totalTrips: {
    type: Number,
    default: 0,
  },
  driverDetails: {
    vehicleType: {
      type: String,
      default: 'Go Sedan',
    },
    vehicleNumber: {
      type: String,
      default: 'DL 01 AB 1234',
    },
    rating: {
      type: Number,
      default: 4.7,
    },
    availability: {
      type: String,
      enum: ['Available', 'On Trip', 'Offline'],
      default: 'Available',
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      accuracy: Number,
      heading: Number,
      speed: Number,
      address: String,
      updatedAt: { type: Date, default: Date.now }
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
