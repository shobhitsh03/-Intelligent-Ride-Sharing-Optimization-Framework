import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Ride from '../models/Ride.js';
import auth from '../middleware/auth.js';
import { aiRankRides } from '../services/aiService.js';

const router = Router();

router.post('/create', auth('rider'), async (req, res) => {
  try {
    const { rideId, seats = 1, amount, paymentProvider } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'open') return res.status(400).json({ error: 'Ride not available' });
    if (ride.availableSeats < seats) return res.status(400).json({ error: 'Insufficient seats' });

    const booking = await Booking.create({
      ride: ride._id,
      rider: req.user.id,
      seats,
      amount,
      paymentProvider
    });

    res.json({ booking });
  } catch (e) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Auto-book best ranked ride and notify driver
router.post('/auto', auth('rider'), async (req, res) => {
  try {
    const { sourceLoc, destLoc, maxDistanceMeters = 15000, seats = 1 } = req.body;
    if (!sourceLoc || !sourceLoc.coordinates) return res.status(400).json({ error: 'sourceLoc required' });

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
    const amount = Math.round(Math.max(0, perKm * (reqKm || rideKm)) * Number(seats));
    const booking = await Booking.create({
      ride: best._id,
      rider: req.user.id,
      seats,
      amount,
      paymentProvider: 'razorpay',
      status: 'pending'
    });

    // Notify driver via Socket.IO (driver should join room with their userId on client)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(String(best.driver)).emit('booking:request', {
          rideId: String(best._id),
          bookingId: String(booking._id),
          seats,
          amount,
          ts: Date.now()
        });
      }
    } catch {}

    res.json({ booking, ride: best });
  } catch (e) {
    res.status(500).json({ error: 'Auto-book failed' });
  }
});

// Driver accepts a booking: decrement seats atomically, confirm booking, notify rider
router.patch('/:id/accept', auth('driver'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) { await session.abortTransaction(); return res.status(404).json({ error: 'Booking not found' }); }
    if (booking.status !== 'pending') { await session.abortTransaction(); return res.status(400).json({ error: 'Booking not pending' }); }

    const ride = await Ride.findById(booking.ride).session(session);
    if (!ride) { await session.abortTransaction(); return res.status(404).json({ error: 'Ride not found' }); }
    if (String(ride.driver) !== String(req.user.id)) { await session.abortTransaction(); return res.status(403).json({ error: 'Forbidden' }); }
    if (ride.status !== 'open') { await session.abortTransaction(); return res.status(400).json({ error: 'Ride not open' }); }
    if (ride.availableSeats < booking.seats) { await session.abortTransaction(); return res.status(400).json({ error: 'Insufficient seats' }); }

    ride.availableSeats -= booking.seats;
    if (ride.availableSeats === 0) ride.status = 'booked';
    await ride.save({ session });

    booking.status = 'paid'; // or 'confirmed'
    await booking.save({ session });

    await session.commitTransaction();

    // Notify rider
    try {
      const io = req.app.get('io');
      if (io) io.to(String(booking.rider)).emit('booking:update', { bookingId: String(booking._id), status: 'accepted', rideId: String(ride._id), seats: booking.seats });
    } catch {}

    res.json({ booking, ride });
  } catch (e) {
    try { await session.abortTransaction(); } catch {}
    res.status(500).json({ error: 'Accept failed' });
  } finally {
    session.endSession();
  }
});

// Driver declines a booking: cancel booking, notify rider
router.patch('/:id/decline', auth('driver'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const ride = await Ride.findById(booking.ride);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (String(ride.driver) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking not pending' });

    booking.status = 'cancelled';
    await booking.save();

    try {
      const io = req.app.get('io');
      if (io) io.to(String(booking.rider)).emit('booking:update', { bookingId: String(booking._id), status: 'declined', rideId: String(ride._id) });
    } catch {}

    res.json({ booking });
  } catch (e) {
    res.status(500).json({ error: 'Decline failed' });
  }
});

// Rider booking history
router.get('/mine', auth('rider'), async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user.id })
      .sort({ createdAt: -1 })
      .populate('ride');
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
        status: 'pending'
      }], { session });
      bookings.push(b[0]);
    }

    await session.commitTransaction();

    // Notify each segment's driver of a booking request
    try {
      const io = req.app.get('io');
      if (io) {
        for (const b of bookings) {
          const r = rideMap.get(String(b.ride));
          io.to(String(r.driver)).emit('booking:request', {
            rideId: String(r._id),
            bookingId: String(b._id),
            seats: b.seats,
            amount: b.amount,
            ts: Date.now()
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
