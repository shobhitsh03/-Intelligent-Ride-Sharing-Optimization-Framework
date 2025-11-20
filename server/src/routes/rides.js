import { Router } from 'express';
import Ride from '../models/Ride.js';
import auth from '../middleware/auth.js';
import { aiRankRides } from '../services/aiService.js';
import { planItineraries } from '../services/aiPlanner.js';

const router = Router();

// Driver creates a ride
router.post('/create', auth('driver'), async (req, res) => {
  try {
    const { source, destination, sourceLoc, destLoc, availableSeats, fare, time } = req.body;
    const ride = await Ride.create({
      driver: req.user.id,
      source,
      destination,
      sourceLoc,
      destLoc,
      availableSeats,
      fare,
      time
    });
    res.json({ ride });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Driver ride history
router.get('/mine', auth('driver'), async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user.id }).sort({ createdAt: -1 });
    res.json({ rides });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Rider searches rides near source and destination
router.post('/search', async (req, res) => {
  try {
    const { sourceLoc, destLoc, maxDistanceMeters = 10000 } = req.body;
    const rides = await Ride.find({
      status: 'open',
      sourceLoc: {
        $near: {
          $geometry: sourceLoc,
          $maxDistance: maxDistanceMeters
        }
      }
    }).limit(50);
    res.json({ rides });
  } catch (e) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// AI + geo-based match ranking
router.post('/match', async (req, res) => {
  try {
    const { sourceLoc, destLoc, maxDistanceMeters = 15000 } = req.body;
    const candidates = await Ride.find({
      status: 'open',
      sourceLoc: { $near: { $geometry: sourceLoc, $maxDistance: maxDistanceMeters } }
    }).limit(50).lean();

    const ranked = await aiRankRides({ sourceLoc, destLoc, rides: candidates });
    res.json({ rides: ranked });
  } catch (e) {
    res.status(500).json({ error: 'Match failed' });
  }
});

export default router;

// New: AI itineraries
router.post('/itineraries', async (req, res) => {
  try {
    const { sourceLoc, destLoc, when, passengers = 1, maxDistanceMeters = 20000, maxTransfers = 1 } = req.body || {};
    if (!sourceLoc || !sourceLoc.coordinates || !destLoc || !destLoc.coordinates) {
      return res.status(400).json({ error: 'sourceLoc and destLoc required' });
    }
    const whenMs = when ? new Date(when).getTime() : 0;
    const plans = await planItineraries({ sourceLoc, destLoc, whenMs, passengers, maxDistanceMeters, maxTransfers });
    res.json({ plans });
  } catch (e) {
    res.status(500).json({ error: 'Itineraries failed' });
  }
});
