const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getStats, getBookings } = require('./controllers/bookingController');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ola_dashboard');
    console.log('DB Connected.');

    const mockReq = {
      query: {}
    };

    const mockRes = {
      status(code) {
        console.log('Status code set:', code);
        return this;
      },
      json(data) {
        console.log('JSON Response Success!');
        console.log(JSON.stringify(data, null, 2));
      }
    };

    console.log('Calling getStats controller function...');
    await getStats(mockReq, mockRes);

    console.log('Calling getBookings controller function...');
    await getBookings(mockReq, mockRes);

    process.exit(0);
  } catch (err) {
    console.error('CONTROLLER CRASHED:', err);
    process.exit(1);
  }
}

run();
