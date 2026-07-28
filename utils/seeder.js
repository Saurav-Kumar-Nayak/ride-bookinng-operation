const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');

dotenv.config();

const statusProbabilities = [
  { val: 'Completed', weight: 620 },
  { val: 'Cancelled by Driver', weight: 180 },
  { val: 'No Driver Found', weight: 70 },
  { val: 'Cancelled by Customer', weight: 70 },
  { val: 'Incomplete', weight: 60 }
];

const vehicleProbabilities = [
  { val: 'Auto', weight: 249 },
  { val: 'Go Mini', weight: 199 },
  { val: 'Go Sedan', weight: 181 },
  { val: 'Bike', weight: 150 },
  { val: 'Premier Sedan', weight: 121 },
  { val: 'eBike', weight: 70 },
  { val: 'Uber XL', weight: 30 }
];

const paymentProbabilities = [
  { val: 'UPI', weight: 450 },
  { val: 'Cash', weight: 248 },
  { val: 'Uber Wallet', weight: 120 },
  { val: 'Credit Card', weight: 101 },
  { val: 'Debit Card', weight: 81 }
];

const custCancelReasonsProbabilities = [
  { val: 'Wrong Address', weight: 225 },
  { val: 'Change of plans', weight: 224 },
  { val: 'Driver is not moving towards pickup location', weight: 222 },
  { val: 'Driver asked to cancel', weight: 219 },
  { val: 'AC is not working', weight: 110 }
];

const driverCancelReasonsProbabilities = [
  { val: 'Customer related issue', weight: 253 },
  { val: 'The customer was coughing/sick', weight: 250 },
  { val: 'Personal & Car related issues', weight: 249 },
  { val: 'More than permitted people in there', weight: 248 }
];

const pickupLocations = [
  'Khandsa', 'Barakhamba Road', 'Saket', 'Badarpur', 'Pragati Maidan', 
  'Madipur', 'AIIMS', 'Mehrauli', 'Dwarka Sector 21', 'Pataudi Chowk',
  'Connaught Place', 'Karol Bagh', 'Noida Sector 62', 'Gurgaon Phase 3', 'Vasant Kunj'
];

const dropLocations = [
  'Connaught Place', 'Karol Bagh', 'Noida Sector 62', 'Gurgaon Phase 3', 'Vasant Kunj',
  'Khandsa', 'Barakhamba Road', 'Saket', 'Badarpur', 'Pragati Maidan', 
  'Madipur', 'AIIMS', 'Mehrauli', 'Dwarka Sector 21', 'Pataudi Chowk',
  'Rajendra Place', 'Lajpat Nagar', 'Green Park', 'Hauz Khas', 'R.K. Puram'
];

const hourlyWeights = {
  0:137, 1:136, 2:133, 3:138, 4:132, 5:278, 6:416, 7:545, 8:686, 9:823, 10:957, 11:839, 
  12:700, 13:547, 14:703, 15:820, 16:963, 17:1104, 18:1239, 19:1104, 20:963, 21:810, 22:544, 23:276
};

function getRandomByWeight(arr) {
  const sumWeights = arr.reduce((acc, el) => acc + el.weight, 0);
  let random = Math.floor(Math.random() * sumWeights);
  for (const item of arr) {
    if (random < item.weight) return item.val;
    random -= item.weight;
  }
  return arr[0].val;
}

function getRandomHour() {
  const weightsArr = Object.entries(hourlyWeights).map(([h, w]) => ({ val: parseInt(h), weight: w }));
  return getRandomByWeight(weightsArr);
}

function generateRandomBooking(index, targetDate) {
  const status = getRandomByWeight(statusProbabilities);
  const vehicleType = getRandomByWeight(vehicleProbabilities);
  const paymentMethod = getRandomByWeight(paymentProbabilities);
  
  const pickup = pickupLocations[Math.floor(Math.random() * pickupLocations.length)];
  let drop = dropLocations[Math.floor(Math.random() * dropLocations.length)];
  while (drop === pickup) {
    drop = dropLocations[Math.floor(Math.random() * dropLocations.length)];
  }

  const hour = getRandomHour();
  const minute = Math.floor(Math.random() * 60);
  const pad = (n) => n.toString().padStart(2, '0');
  const bookingTime = `${pad(hour)}:${pad(minute)}`;

  // Set bookingDate to targetDate at local hour
  const bookingDate = new Date(targetDate);
  bookingDate.setHours(hour, minute, 0, 0);

  const bookingId = `BK_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Average fare ~ 508. Let's make it range from 80 to 1200 depending on distance
  const baseDistance = parseFloat((Math.random() * 45 + 2).toFixed(2)); // 2 to 47 KM, avg ~24.5
  const fareFactor = vehicleType.includes('Sedan') ? 1.5 : (vehicleType.includes('XL') ? 2.0 : (vehicleType.includes('Bike') ? 0.4 : 1.0));
  const fare = Math.round(parseFloat((40 + baseDistance * 18 * fareFactor).toFixed(2))); // ~500 avg

  let driverRating = null;
  let customerRating = null;
  let custCancellationReason = null;
  let driverCancellationReason = null;

  if (status === 'Completed') {
    // Avg driver rating ~4.23, customer ~4.40
    driverRating = parseFloat((3 + Math.random() * 2).toFixed(1)); // 3.0 to 5.0
    // Bias towards 4-5
    if (Math.random() > 0.3) driverRating = parseFloat((4 + Math.random()).toFixed(1));
    if (driverRating > 5.0) driverRating = 5;

    customerRating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
    if (Math.random() > 0.2) customerRating = parseFloat((4.2 + Math.random() * 0.8).toFixed(1));
    if (customerRating > 5.0) customerRating = 5;
  } else if (status === 'Cancelled by Customer') {
    custCancellationReason = getRandomByWeight(custCancelReasonsProbabilities);
  } else if (status === 'Cancelled by Driver') {
    driverCancellationReason = getRandomByWeight(driverCancelReasonsProbabilities);
  }

  return {
    bookingId,
    bookingDate,
    bookingTime,
    status,
    vehicleType,
    pickupLocation: pickup,
    dropLocation: drop,
    fare,
    distance: baseDistance,
    paymentMethod,
    driverRating,
    customerRating,
    custCancellationReason,
    driverCancellationReason
  };
}

const seedDatabase = async (count = 5000) => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ola_dashboard';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Seeding...');

    await Booking.deleteMany({});
    console.log('Cleared existing bookings.');

    const bookings = [];
    const now = new Date();
    
    // Distribute bookings over the last 12 months
    for (let i = 0; i < count; i++) {
      // Pick a random day in the last 365 days
      const daysAgo = Math.floor(Math.random() * 365);
      const bookingDate = new Date();
      bookingDate.setDate(now.getDate() - daysAgo);
      bookings.push(generateRandomBooking(i, bookingDate));
    }

    console.log(`Generating ${count} bookings...`);
    // Insert in chunks of 1000 for safety and performance
    const chunkSize = 1000;
    for (let i = 0; i < bookings.length; i += chunkSize) {
      const chunk = bookings.slice(i, i + chunkSize);
      await Booking.insertMany(chunk);
      console.log(`Inserted chunk ${i / chunkSize + 1}/${Math.ceil(count / chunkSize)}`);
    }

    console.log('Database Seeding Completed Successfully!');
    await mongoose.disconnect();
    
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

// Check if running directly via command line
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 5000;
  seedDatabase(count);
}

module.exports = { seedDatabase, generateRandomBooking };
