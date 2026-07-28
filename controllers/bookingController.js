const Booking = require('../models/Booking');
const { generateRandomBooking } = require('../utils/seeder');

// Get aggregated statistics for the dashboard
exports.getStats = async (req, res) => {
  try {
    const { status, vehicleType, paymentMethod, hour, startDate, endDate } = req.query;

    // Build the query object based on filters
    const matchQuery = {};
    if (status) matchQuery.status = status;
    if (vehicleType) matchQuery.vehicleType = vehicleType;
    if (paymentMethod) matchQuery.paymentMethod = paymentMethod;
    
    if (hour !== undefined && hour !== '') {
      const paddedHour = String(hour).padStart(2, '0');
      matchQuery.bookingTime = new RegExp(`^${paddedHour}:`);
    }

    if (startDate || endDate) {
      matchQuery.bookingDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) matchQuery.bookingDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          matchQuery.bookingDate.$lte = end;
        }
      }
      if (Object.keys(matchQuery.bookingDate).length === 0) {
        delete matchQuery.bookingDate;
      }
    }

    // 1. Overall counts, averages, and rates (run matchQuery first)
    const summaryStats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalFare: { $sum: '$fare' },
          avgDistance: { $avg: '$distance' },
          // Averages for ratings where they are not null
          avgDriverRating: {
            $avg: { $cond: [{ $ne: ['$driverRating', null] }, '$driverRating', '$$REMOVE'] }
          },
          avgCustomerRating: {
            $avg: { $cond: [{ $ne: ['$customerRating', null] }, '$customerRating', '$$REMOVE'] }
          }
        }
      }
    ]);

    // Gather overall completion rate & driver cancellation percentages
    // These specific rates are ALWAYS relative to the base selections, but completion is useful
    const baseStats = summaryStats[0] || {
      totalBookings: 0,
      totalFare: 0,
      avgDistance: 0,
      avgDriverRating: 0,
      avgCustomerRating: 0
    };

    // Calculate rates (specifically based on the current selection or overall)
    // To make sure completion rate displays correctly:
    const completedCount = await Booking.countDocuments({ ...matchQuery, status: 'Completed' });
    const driverCancelledCount = await Booking.countDocuments({ ...matchQuery, status: 'Cancelled by Driver' });
    const baseTotal = baseStats.totalBookings || 1;

    const completionRate = ((completedCount / baseTotal) * 100).toFixed(1);
    const driverCancelRate = ((driverCancelledCount / baseTotal) * 100).toFixed(1);
    const avgBookingValue = baseStats.totalBookings > 0 ? Math.round(baseStats.totalFare / baseStats.totalBookings) : 0;

    // 2. Status counts
    const statusCountsAgg = await Booking.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusCounts = {
      Completed: 0,
      'Cancelled by Driver': 0,
      'No Driver Found': 0,
      'Cancelled by Customer': 0,
      Incomplete: 0
    };
    statusCountsAgg.forEach(item => {
      if (item._id in statusCounts) {
        statusCounts[item._id] = item.count;
      }
    });

    // 3. Booking by Hour of Day
    const hourlyCountsAgg = await Booking.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hourStr: { $substr: ['$bookingTime', 0, 2] }
        }
      },
      {
        $group: {
          _id: '$hourStr',
          count: { $sum: 1 }
        }
      }
    ]);
    const hourlyCounts = {};
    for (let h = 0; h < 24; h++) {
      hourlyCounts[h] = 0;
    }
    hourlyCountsAgg.forEach(item => {
      const hInt = parseInt(item._id, 10);
      if (!isNaN(hInt) && hInt >= 0 && hInt < 24) {
        hourlyCounts[hInt] = item.count;
      }
    });

    // 4. Vehicle share of bookings
    const vehicleCountsAgg = await Booking.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const vehicleCounts = {};
    vehicleCountsAgg.forEach(item => {
      vehicleCounts[item._id] = item.count;
    });

    // 5. Payment completed split (only for Completed rides)
    const paymentCompletedAgg = await Booking.aggregate([
      {
        $match: {
          ...matchQuery,
          status: 'Completed'
        }
      },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const paymentCompleted = {};
    paymentCompletedAgg.forEach(item => {
      paymentCompleted[item._id] = item.count;
    });

    // 6. Top customer cancellation reasons (for Cancelled by Customer rides)
    const custReasonsAgg = await Booking.aggregate([
      {
        $match: {
          ...matchQuery,
          status: 'Cancelled by Customer',
          custCancellationReason: { $ne: null }
        }
      },
      { $group: { _id: '$custCancellationReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const custCancelReasons = {};
    custReasonsAgg.forEach(item => {
      custCancelReasons[item._id] = item.count;
    });

    // 7. Top driver cancellation reasons (for Cancelled by Driver rides)
    const driverReasonsAgg = await Booking.aggregate([
      {
        $match: {
          ...matchQuery,
          status: 'Cancelled by Driver',
          driverCancellationReason: { $ne: null }
        }
      },
      { $group: { _id: '$driverCancellationReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const driverCancelReasons = {};
    driverReasonsAgg.forEach(item => {
      driverCancelReasons[item._id] = item.count;
    });

    // 8. Top 10 pickup locations
    const topPickupAgg = await Booking.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$pickupLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const topPickup = {};
    topPickupAgg.forEach(item => {
      topPickup[item._id] = item.count;
    });

    res.json({
      status_counts: statusCounts,
      vehicle_counts: vehicleCounts,
      hourly_counts: hourlyCounts,
      payment_completed: paymentCompleted,
      cust_cancel_reasons: custCancelReasons,
      driver_cancel_reasons: driverCancelReasons,
      top_pickup: topPickup,
      total_bookings: baseStats.totalBookings,
      completionRate,
      driverCancelRate,
      avg_booking_value: avgBookingValue,
      avg_distance: parseFloat((baseStats.avgDistance || 0).toFixed(2)),
      avg_driver_rating: parseFloat((baseStats.avgDriverRating || 0).toFixed(2)),
      avg_customer_rating: parseFloat((baseStats.avgCustomerRating || 0).toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error aggregating stats', error: error.message });
  }
};

// Fetch list of bookings with searching, listing, pagination
exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, vehicleType, paymentMethod, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) query.bookingDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.bookingDate.$lte = end;
        }
      }
      if (Object.keys(query.bookingDate).length === 0) {
        delete query.bookingDate;
      }
    }

    if (search) {
      // Direct regex match on id/locations to make search fast, simple and flexible
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { pickupLocation: { $regex: search, $options: 'i' } },
        { dropLocation: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ bookingDate: -1, bookingTime: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings list', error: error.message });
  }
};

// Create a new booking (optionally triggers simulation outcomes)
exports.createBooking = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, vehicleType, paymentMethod, simulate } = req.body;

    if (!pickupLocation || !dropLocation || !vehicleType || !paymentMethod) {
      return res.status(400).json({ message: 'Please provide all booking details.' });
    }

    let bookingData;

    if (simulate) {
      // Simulate real outcome based on our standard statistics
      const index = 0;
      const targetDate = new Date();
      bookingData = generateRandomBooking(index, targetDate);
      
      // Override details requested by input
      bookingData.pickupLocation = pickupLocation;
      bookingData.dropLocation = dropLocation;
      bookingData.vehicleType = vehicleType;
      bookingData.paymentMethod = paymentMethod;
    } else {
      // Manual creation with specific default status 'Completed' or custom
      const bookingId = `BK_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const bookingTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      
      const distance = parseFloat((Math.random() * 20 + 2).toFixed(2));
      const fare = Math.round(50 + distance * 15);

      bookingData = {
        bookingId,
        bookingDate: now,
        bookingTime,
        status: 'Completed',
        vehicleType,
        pickupLocation,
        dropLocation,
        fare,
        distance,
        paymentMethod,
        driverRating: 4.5,
        customerRating: 4.8
      };
    }

    const booking = new Booking(bookingData);
    await booking.save();

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

// Update booking status or ratings
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driverRating, customerRating, driverCancellationReason, custCancellationReason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (status) booking.status = status;
    if (driverRating !== undefined) booking.driverRating = driverRating;
    if (customerRating !== undefined) booking.customerRating = customerRating;
    if (driverCancellationReason !== undefined) booking.driverCancellationReason = driverCancellationReason;
    if (custCancellationReason !== undefined) booking.custCancellationReason = custCancellationReason;

    await booking.save();
    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json({ message: 'Booking deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
};

// Trigger re-seeding from UI
exports.seedDb = async (req, res) => {
  try {
    const { count = 5000 } = req.body;
    // Load the model seeder dynamically to run in process
    const { seedDatabase } = require('../utils/seeder');
    
    // We run it asynchronously but write a quick status
    await seedDatabase(Number(count));
    res.json({ message: `Database seeded successfully with ${count} bookings.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to seed database', error: error.message });
  }
};

// Export filtered bookings to CSV
exports.exportBookings = async (req, res) => {
  try {
    const { search, status, vehicleType, paymentMethod, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) query.bookingDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.bookingDate.$lte = end;
        }
      }
      if (Object.keys(query.bookingDate).length === 0) {
        delete query.bookingDate;
      }
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { pickupLocation: { $regex: search, $options: 'i' } },
        { dropLocation: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query).sort({ bookingDate: -1, bookingTime: -1 });

    let csvContent = 'Booking ID,Booking Date,Booking Time,Status,Vehicle Type,Pickup Location,Drop Location,Fare (INR),Distance (KM),Payment Method,Driver Rating,Customer Rating,Cancellation Reason\n';
    
    bookings.forEach(b => {
      const cancelReason = b.custCancellationReason || b.driverCancellationReason || '';
      const formattedDate = b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : '';
      
      const row = [
        b.bookingId || '',
        formattedDate,
        b.bookingTime || '',
        b.status || '',
        b.vehicleType || '',
        `"${(b.pickupLocation || '').replace(/"/g, '""')}"`,
        `"${(b.dropLocation || '').replace(/"/g, '""')}"`,
        b.fare || 0,
        b.distance || 0,
        b.paymentMethod || '',
        b.driverRating !== null && b.driverRating !== undefined ? b.driverRating : '',
        b.customerRating !== null && b.customerRating !== undefined ? b.customerRating : '',
        `"${cancelReason.replace(/"/g, '""')}"`
      ];
      
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ola_bookings_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting bookings', error: error.message });
  }
};
