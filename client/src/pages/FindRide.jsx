import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, ButtonSecondary, Input, Badge, SkeletonLine, Alert } from '../components/UI.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import { getRouteAndEta } from '../lib/ors';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
// lightweight ride type illustrations
const rideIllos = {
  car: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 64'><rect x='8' y='28' rx='8' width='64' height='20' fill='#111'/><rect x='16' y='18' rx='6' width='48' height='16' fill='#fff'/><circle cx='24' cy='52' r='6' fill='#111'/><circle cx='56' cy='52' r='6' fill='#111'/></svg>")}`,
  suv: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 64'><rect x='6' y='28' rx='6' width='70' height='22' fill='#111'/><rect x='14' y='14' rx='6' width='50' height='18' fill='#fff'/><circle cx='22' cy='54' r='6' fill='#111'/><circle cx='60' cy='54' r='6' fill='#111'/></svg>")}`,
  bike: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 64'><circle cx='26' cy='44' r='8' fill='#111'/><circle cx='58' cy='44' r='8' fill='#111'/><rect x='30' y='28' width='18' height='4' fill='#111'/><rect x='44' y='24' width='10' height='4' fill='#111'/></svg>")}`,
  auto: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 64'><rect x='10' y='30' width='52' height='16' rx='6' fill='#111'/><rect x='16' y='20' width='36' height='14' rx='4' fill='#22c55e'/><circle cx='24' cy='48' r='6' fill='#111'/><circle cx='50' cy='48' r='6' fill='#111'/></svg>")}`,
};

