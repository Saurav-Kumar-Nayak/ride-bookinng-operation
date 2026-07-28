const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoutes');
const Booking = require('./models/Booking');
const { seedDatabase } = require('./utils/seeder');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB().then(async () => {
  // Check if database is empty and auto-seed if necessary
  try {
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      console.log('Database index is empty. Running auto-seeder to generate 2,000 sample bookings...');
      // We seed 2000 records here which is fast (under 1 min) and provides high visual fidelity
      await seedDatabase(2000);
    }
  } catch (err) {
    console.error('Auto-seeding check failed:', err.message);
  }
});

// Configure middleware
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Serve frontend assets in production
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API Server is running. Frontend has not been built yet. Run "npm run build" in the frontend directory.');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
