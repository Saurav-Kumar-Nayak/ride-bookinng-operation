const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String, // 'ride_cancellation' | 'driver_approval' | 'live_trip' | 'system'
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    default: function() {
      const now = new Date();
      return `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  },
  unread: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