function FindRide() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxDistanceMeters, setMaxDistance] = useState('');
  const [error, setError] = useState('');
  const [showAiPreferences, setShowAiPreferences] = useState(false);
  const [reasonFor, setReasonFor] = useState(null); // For showing AI reasons
  const [bookingModal, setBookingModal] = useState(null); // For booking confirmation modal
  const [etaData, setEtaData] = useState(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [center, setCenter] = useState([28.6139, 77.2090]);
  const [selfPos, setSelfPos] = useState(null);
  const navigate = useNavigate();
  const [srcQuery, setSrcQuery] = useState('');
  const [dstQuery, setDstQuery] = useState('');
  const [srcCoord, setSrcCoord] = useState(null);
  const [dstCoord, setDstCoord] = useState(null);
  const [srcOpts, setSrcOpts] = useState([]);
  const [dstOpts, setDstOpts] = useState([]);
  const [focusField, setFocusField] = useState(null);
  const [seats, setSeats] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [routeCoords, setRouteCoords] = useState([]); // [[lat,lng], ...]
  const [plans, setPlans] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planAdvice, setPlanAdvice] = useState({}); // { index: { etaMin, reachBy, leaveBy } }
  const [showAllRides, setShowAllRides] = useState(false);
  // helpers
  async function setCurrentTo(field) {
    try {
      if (!navigator.geolocation) { setNotice('Geolocation not supported in this browser.'); return; }
      const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      );
      const { latitude, longitude } = pos.coords;
      // reverse geocode label
      let label = 'Current location';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (data?.display_name) label = data.display_name;
      } catch {}
      if (field === 'src') { setSrcCoord([latitude, longitude]); setSrcQuery(label); }
      if (field === 'dst') { setDstCoord([latitude, longitude]); setDstQuery(label); }
      setFocusField(null);
      setNotice('');
    } catch (err) {
      const code = err && (err.code || err.name);
      if (code === 1 || code === 'PERMISSION_DENIED') setNotice('Location permission denied. You can still search nearby rides.');
      else if (code === 2 || code === 'POSITION_UNAVAILABLE') setNotice('Location unavailable. Please try again.');
      else if (code === 3 || code === 'TIMEOUT') setNotice('Getting your location timed out. Try again.');
      else setNotice('Could not get your location. Please check site permissions.');
    }

  }

  async function getPlans() {
    setError('');
    setNotice('');
    setPlanLoading(true);
    try {
      let sourceLoc;
      let destLoc;
      if (srcCoord) sourceLoc = { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] };
      if (dstCoord) destLoc = { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] };
      if (!sourceLoc || !destLoc) {
        setError('Please select both source and destination for trip plans.');
        setPlanLoading(false);
        return;
      }
      const when = pickupTime || null;
      const body = { sourceLoc, destLoc, when, passengers: Number(seats) || 1, maxTransfers: 1, maxDistanceMeters: Number(maxDistanceMeters) || 20000 };
      const { data } = await api.post('/api/rides/itineraries', body);
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
      if (!data?.plans?.length) setNotice('No AI trip plans found. Try widening distance or time.');
    } catch (e) {
      setError('Failed to get AI plans');
    } finally {
      setPlanLoading(false);
    }
  }

  // Compute pickup timing advice for each plan
  useEffect(() => {
    (async () => {
      try {
        if (!plans || plans.length === 0) { setPlanAdvice({}); return; }
        // Determine current start point
        let startLatLng = selfPos;
        if (!startLatLng && navigator.geolocation) {
          await new Promise((resolve) => navigator.geolocation.getCurrentPosition((pos) => {
            startLatLng = [pos.coords.latitude, pos.coords.longitude];
            resolve();
          }, () => resolve()));
        }
        if (!startLatLng) { setPlanAdvice({}); return; }
        const start = [startLatLng[1], startLatLng[0]]; // [lng,lat]

        const nextAdvice = {};
        for (let i = 0; i < plans.length; i++) {
          const p = plans[i];
          const firstRide = p?.segments?.[0]?.ride;
          const pickup = firstRide?.sourceLoc?.coordinates; // [lng,lat]
          if (!pickup) continue;
          try {
            const eta = await getRouteAndEta({ start, end: pickup });
            const etaMin = Number(eta?.minutes || 0);
            const depMs = firstRide?.time ? new Date(firstRide.time).getTime() : 0;
            if (depMs > 0 && etaMin > 0) {
              const reachBy = new Date(depMs);
              const leaveBy = new Date(depMs - etaMin * 60 * 1000);
              nextAdvice[i] = { etaMin, reachBy: reachBy.toISOString(), leaveBy: leaveBy.toISOString() };
            } else {
              nextAdvice[i] = { etaMin };
            }
          } catch {}
        }
        setPlanAdvice(nextAdvice);
      } catch {}
    })();
  }, [plans, selfPos]);

  async function bookPlan(plan) {
    try {
      const segments = (plan?.segments || []).map((s) => ({ rideId: s?.ride?._id }));
      if (segments.length === 0) { setError('Invalid plan'); return; }
      const passengers = Number(seats) || 1;
      await api.post('/api/booking/plan', { segments, passengers });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'success', message: 'Plan requested. Drivers will be notified.' } }));
      setNotice('Sent booking requests for all segments. You will be notified upon acceptance.');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Plan booking failed';
      setError(msg);
    }
  }

  async function autoBookBest() {
    setError('');
    setNotice('');
    
    // Validate inputs first
    if (!srcCoord || !dstCoord) {
      setError('Please select both source and destination before auto-booking.');
      return;
    }
    
    if (!srcQuery.trim() || !dstQuery.trim()) {
      setError('Please enter valid source and destination locations.');
      return;
    }
    
    setLoading(true);
    try {
      const maxDist = Number(maxDistanceMeters) || 15000;
      const sourceLoc = { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] };
      const destLoc = { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] };
      
      const { data } = await api.post('/api/booking/auto', {
        sourceLoc,
        destLoc,
        maxDistanceMeters: maxDist,
        seats: Number(seats) || 1
      });

      if (data.booking && data.ride) {
        // Show booking confirmation modal instead of redirecting immediately
        setBookingModal({
          booking: data.booking,
          ride: data.ride,
          sourceQuery: srcQuery,
          destQuery: dstQuery
        });
        setNotice('🎉 Best ride found! Please confirm your booking.');
      } else {
        setError('Auto-book failed: No response from server');
      }
      setLoading(false);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Auto-book failed';
      setError(msg);
      setLoading(false);
    }
  }

  function confirmBooking() {
    if (bookingModal) {
      // Navigate to payment with booking details
      navigate('/payment', { state: { 
        bookingId: bookingModal.booking._id, 
        amount: bookingModal.booking.amount 
      }});
      setBookingModal(null);
    }
  }

  function cancelBooking() {
    setBookingModal(null);
    setNotice('');
  }

  async function cancelRideBooking() {
    if (!bookingModal?.booking?._id) return;
    
    try {
      setLoading(true);
      await api.delete(`/api/booking/${bookingModal.booking._id}`);
      setBookingModal(null);
      setNotice('🚫 Booking cancelled successfully.');
      setLoading(false);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to cancel booking';
      setError(msg);
      setLoading(false);
    }
  }

  // Apply client-side filters (seats/time/destination distance)
  const filteredRides = rides.filter((r) => {
    const okSeats = !seats || Number(r.availableSeats || 0) >= Number(seats);

    // Filter by pickup time window if user selected a time
    if (pickupTime) {
      const rideTs = r.time ? new Date(r.time).getTime() : 0;
      const selectedTs = new Date(pickupTime).getTime();
      // accept rides within +/- 90 minutes of selected time
      const diff = Math.abs(rideTs - selectedTs);
      if (!(okSeats && (rideTs > 0 ? diff <= 90 * 60 * 1000 : true))) return false;
    } else if (!okSeats) {
      return false;
    }

    // Filter by distance to destination: only keep rides whose drop is within 10 km
    const dstKm = r?._ai?.meta?.dstKm;
    if (typeof dstKm === 'number' && dstKm > 10) return false;

    return true;
  });

  const sortedRides = [...filteredRides].sort((a, b) => {
    const aDst = a?._ai?.meta?.dstKm;
    const bDst = b?._ai?.meta?.dstKm;
    const aVal = typeof aDst === 'number' ? aDst : Number.POSITIVE_INFINITY;
    const bVal = typeof bDst === 'number' ? bDst : Number.POSITIVE_INFINITY;
    return aVal - bVal;
  });

  const primaryRides = sortedRides.slice(0, 2);
  const extraRides = sortedRides.slice(2);

  // Initialize user position on mount for map centering
  useEffect(() => {
    if (!navigator.geolocation) {
      setNotice('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
        setSelfPos([latitude, longitude]);
      },
      () => setNotice('Location permission denied. You can still search nearby rides.')
    );
  }, []);

  useEffect(() => {
    const q = srcQuery.trim();
    if (q.length < 3) { setSrcOpts([]); return; }
    const ctrl = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setSrcOpts((data || []).slice(0, 5));
      } catch {}
    };
    run();
    return () => ctrl.abort();
  }, [srcQuery]);

  useEffect(() => {
    const q = dstQuery.trim();
    if (q.length < 3) { setDstOpts([]); return; }
    const ctrl = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setDstOpts((data || []).slice(0, 5));
      } catch {}
    };
    run();
    return () => ctrl.abort();
  }, [dstQuery]);

  // When both source and destination are chosen, fetch a route and draw polyline
  useEffect(() => {
    (async () => {
      try {
        if (!srcCoord || !dstCoord) { setRouteCoords([]); return; }
        const start = [srcCoord[1], srcCoord[0]]; // [lng, lat]
        const end = [dstCoord[1], dstCoord[0]];   // [lng, lat]
        const res = await getRouteAndEta({ start, end });
        setRouteCoords(Array.isArray(res.coords) ? res.coords : []);
        // center the map roughly to mid-point
        const mid = [(srcCoord[0] + dstCoord[0]) / 2, (srcCoord[1] + dstCoord[1]) / 2];
        setCenter(mid);
      } catch (_) {
        setRouteCoords([]);
      }
    })();
  }, [srcCoord, dstCoord]);

  async function search() {
    setError('');
    setLoading(true);
    try {
      const maxDist = Number(maxDistanceMeters) || 15000;
      let sourceLoc;
      let destLoc;
      if (srcCoord) {
        sourceLoc = { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] };
      }
      if (dstCoord) {
        destLoc = { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] };
      }
      if (!sourceLoc || !destLoc) {
        setError('Please select both source and destination before searching.');
        setLoading(false);
        return;
      }
      const { data } = await api.post('/api/rides/match', { sourceLoc, destLoc, maxDistanceMeters: maxDist });
      setRides(data.rides || []);
      setLoading(false);
    } catch (e) {
      setError('Search failed');
      setLoading(false);
    }
  }

  async function showEta(ride) {
    try {
      setEtaFor((prev) => (prev === ride._id ? null : ride._id));
      setEtaData(null);
      setNotice('');
      setEtaLoading(true);
      if (!navigator.geolocation) { setNotice('Geolocation not supported'); setEtaLoading(false); return; }
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
      const start = [pos.coords.longitude, pos.coords.latitude];
      const end = ride?.destLoc?.coordinates || ride?.sourceLoc?.coordinates;
      if (!end) { setNotice('Ride geolocation unavailable'); setEtaLoading(false); return; }
      try {
        const eta = await getRouteAndEta({ start, end });
        setEtaData(eta);
      } catch (err) {
        if (String(err?.message || '').includes('Missing ORS key')) {
          setNotice('ETA requires an ORS API key. Set VITE_ORS_API_KEY in client/.env');
        } else {
          setNotice('Unable to fetch directions.');
        }
      }
    } catch (e) {
      setNotice('Unable to fetch directions.');
    } finally {
      setEtaLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <LoadingOverlay show={loading || etaLoading} text={etaLoading ? 'Fetching ETA...' : 'Searching rides...'} />
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Find Ride</h2>

      {/* Procedures / How it works */}
      <Card className="p-4" style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)', borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>How to find and book a ride</div>
        <ol className="mt-2 list-decimal pl-5 text-sm" style={{ color: 'var(--muted)' }}>
          <li>Tap <span className="font-medium" style={{ color: 'var(--text)' }}>Search</span> to locate rides near your current position.</li>
          <li>Use <span className="font-medium" style={{ color: 'var(--text)' }}>Directions / ETA</span> on a card to view travel time.</li>
          <li>Click <span className="font-medium" style={{ color: 'var(--text)' }}>Book</span> to proceed to payment and confirm your seat.</li>
        </ol>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 h-[40vh] lg:h-[70vh] rounded-xl overflow-hidden border min-w-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
            {selfPos && <Marker position={selfPos} />}
            {dstCoord && <Marker position={[dstCoord[0], dstCoord[1]]} />}
            {routeCoords && routeCoords.length > 1 && (
              <Polyline positions={routeCoords} pathOptions={{ color: '#FFC043', weight: 4 }} />
            )}
          </MapContainer>
        </div>

        <div className="space-y-3 min-w-[320px] w-full lg:sticky lg:top-20 self-start">
          <Card className="p-3" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Source</div>
                <Input title="Source" className="w-full" value={srcQuery} onChange={(e)=>{ setSrcQuery(e.target.value); setFocusField('src'); }} placeholder="Enter pickup location" />
                <div className="mt-1 text-right">
                  <button type="button" className="text-[11px] px-2 py-0.5 rounded border" onClick={()=>setCurrentTo('src')} style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>Use my location</button>
                </div>
                {focusField==='src' && srcOpts.length>0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
                    {srcOpts.map((opt)=> (
                      <button key={opt.place_id} className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" onClick={()=>{ setSrcQuery(opt.display_name); setSrcCoord([Number(opt.lat), Number(opt.lon)]); setSrcOpts([]); setFocusField(null); }} style={{ color: 'var(--text)' }}>
                        {opt.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Destination</div>
                <Input title="Destination" className="w-full" value={dstQuery} onChange={(e)=>{ setDstQuery(e.target.value); setFocusField('dst'); }} placeholder="Enter drop location" />
                <div className="mt-1 text-right">
                  <button type="button" className="text-[11px] px-2 py-0.5 rounded border" onClick={()=>setCurrentTo('dst')} style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>Use my location</button>
                </div>
                {focusField==='dst' && dstOpts.length>0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
                    {dstOpts.map((opt)=> (
                      <button key={opt.place_id} className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" onClick={()=>{ setDstQuery(opt.display_name); setDstCoord([Number(opt.lat), Number(opt.lon)]); setDstOpts([]); setFocusField(null); }} style={{ color: 'var(--text)' }}>
                        {opt.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Search radius (meters)</div>
                <Input title="Search radius (meters)" className="w-full" type="number" value={maxDistanceMeters} onChange={(e)=>setMaxDistance(e.target.value)} placeholder="e.g. 15000" />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="button" className="text-xs px-2 py-1 rounded-full border hover:bg-black/5" onClick={()=>setMaxDistance(5000)} style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>5km</button>
                  <button type="button" className="text-xs px-2 py-1 rounded-full border hover:bg-black/5" onClick={()=>setMaxDistance(15000)} style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>15km</button>
                  <button type="button" className="text-xs px-2 py-1 rounded-full border hover:bg-black/5" onClick={async ()=>{ await setCurrentTo('src'); }} style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>Near me</button>
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-2 items-end">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Seats needed</div>
                  <Input title="Seats needed" className="w-full" type="number" min={1} max={6} value={seats} onChange={(e)=>setSeats(e.target.value)} placeholder="1" />
                </div>
                <div>
                  <div className="text-xs mb-1 flex items-center justify-between gap-2" style={{ color: 'var(--muted)' }}>
                    <span>Pickup time (optional)</span>
                    <button type="button" className="text-[11px] px-2 py-0.5 rounded border" onClick={()=>{ const el = document.getElementById('pickupTime'); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }} style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>Reserve</button>
                  </div>
                  <Input id="pickupTime" title="Pickup time" type="datetime-local" value={pickupTime} onChange={(e)=>setPickupTime(e.target.value)} placeholder="Select time" />
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-2">
                <Button className="w-full h-12" disabled={loading} onClick={search} style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}>Search</Button>
                <ButtonSecondary className="w-full h-12" onClick={()=>{ setRides([]); setError(''); setNotice(''); setEtaFor(null); setEtaData(null); setSrcQuery(''); setDstQuery(''); setSrcCoord(null); setDstCoord(null); setSrcOpts([]); setDstOpts([]); setSeats(1); setPickupTime(''); }}>Clear</ButtonSecondary>
              </div>
              <div className="md:col-span-2">
                <Button 
                  className="w-full h-12" 
                  disabled={loading || !srcCoord || !dstCoord || !srcQuery.trim() || !dstQuery.trim()} 
                  onClick={autoBookBest}
                  style={(loading || !srcCoord || !dstCoord || !srcQuery.trim() || !dstQuery.trim()) ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
                >
                  Auto-book best
                </Button>
              </div>
              <div className="md:col-span-2">
                <Button className="w-full h-12" disabled={planLoading} onClick={getPlans}>
                  Trip plans (ai)
                </Button>
              </div>
            </div>
            <AnimatePresence>
              {(error || notice) && (
                <motion.div className="mt-3" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {error && <Alert type="error">{error}</Alert>}
                  {notice && <Alert type="info">{notice}</Alert>}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <SkeletonLine className="h-4 w-2/3" />
                  <SkeletonLine className="h-3 w-1/2 mt-3" />
                  <SkeletonLine className="h-8 w-full mt-5" />
                </Card>
              ))}
            </div>
          ) : (
            <ul className="grid gap-3">
              {primaryRides.map((r) => (
                <li key={r._id}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>{r.source} → {r.destination}</div>
                      <Badge>{r.status || 'Open'}</Badge>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                      Closest to destination • ~{r?._ai?.meta?.dstKm ?? '?'} km from drop
                    </div>
                    <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Fare: ₹{r.fare} • Seats: {r.availableSeats}</div>
                    {r.time && <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{new Date(r.time).toLocaleString()}</div>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button onClick={()=>showEta(r)}>Directions / ETA</Button>
                      <ButtonSecondary onClick={()=>navigate('/payment', { state: { rideId: r._id, amount: Number(r.fare) * 100 } })}>Book</ButtonSecondary>
                    </div>
                    <div className="mt-2">
                      <button className="text-xs underline hover:opacity-80" onClick={()=> setReasonFor(prev => prev === r._id ? null : r._id)} style={{ color: 'var(--muted)' }}>
                        {reasonFor === r._id ? 'Hide reason' : 'Why recommended'}
                      </button>
                    </div>
                    <AnimatePresence>
                      {reasonFor === r._id && r.aiReason && (
                        <motion.div
                          className="mt-2 text-xs rounded-md p-3"
                          style={{ background: 'color-mix(in oklab, var(--primary) 8%, transparent)', color: 'var(--text)' }}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                        >
                          {r.aiReason}
                        </motion.div>
                      )}
                      {etaFor === r._id && etaData && (
                        <motion.div
                          className="mt-3 text-sm rounded-md p-3"
                          style={{ background: 'color-mix(in oklab, var(--primary) 10%, transparent)', color: 'var(--text)' }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                        >
                          ETA: {etaData.minutes} min • Distance: {etaData.km} km
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </li>
              ))}

              {extraRides.length > 0 && (
                <li>
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full text-xs py-2 rounded border hover:bg-black/5"
                      style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--muted)' }}
                      onClick={() => setShowAllRides((v) => !v)}
                    >
                      {showAllRides ? 'Hide additional rides' : `Show ${extraRides.length} more rides`}
                    </button>

                    <AnimatePresence>
                      {showAllRides && (
                        <motion.ul
                          className="grid gap-2"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                        >
                          {extraRides.map((r) => (
                            <li key={r._id}>
                              <Card className="px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                                    {r.source} → {r.destination}
                                  </div>
                                  <Badge>{r.status || 'Open'}</Badge>
                                </div>
                                <div className="mt-1 text-[11px] flex flex-wrap gap-1" style={{ color: 'var(--muted)' }}>
                                  <span>Fare: ₹{r.fare}</span>
                                  <span>• Seats: {r.availableSeats}</span>
                                  {r?._ai?.meta?.dstKm != null && (
                                    <span>• ~{r._ai.meta.dstKm} km to drop</span>
                                  )}
                                </div>
                                <div className="mt-2 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className="text-[11px] underline"
                                    style={{ color: 'var(--muted)' }}
                                    onClick={() => showEta(r)}
                                  >
                                    ETA
                                  </button>
                                  <button
                                    type="button"
                                    className="text-[11px] underline"
                                    style={{ color: 'var(--muted)' }}
                                    onClick={() => navigate('/payment', { state: { rideId: r._id, amount: Number(r.fare) * 100 } })}
                                  >
                                    Book
                                  </button>
                                </div>
                              </Card>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              )}

              {(!sortedRides || sortedRides.length === 0) && (
                <Card className="p-5">
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>No rides found yet. Try adjusting the distance and search again.</div>
                </Card>
              )}
            </ul>
          )}

          {plans && plans.length > 0 && (
            <div className="mt-4 space-y-3">
              {plans.map((p, idx) => (
                <Card key={idx} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>Trip plan #{idx + 1}</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>Confidence: {(p.confidence * 100).toFixed(0)}%</div>
                  </div>
                  <div className="mt-2 text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                    <div>Total fare: ₹{Number(p?.totals?.fare || 0)} • Distance: {p?.totals?.distanceKm} km • Transfers: {p.transfers}</div>
                    {(() => { const adv = planAdvice[idx]; if (!adv) return null; return (
                      <div style={{ color: 'var(--muted)' }}>
                        {adv.reachBy && adv.leaveBy ? (
                          <>Reach by {new Date(adv.reachBy).toLocaleTimeString()} • Leave by {new Date(adv.leaveBy).toLocaleTimeString()}</>
                        ) : (
                          <>ETA to pickup ~ {adv.etaMin} min</>
                        )}
                      </div>
                    ); })()}
                  </div>
                  <ul className="mt-3 text-sm space-y-2" style={{ color: 'var(--text)' }}>
                    {(p.segments || []).map((s, i2) => (
                      <li key={i2} className="rounded border px-3 py-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                        <div className="font-medium">Segment {i2 + 1}: {s?.ride?.source} → {s?.ride?.destination}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>
                          {s?.ride?.time ? (`Departs: ${new Date(s.ride.time).toLocaleString()} • `) : ''}
                          Seats: {s?.ride?.availableSeats} • Fare: ₹{s?.ride?.fare}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {p.reason && <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>{p.reason}</div>}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button onClick={()=>bookPlan(p)}>Confirm & Book plan</Button>
                    <ButtonSecondary onClick={()=>navigate('/payment', { state: { amount: Number(p?.totals?.fare || 0) * 100 } })}>Pay</ButtonSecondary>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <AnimatePresence>
        {bookingModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ 
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelBooking}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                background: 'var(--surface)', 
                color: 'var(--text)',
                zIndex: 10000,
                position: 'relative',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Confirm Booking</h3>
                <button
                  onClick={cancelBooking}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  style={{ color: 'var(--muted)' }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">🚗 Ride Details</h4>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                    <div className="flex justify-between">
                      <span>From:</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{bookingModal.sourceQuery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To:</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{bookingModal.destQuery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Route:</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{bookingModal.ride.source} → {bookingModal.ride.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seats:</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{bookingModal.booking.seats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Seats:</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{bookingModal.ride.availableSeats}</span>
                    </div>
                    {bookingModal.ride.time && (
                      <div className="flex justify-between">
                        <span>Departure:</span>
                        <span className="font-medium" style={{ color: 'var(--text)' }}>
                          {new Date(bookingModal.ride.time).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">💰 Payment Details</h4>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                    <div className="flex justify-between">
                      <span>Base Fare:</span>
                      <span style={{ color: 'var(--text)' }}>₹{bookingModal.booking.amount / 100}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span style={{ color: 'var(--primary)' }}>₹{bookingModal.booking.amount / 100}</span>
                    </div>
                  </div>
                </div>

                {bookingModal.ride.aiReason && (
                  <div>
                    <h4 className="font-medium mb-2">🤖 AI Recommendation</h4>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      {bookingModal.ride.aiReason}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <ButtonSecondary onClick={cancelBooking}>
                        Close Modal
                      </ButtonSecondary>
                      <Button onClick={confirmBooking}>
                        Confirm & Pay
                      </Button>
                    </div>
                    <Button 
                      onClick={cancelRideBooking}
                      disabled={loading}
                      style={{ 
                        background: '#dc2626', 
                        color: 'white',
                        width: '100%',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '12px 16px',
                        border: '2px solid #dc2626',
                        borderRadius: '8px'
                      }}
                      className="hover:bg-red-700 transition-colors"
                    >
                      {loading ? '⏳ Cancelling...' : '🚫 CANCEL RIDE BOOKING'}
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-center font-medium" style={{ color: 'var(--muted)' }}>
                    ⚠️ This will permanently delete your booking
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FindRide;
