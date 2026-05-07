import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Ride from '../models/Ride.js';
import auth from '../middleware/auth.js';
import { aiRankRides } from '../services/aiService.js';
import { prepareBookingData, createBlock, createGenesisBlock } from '../services/blockchainService.js';

const router = Router();

router.post('/create', auth('rider'), async (req, res) => {
  try {
    const { rideId, seats = 1, amount, paymentProvider } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'open') return res.status(400).json({ error: 'Ride not available' });
    if (ride.availableSeats < seats) return res.status(400).json({ error: 'Insufficient seats' });

    // Allow zero amount for "Book Now, Pay Later"
    const bookingAmount = amount || 0;

    // Allow 'pending' as payment provider for pay later bookings
    const validPaymentProvider = paymentProvider || (bookingAmount === 0 ? 'pending' : 'stripe');

    // Get the last booking to link in the blockchain
    const lastBooking = await Booking.findOne().sort({ blockIndex: -1 });

    // Prepare booking data
    const bookingData = {
      ride: ride._id,
      rider: req.user.id,
      seats,
      amount: bookingAmount,
      paymentProvider: validPaymentProvider,
      status: 'confirmed' // Auto-confirm all bookings
    };

    let block;
    if (!lastBooking) {
      // Create genesis block (first block)
      block = createGenesisBlock(prepareBookingData(bookingData));
    } else {
      // Create new block linking to previous
      block = createBlock(
        prepareBookingData(bookingData),
        lastBooking.blockHash,
        lastBooking.blockIndex + 1
      );
    }

    // Auto-confirm booking - no driver acceptance needed
    const booking = await Booking.create({
      ...bookingData,
      blockIndex: block.index,
      previousHash: block.previousHash,
      blockHash: block.blockHash,
      blockTimestamp: block.timestamp
    });

    // Update ride seats immediately
    ride.availableSeats -= seats;
    if (ride.availableSeats === 0) ride.status = 'booked';
    await ride.save();

    // Notify driver about new booking (not for acceptance, just notification)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(String(ride._id)).emit('booking:new', { 
          bookingId: String(booking._id), 
          rideId: String(ride._id), 
          seats: booking.seats,
          riderName: 'Rider' // You can populate this with user data
        });
      }
    } catch {}

    res.json({ booking });
  } catch (e) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Pay for an existing booking
