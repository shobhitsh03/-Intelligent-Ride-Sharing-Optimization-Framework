import Ride from '../models/Ride.js';
import { aiRankRides } from './aiService.js';

function haversineKm(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1));
}

function timeAlignPenalty(rideTimeMs, desiredMs) {
  if (!rideTimeMs || !desiredMs) return 0.1; // small penalty if unknown
  const diffMin = Math.abs(rideTimeMs - desiredMs) / (60 * 1000);
  // 0 penalty within 30 min, then grows
  return Math.min(1, Math.max(0, (diffMin - 30) / 120));
}

function transferPenalty(transfers) {
  // 0 for direct, 0.25 for one transfer
  return Math.min(1, transfers * 0.25);
}

function normalize(x, max) { return Math.max(0, Math.min(1, x / max)); }

// Build simple 0/1/2-leg itineraries using existing rides; returns ranked plans
export async function planItineraries({ sourceLoc, destLoc, whenMs, passengers = 1, maxDistanceMeters = 20000, maxTransfers = 1 }) {
  // Step 1: gather candidates near source
  const nearSrc = await Ride.find({
    status: 'open',
    availableSeats: { $gte: passengers },
    sourceLoc: { $near: { $geometry: sourceLoc, $maxDistance: maxDistanceMeters } },
  }).limit(60).lean();

  // Step 2: direct matches ranking using existing AI ranker
  const directRanked = await aiRankRides({ sourceLoc, destLoc, rides: nearSrc });
  const directPlans = (directRanked || []).slice(0, 5).map((r) => {
    const start = r?.sourceLoc?.coordinates ? [r.sourceLoc.coordinates[1], r.sourceLoc.coordinates[0]] : null;
    const end = r?.destLoc?.coordinates ? [r.destLoc.coordinates[1], r.destLoc.coordinates[0]] : null;
    const distKm = start && end ? haversineKm(start, end) : 0;
    const penalty = timeAlignPenalty(r?.time ? new Date(r.time).getTime() : 0, whenMs || 0);
    const score = (r._score || 0.5) - 0.15 * penalty;
    return {
      segments: [{ ride: r, from: 'A', to: 'C' }],
      transfers: 0,
      totals: { fare: Number(r.fare || 0) * passengers, distanceKm: +distKm.toFixed(1), timeMs: 0 },
      confidence: Math.max(0.1, Math.min(0.99, score)),
      reason: r.aiReason || 'Direct ride fits pickup and drop with good proximity and timing.',
    };
  });

  if (maxTransfers <= 0) return directPlans;

  // Step 3: try simple two-leg (A->B + B->C) where B is near the first leg's drop
  const twoLegPlans = [];
  // preselect possible first legs from nearSrc
  for (const r1 of nearSrc.slice(0, 40)) {
    const r1End = r1?.destLoc?.coordinates; // [lng, lat]
    if (!r1End) continue;
    const r1EndPoint = { type: 'Point', coordinates: r1End };

    // candidates for second leg near r1 destination towards final destination
    const nearMid = await Ride.find({
      status: 'open',
      availableSeats: { $gte: passengers },
      sourceLoc: { $near: { $geometry: r1EndPoint, $maxDistance: Math.max(5000, Math.floor(maxDistanceMeters / 2)) } },
    }).limit(40).lean();

    for (const r2 of nearMid) {
      // continuity: r2 should head closer to final dest compared to r1 end
      const B = [r1End[1], r1End[0]];
      const C = destLoc?.coordinates ? [destLoc.coordinates[1], destLoc.coordinates[0]] : null;
      const r2End = r2?.destLoc?.coordinates;
      if (!C || !r2End) continue;
      const CdistFromB = haversineKm(B, C);
      const CdistFromR2End = haversineKm([r2End[1], r2End[0]], C);
      if (CdistFromR2End > CdistFromB) continue; // r2 must get us closer to C

      // time alignment: r2 should depart after r1 time, allow 15+ min buffer
      const r1Time = r1?.time ? new Date(r1.time).getTime() : 0;
      const r2Time = r2?.time ? new Date(r2.time).getTime() : 0;
      if (r1Time && r2Time && r2Time < r1Time + 15 * 60 * 1000) continue;

      // scoring
      const proxA = r1?.sourceLoc?.coordinates ? haversineKm([sourceLoc.coordinates[1], sourceLoc.coordinates[0]], [r1.sourceLoc.coordinates[1], r1.sourceLoc.coordinates[0]]) : 999;
      const proxC = r2End ? haversineKm([r2End[1], r2End[0]], C) : 999;
      const timePenalty = timeAlignPenalty(r1Time || r2Time, whenMs || 0);
      const base = 1 - normalize(proxA, 10) - normalize(proxC, 10) - 0.2 * timePenalty - transferPenalty(1);
      const fare = Number(r1.fare || 0) + Number(r2.fare || 0);
      const totalDist = (r1?.sourceLoc?.coordinates && r1?.destLoc?.coordinates ? haversineKm([r1.sourceLoc.coordinates[1], r1.sourceLoc.coordinates[0]], [r1.destLoc.coordinates[1], r1.destLoc.coordinates[0]]) : 0) + (r2?.sourceLoc?.coordinates && r2?.destLoc?.coordinates ? haversineKm([r2.sourceLoc.coordinates[1], r2.sourceLoc.coordinates[0]], [r2.destLoc.coordinates[1], r2.destLoc.coordinates[0]]) : 0);
      const confidence = Math.max(0.05, Math.min(0.95, base));

      twoLegPlans.push({
        segments: [
          { ride: r1, from: 'A', to: 'B' },
          { ride: r2, from: 'B', to: 'C' },
        ],
        transfers: 1,
        totals: { fare: fare * passengers, distanceKm: +totalDist.toFixed(1), timeMs: 0 },
        confidence,
        reason: 'Two-leg plan gets you closer to destination with minimal waiting and good proximity.',
      });

      if (twoLegPlans.length > 40) break;
    }
    if (twoLegPlans.length > 40) break;
  }

  const plans = [...directPlans, ...twoLegPlans]
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 5);

  return plans;
}
