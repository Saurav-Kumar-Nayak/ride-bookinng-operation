const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  bookingTime: {
    type: String, // format "HH:MM"
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Cancelled by Driver', 'No Driver Found', 'Cancelled by Customer', 'Incomplete', 'Confirmed', 'In Progress', 'Cancelled', 'Requested', 'Accepted', 'Driver Arriving', 'Driver Arrived', 'Ride Started'],
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  driverName: {
    type: String,
    default: null
  },
  driverPhone: {
    type: String,
    default: null
  },
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  passengerName: {
    type: String,
    default: null
  },
  passengerPhone: {
    type: String,
    default: null
  },
  vehicleType: {
    type: String,
    enum: ['Auto', 'Go Mini', 'Go Sedan', 'Bike', 'Premier Sedan', 'eBike', 'Uber XL', 'Mini', 'Sedan', 'SUV', 'Prime'],
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  dropLocation: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  distance: {
    type: Number, // in KM
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Uber Wallet', 'Credit Card', 'Debit Card', 'Wallet', 'Card'],
    required: true
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  customerRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  custCancellationReason: {
    type: String,
    default: null
  },
  driverCancellationReason: {
    type: String,
    default: null
  },
  riderComment: {
    type: String,
    maxlength: 500,
    default: null
  },
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster lookups
BookingSchema.index({ status: 1 });
BookingSchema.index({ vehicleType: 1 });
BookingSchema.index({ bookingDate: 1 });
BookingSchema.index({ driverId: 1 });
BookingSchema.index({ pickupLocation: 'text', dropLocation: 'text', bookingId: 'text' });

module.exports = mongoose.model('Booking', BookingSchema);