router.post('/pay/:bookingId', auth('rider'), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, paymentProvider } = req.body;
    
    const booking = await Booking.findById(bookingId).populate('ride');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.rider.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (booking.status === 'paid') return res.status(400).json({ error: 'Booking already paid' });
    
    // Update booking with payment details
    booking.amount = amount || booking.amount;
    booking.paymentProvider = paymentProvider || 'stripe';
    await booking.save();
    
    res.json({ booking });
  } catch (e) {
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// Get all bookings for a specific ride (for drivers)
router.get('/ride/:rideId', auth('driver'), async (req, res) => {
  try {
    const { rideId } = req.params;
    
    // Verify the driver owns this ride
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.driver.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    
    const bookings = await Booking.find({ ride: rideId })
      .populate('rider', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ bookings });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get user's bookings
router.get('/my', auth('rider'), async (req, res) => {
  try {
    console.log('Fetching bookings for user:', req.user.id);
    const bookings = await Booking.find({ rider: req.user.id })
      .populate('ride')
      .sort({ createdAt: -1 });
    console.log('Found bookings:', bookings.length);
    console.log('Bookings data:', JSON.stringify(bookings, null, 2));
    res.json({ bookings });
  } catch (e) {
    console.error('Error fetching bookings:', e);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get a single booking with ride and driver details
router.get('/:id', auth('rider'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('ride')
      .populate({
        path: 'ride',
        populate: { path: 'driver', select: 'name email phone' }
      });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify the booking belongs to the user
    if (booking.rider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      booking,
      ride: booking.ride,
      driver: booking.ride?.driver
    });
  } catch (e) {
    console.error('Error fetching booking:', e);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Test endpoint without authentication
router.get('/test', async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('ride')
      .sort({ createdAt: -1 })
      .limit(3);
    res.json({ 
      message: 'Test endpoint working',
      totalBookings: bookings.length,
      sampleBookings: bookings.map(b => ({
        id: b._id,
        rider: b.rider,
        status: b.status,
        amount: b.amount,
        ride: b.ride?.source + ' → ' + b.ride?.destination
      }))
    });
  } catch (e) {
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// Auto-book best ranked ride and notify driver
router.post('/auto', auth('rider'), async (req, res) => {
  try {
    const { sourceLoc, destLoc, maxDistanceMeters = 15000, seats = 1 } = req.body;
    
    // Validate source and destination locations
    if (!sourceLoc || !sourceLoc.coordinates) {
      return res.status(400).json({ error: 'Valid source location is required' });
    }
    
    if (!destLoc || !destLoc.coordinates) {
      return res.status(400).json({ error: 'Valid destination location is required' });
    }
    
    // Validate coordinates are reasonable (longitude: -180 to 180, latitude: -90 to 90)
    const [srcLng, srcLat] = sourceLoc.coordinates;
    const [dstLng, dstLat] = destLoc.coordinates;
    
    if (!srcLng || !srcLat || Math.abs(srcLng) > 180 || Math.abs(srcLat) > 90) {
      return res.status(400).json({ error: 'Invalid source coordinates' });
    }
    
    if (!dstLng || !dstLat || Math.abs(dstLng) > 180 || Math.abs(dstLat) > 90) {
      return res.status(400).json({ error: 'Invalid destination coordinates' });
    }
    
    // Ensure source and destination are different
    if (srcLng === dstLng && srcLat === dstLat) {
      return res.status(400).json({ error: 'Source and destination must be different locations' });
    }

    const candidates = await Ride.find({
      status: 'open',
      sourceLoc: { $near: { $geometry: sourceLoc, $maxDistance: maxDistanceMeters } }
    }).limit(50).lean();

    const ranked = await aiRankRides({ sourceLoc, destLoc, rides: candidates });
    const best = ranked.find(r => Number(r.availableSeats || 0) >= Number(seats));
    if (!best) return res.status(404).json({ error: 'No suitable ride found' });

    function haversineKm(lat1, lon1, lat2, lon2) {
      const toRad = (x) => (x * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const s1 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s1));
    }
    // Pro-rate amount by requested distance vs full ride distance
    const rideStart = best?.sourceLoc?.coordinates; // [lng, lat]
    const rideEnd = best?.destLoc?.coordinates;     // [lng, lat]
    const rideKm = (rideStart && rideEnd) ? haversineKm(rideStart[1], rideStart[0], rideEnd[1], rideEnd[0]) : 0;
    const reqStart = sourceLoc?.coordinates;
    const reqEnd = (destLoc && destLoc.coordinates) ? destLoc.coordinates : rideEnd;
    const reqKm = (reqStart && reqEnd) ? haversineKm(reqStart[1], reqStart[0], reqEnd[1], reqEnd[0]) : rideKm;
    const baseFare = Math.max(0, Number(best.fare || 0));
    const perKm = rideKm > 0 ? baseFare / rideKm : baseFare;
    const amount = Math.round(Math.max(0, perKm * (reqKm || rideKm)) * Number(seats) * 100); // Convert to paise
    const booking = await Booking.create({
      ride: best._id,
      rider: req.user.id,
      seats,
      amount,
      paymentProvider: 'razorpay',
      status: 'confirmed' // Auto-confirm booking
    });

    console.log('Created booking:', {
      bookingId: booking._id,
      rider: booking.rider,
      ride: booking.ride,
      amount: booking.amount,
      status: booking.status
    });

    // Update ride seats
    await Ride.findByIdAndUpdate(best._id, { $inc: { availableSeats: -seats } });

    // Notify driver via Socket.IO
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(String(best.driver)).emit('booking:new', {
          rideId: String(best._id),
          bookingId: String(booking._id),
          seats,
          amount,
          status: 'confirmed',
          ts: Date.now()
        });
      }
    } catch {}

    res.json({ booking, ride: best });

  } catch (e) {
    res.status(500).json({ error: 'Auto-book failed' });
  }
});

// Cancel a booking
router.delete('/:id', auth('rider'), async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if the booking belongs to the current user
    if (booking.rider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }
    
    // Check if booking can be cancelled (only confirmed bookings without payment)
    if (booking.status === 'paid') {
      return res.status(400).json({ error: 'Paid bookings cannot be cancelled' });
    }
    
    // Update ride seats (add back the seats)
    await Ride.findByIdAndUpdate(booking.ride, { $inc: { availableSeats: booking.seats } });
    
    // Delete the booking
    await Booking.findByIdAndDelete(id);
    
    // Notify driver if needed
    try {
      const io = req.app.get('io');
      if (io) {
        const ride = await Ride.findById(booking.ride);
        if (ride) {
          io.to(String(ride.driver)).emit('booking:cancelled', {
            bookingId: String(booking._id),
            rideId: String(ride._id),
            seats: booking.seats,
            ts: Date.now()
          });
        }
      }
    } catch {}
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Rider booking history
router.get('/mine', auth('rider'), async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user.id })
      .sort({ createdAt: -1 })
      .populate('ride', 'name sourceLoc destLoc fare');
    res.json({ bookings });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;

// Book a multi-segment plan atomically and notify involved drivers
router.post('/plan', auth('rider'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { segments = [], passengers = 1 } = req.body || {};
    if (!Array.isArray(segments) || segments.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'segments required' });
    }

    // Load rides and validate
    const rideIds = segments.map((s) => s.rideId);
    const rides = await Ride.find({ _id: { $in: rideIds } }).session(session);
    const rideMap = new Map(rides.map((r) => [String(r._id), r]));

    for (const s of segments) {
      const r = rideMap.get(String(s.rideId));
      if (!r) { await session.abortTransaction(); return res.status(404).json({ error: 'Ride not found' }); }
      if (r.status !== 'open') { await session.abortTransaction(); return res.status(400).json({ error: 'Ride not open' }); }
      if (r.availableSeats < passengers) { await session.abortTransaction(); return res.status(400).json({ error: 'Insufficient seats' }); }
    }

    // Decrement seats and create bookings
    const bookings = [];
    for (const s of segments) {
      const r = rideMap.get(String(s.rideId));
      r.availableSeats -= passengers;
      if (r.availableSeats === 0) r.status = 'booked';
      await r.save({ session });

      const amount = Math.max(0, Number(r.fare || 0)) * Number(passengers);
      const b = await Booking.create([{
        ride: r._id,
        rider: req.user.id,
        seats: passengers,
        amount,
        paymentProvider: 'razorpay',
        status: 'confirmed' // Auto-confirm plan bookings
      }], { session });
      bookings.push(b[0]);
    }

    await session.commitTransaction();

    // Notify each segment's driver about new confirmed booking
    try {
      const io = req.app.get('io');
      if (io) {
        for (const booking of bookings) {
          io.to(String(booking.ride)).emit('booking:new', { 
            bookingId: String(booking._id), 
            rideId: String(booking.ride), 
            seats: booking.seats,
            riderName: 'Rider'
          });
        }
      }
    } catch {}

    res.json({ bookings });
  } catch (e) {
    try { await session.abortTransaction(); } catch {}
    res.status(500).json({ error: 'Plan booking failed' });
  } finally {
    session.endSession();
  }
});
