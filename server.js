const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const Booking = require('./models/Booking');
const User = require('./models/User');
const { seedDatabase } = require('./utils/seeder');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
if (fs.existsSync(path.join(__dirname, 'frontend', '.env'))) {
  dotenv.config({ path: path.join(__dirname, 'frontend', '.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB().then(async () => {
  // Check if database is empty or missing drivers, and auto-seed if necessary
  try {
    const bookingCount = await Booking.countDocuments();
    const driverCount = await User.countDocuments({ role: { $regex: /^driver$/i } });

    if (bookingCount === 0 || driverCount < 5) {
      console.log(`Database sync check: Bookings=${bookingCount}, Drivers=${driverCount}. Running auto-seeder for driver fleet...`);
      await seedDatabase(bookingCount > 0 ? bookingCount : 2000);
    }
  } catch (err) {
    console.error('Auto-seeding check failed:', err.message);
  }
});

// Configure middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes mapping
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.post('/api/save-transparent-robot', (req, res) => {
  try {
    const { dataUrl } = req.body;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const destPublic = path.join(__dirname, 'frontend', 'public', 'ai_robot_3d_clean.png');
    const destAssets = path.join(__dirname, 'frontend', 'src', 'assets', 'ai_robot_3d_clean.png');
    const destDistAssets = path.join(__dirname, 'frontend', 'dist', 'ai_robot_3d_clean.png');

    fs.writeFileSync(destPublic, buffer);
    fs.writeFileSync(destAssets, buffer);
    if (fs.existsSync(path.join(__dirname, 'frontend', 'dist'))) {
      fs.writeFileSync(destDistAssets, buffer);
    }

    console.log('Successfully saved transparent robot asset!');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving robot:', err);
    res.status(500).json({ error: err.message });
  }
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
