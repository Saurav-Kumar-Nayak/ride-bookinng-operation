const express = require('express');
const router = express.Router();
const {
  getStats,
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  seedDb,
  exportBookings
} = require('../controllers/bookingController');

// Aggregate stats endpoint
router.get('/stats', getStats);

// CSV Export endpoint
router.get('/export', exportBookings);

// Listing, paging, filtering endpoint
router.get('/', getBookings);

// Direct single records CRUD
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

// Administrative seeding trigger
router.post('/seed', seedDb);

module.exports = router;
