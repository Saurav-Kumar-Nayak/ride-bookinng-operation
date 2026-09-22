const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');
const User = require('../models/User');

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

  const bookingDate = new Date(targetDate);
  bookingDate.setHours(hour, minute, 0, 0);

  const bookingId = `BK_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const baseDistance = parseFloat((Math.random() * 45 + 2).toFixed(2));
  const fareFactor = vehicleType.includes('Sedan') ? 1.5 : (vehicleType.includes('XL') ? 2.0 : (vehicleType.includes('Bike') ? 0.4 : 1.0));
  const fare = Math.round(parseFloat((40 + baseDistance * 18 * fareFactor).toFixed(2)));

  let driverRating = null;
  let customerRating = null;
  let custCancellationReason = null;
  let driverCancellationReason = null;

  if (status === 'Completed') {
    driverRating = parseFloat((3 + Math.random() * 2).toFixed(1));
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

const samplePassengers = [
  { name: 'Aarav Sharma', phone: '9876543210', email: 'aarav.s@gmail.com', rating: 4.9 },
  { name: 'Priya Patel', phone: '9812345678', email: 'priya.p@yahoo.com', rating: 4.8 },
  { name: 'Rohan Verma', phone: '9711223344', email: 'rohan.v@outlook.com', rating: 4.7 },
  { name: 'Ananya Gupta', phone: '9988776655', email: 'ananya.g@gmail.com', rating: 5.0 },
  { name: 'Vikram Singh', phone: '9654321098', email: 'vikram.s@live.com', rating: 4.6 },
  { name: 'Sneha Reddy', phone: '9543210987', email: 'sneha.r@gmail.com', rating: 4.9 },
  { name: 'Kabir Mehta', phone: '9432109876', email: 'kabir.m@gmail.com', rating: 4.8 },
  { name: 'Diya Choudhury', phone: '9321098765', email: 'diya.c@hotmail.com', rating: 4.9 },
  { name: 'Arjun Nair', phone: '9210987654', email: 'arjun.n@gmail.com', rating: 4.7 },
  { name: 'Isha Joshi', phone: '9109876543', email: 'isha.j@gmail.com', rating: 4.8 },
  { name: 'Rahul Kapoor', phone: '9098765432', email: 'rahul.k@gmail.com', rating: 4.6 },
  { name: 'Kavya Malhotra', phone: '9987654321', email: 'kavya.m@gmail.com', rating: 4.9 },
  { name: 'Aditya Das', phone: '9876543211', email: 'aditya.d@gmail.com', rating: 4.8 },
  { name: 'Pooja Bhatia', phone: '9765432109', email: 'pooja.b@gmail.com', rating: 4.7 },
  { name: 'Siddharth Rao', phone: '9654321099', email: 'siddharth.r@gmail.com', rating: 4.9 }
];

const sampleDrivers = [
  { name: 'Rajesh Kumar', phone: '9811122233', vehicleType: 'Go Sedan', vehicleNumber: 'DL 01 AB 4589', rating: 4.8, availability: 'Available', lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi' },
  { name: 'Suresh Yadav', phone: '9822233344', vehicleType: 'Auto', vehicleNumber: 'DL 1R 8821', rating: 4.7, availability: 'On Trip', lat: 28.5355, lng: 77.2610, address: 'Saket, New Delhi' },
  { name: 'Amit Kumar', phone: '9833344455', vehicleType: 'Premier Sedan', vehicleNumber: 'HR 26 DQ 1002', rating: 4.9, availability: 'Available', lat: 28.4595, lng: 77.0266, address: 'Gurgaon Cyber City' },
  { name: 'Sunil Sharma', phone: '9844455566', vehicleType: 'Go Mini', vehicleNumber: 'UP 16 AX 5543', rating: 4.6, availability: 'On Trip', lat: 28.6280, lng: 77.3769, address: 'Noida Sector 62' },
  { name: 'Ramesh Singh', phone: '9855566677', vehicleType: 'Bike', vehicleNumber: 'DL 05 S 9912', rating: 4.9, availability: 'Available', lat: 28.6505, lng: 77.1555, address: 'Karol Bagh, New Delhi' },
  { name: 'Manoj Verma', phone: '9866677788', vehicleType: 'Uber XL', vehicleNumber: 'DL 03 CA 7781', rating: 4.8, availability: 'Offline', lat: 28.5494, lng: 77.2001, address: 'AIIMS, New Delhi' },
  { name: 'Dharmendra P', phone: '9877788899', vehicleType: 'eBike', vehicleNumber: 'DL 02 EV 3311', rating: 4.9, availability: 'Available', lat: 28.5921, lng: 77.0460, address: 'Dwarka Sector 21' },
  { name: 'Deepak Mishra', phone: '9888899900', vehicleType: 'Go Sedan', vehicleNumber: 'HR 51 B 6044', rating: 4.7, availability: 'On Trip', lat: 28.4089, lng: 77.3178, address: 'Badarpur Border' },
  { name: 'Vijay Chauhan', phone: '9899900011', vehicleType: 'Auto', vehicleNumber: 'DL 1R 4120', rating: 4.8, availability: 'Available', lat: 28.5244, lng: 77.1855, address: 'Mehrauli, New Delhi' },
  { name: 'Rakesh Gujjar', phone: '9800011122', vehicleType: 'Premier Sedan', vehicleNumber: 'UP 14 BT 9081', rating: 4.9, availability: 'Available', lat: 28.6180, lng: 77.3720, address: 'Indirapuram, Ghaziabad' }
];

const seedDatabase = async (count = 5000) => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ola_dashboard';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Seeding...');

    await Booking.deleteMany({});
    console.log('Cleared existing bookings.');

    const now = new Date();

    // Seed Passengers with distributed createdAt dates
    const passengerCount = await User.countDocuments({ role: 'passenger' });
    if (passengerCount < 10) {
      console.log('Seeding sample Passengers into MongoDB User collection...');
      let pIdx = 0;
      for (const p of samplePassengers) {
        const pDate = new Date(now);
        pDate.setDate(now.getDate() - Math.floor((pIdx / samplePassengers.length) * 45));
        pIdx++;
        await User.updateOne(
          { phone: p.phone },
          {
            $set: {
              name: p.name,
              phone: p.phone,
              email: p.email,
              role: 'passenger',
              status: 'active',
              rating: p.rating,
              totalTrips: Math.floor(Math.random() * 40) + 5,
              createdAt: pDate
            }
          },
          { upsert: true }
        );
      }
    }

    // Seed Drivers with distributed createdAt dates
    const driverCount = await User.countDocuments({ role: 'driver' });
    if (driverCount < 8) {
      console.log('Seeding sample Drivers into MongoDB User collection...');
      let dIdx = 0;
      for (const d of sampleDrivers) {
        const dDate = new Date(now);
        dDate.setDate(now.getDate() - Math.floor((dIdx / sampleDrivers.length) * 60));
        dIdx++;
        await User.updateOne(
          { phone: d.phone },
          {
            $set: {
              name: d.name,
              phone: d.phone,
              email: `${d.name.toLowerCase().replace(/\s+/g, '.')}@driver.ridex.com`,
              role: 'driver',
              status: 'active',
              rating: d.rating,
              totalTrips: Math.floor(Math.random() * 200) + 50,
              createdAt: dDate,
              driverDetails: {
                vehicleType: d.vehicleType,
                vehicleNumber: d.vehicleNumber,
                rating: d.rating,
                availability: d.availability,
                totalTrips: Math.floor(Math.random() * 200) + 50,
                totalEarnings: Math.floor(Math.random() * 80000) + 20000,
                currentLocation: { lat: d.lat, lng: d.lng, address: d.address }
              }
            }
          },
          { upsert: true }
        );
      }
    }

    const bookings = [];
    
    // Distribute bookings over the last 90 days with high density on recent days
    for (let i = 0; i < count; i++) {
      let daysAgo;
      const r = Math.random();
      if (r < 0.15) {
        daysAgo = 0; // Today
      } else if (r < 0.40) {
        daysAgo = Math.floor(Math.random() * 7); // Last 7 days
      } else if (r < 0.75) {
        daysAgo = Math.floor(Math.random() * 30); // Last 30 days
      } else {
        daysAgo = Math.floor(Math.random() * 90); // Last 90 days
      }

      const bookingDate = new Date(now);
      bookingDate.setDate(now.getDate() - daysAgo);
      bookings.push(generateRandomBooking(i, bookingDate));
    }

    console.log(`Generating ${count} bookings...`);
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

if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 5000;
  seedDatabase(count);
}

module.exports = { seedDatabase, generateRandomBooking };
