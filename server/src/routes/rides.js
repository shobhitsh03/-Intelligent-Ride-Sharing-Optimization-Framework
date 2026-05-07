import { Router } from 'express';
import Ride from '../models/Ride.js';
import auth from '../middleware/auth.js';
import { aiRankRides } from '../services/aiService.js';
import { planItineraries } from '../services/aiPlanner.js';
import { prepareRideData, createBlock, createGenesisBlock } from '../services/blockchainService.js';

const router = Router();

// Get all available rides (for riders to browse)
router.get('/', async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'open' })
      .populate('driver', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ rides });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Driver creates a ride
router.post('/create', auth('driver'), async (req, res) => {
  try {
    const { source, destination, sourceLoc, destLoc, availableSeats, fare, time, vehicle, subtype, plate, vehiclePhoto, amenities } = req.body;

    // Get the last ride to link in the blockchain
    const lastRide = await Ride.findOne().sort({ blockIndex: -1 });

    // Prepare ride data
    const rideData = {
      driver: req.user.id,
      source,
      destination,
      sourceLoc,
      destLoc,
      availableSeats,
      fare,
      time,
      vehicle,
      subtype,
      plate,
      vehiclePhoto,
      amenities
    };

    let block;
    if (!lastRide) {
      // Create genesis block (first block)
      block = createGenesisBlock(prepareRideData(rideData));
    } else {
      // Create new block linking to previous
      block = createBlock(
        prepareRideData(rideData),
        lastRide.blockHash,
        lastRide.blockIndex + 1
      );
    }

    const ride = await Ride.create({
      ...rideData,
      blockIndex: block.index,
      previousHash: block.previousHash,
      blockHash: block.blockHash,
      blockTimestamp: block.timestamp
    });

    res.json({ ride });
  } catch (e) {
    console.error('Error creating ride:', e);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Get a single ride by ID
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name email');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json({ ride });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch ride' });
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

export default router;
