import axios from 'axios';

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreRide({ ride, sourceLoc, destLoc }) {
  const srcKm = ride?.sourceLoc?.coordinates ? haversineKm(sourceLoc.coordinates, ride.sourceLoc.coordinates) : 999;
  const dstKm = ride?.destLoc?.coordinates && destLoc?.coordinates ? haversineKm(destLoc.coordinates, ride.destLoc.coordinates) : 0;
  const fare = Number(ride.fare || 0);
  const seats = Number(ride.availableSeats || 0);
  const timeTs = ride.time ? new Date(ride.time).getTime() : 0;
  const now = Date.now();
  const timeDiffH = timeTs > 0 ? Math.abs(timeTs - now) / (1000 * 60 * 60) : 12; // nearer to now gets better

  // Weighted inverse scoring: lower distance, lower fare, more seats, time closer to now
  const score =
    0.45 * (1 / (1 + srcKm)) +
    0.25 * (1 / (1 + dstKm)) +
    0.20 * (1 / (1 + fare)) +
    0.07 * (seats / 6) +
    0.03 * (1 / (1 + timeDiffH));

  return { _score: score, meta: { srcKm: +srcKm.toFixed(1), dstKm: +dstKm.toFixed(1), fare, seats, timeDiffH: +timeDiffH.toFixed(1) } };
}

async function llmExplain({ hfKey, topRides }) {
  try {
    if (!hfKey) return null;
    const model = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
    const prompt =
      `You are ranking carpool rides. For each item, explain briefly in 1 sentence why it is recommended, focusing on proximity to pickup/drop and price. ` +
      `Return a JSON array of objects with keys id and reason. Items: ${JSON.stringify(topRides.map(r => ({ id: r._id, fare: r.fare, srcKm: r._ai.meta.srcKm, dstKm: r._ai.meta.dstKm })))}.`;
    const { data } = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${hfKey}` }, timeout: 12000 }
    );
    const text = Array.isArray(data) ? data[0]?.generated_text || data[0]?.summary_text || '' : (data?.generated_text || '');
    try {
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      }
    } catch {}
    return null;
  } catch {
    return null;
  }
}

export async function aiRankRides({ sourceLoc, destLoc, rides }) {
  const hfKey = process.env.HF_API_KEY;

  // Heuristic score first
  const withScores = rides.map((r) => {
    const scored = scoreRide({ ride: r, sourceLoc, destLoc });
    return { ...r, _ai: scored };
  });
  withScores.sort((a, b) => b._ai._score - a._ai._score);

  // Try to get LLM reasons for top N
  const topN = withScores.slice(0, 8);
  const llm = await llmExplain({ hfKey, topRides: topN });
  const reasonMap = new Map(Array.isArray(llm) ? llm.map((x) => [String(x.id), x.reason]) : []);

  return withScores.map((r) => ({
    ...r,
    _score: r._ai._score,
    aiReason: reasonMap.get(String(r._id)) || `Close to pickup (~${r._ai.meta.srcKm} km), good price (₹${r.fare}).`
  }));
}
