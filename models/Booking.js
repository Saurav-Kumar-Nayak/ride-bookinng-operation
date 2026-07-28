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
    enum: ['Completed', 'Cancelled by Driver', 'No Driver Found', 'Cancelled by Customer', 'Incomplete'],
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['Auto', 'Go Mini', 'Go Sedan', 'Bike', 'Premier Sedan', 'eBike', 'Uber XL'],
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
    enum: ['UPI', 'Cash', 'Uber Wallet', 'Credit Card', 'Debit Card'],
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
  }
}, {
  timestamps: true
});

// Indexes for faster lookups
BookingSchema.index({ status: 1 });
BookingSchema.index({ vehicleType: 1 });
BookingSchema.index({ bookingDate: 1 });
BookingSchema.index({ pickupLocation: 'text', dropLocation: 'text', bookingId: 'text' });

module.exports = mongoose.model('Booking', BookingSchema);
