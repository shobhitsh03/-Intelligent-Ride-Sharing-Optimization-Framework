import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import geocodingService from '../lib/geocoding';
import { Card, Button, ButtonSecondary, Input, Badge, SkeletonLine, Alert } from '../components/UI.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import { getRouteAndEta } from '../lib/ors';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { MapPin, Navigation, Search, Clock, Users, CreditCard, Car, Zap, Star, CheckCircle, Calendar, ArrowRight, Locate, Filter, TrendingUp } from 'lucide-react';

function FindRide() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxDistanceMeters, setMaxDistanceMeters] = useState('');
  const [error, setError] = useState('');
  const [reasonFor, setReasonFor] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [etaFor, setEtaFor] = useState(null);
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
  const [routeCoords, setRouteCoords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planAdvice, setPlanAdvice] = useState({});
  const [showAllRides, setShowAllRides] = useState(false);
  const [isSearchingSrc, setIsSearchingSrc] = useState(false);
  const [isSearchingDst, setIsSearchingDst] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleLocationSearch = useCallback(async (query, setResult, setIsSearching) => {
    if (!query || query.length < 3) { setResult([]); return; }
    setIsSearching(true); setGeoError('');
    try {
      console.log('Searching for:', query);
      const results = await geocodingService.geocode(query);
      console.log('Search results:', results.length, results);
      setResult(results.slice(0, 5));
      if (results.length === 0) {
        setGeoError('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeoError('Location search temporarily unavailable');
      setResult([]);
    } finally { setIsSearching(false); }
  }, []);

  // Immediate search for testing (no debouncing)
  useEffect(() => {
    const q = srcQuery.trim();
    if (q.length >= 3) {
      handleLocationSearch(q, setSrcOpts, setIsSearchingSrc);
    } else {
      setSrcOpts([]);
    }
  }, [srcQuery, handleLocationSearch]);

  useEffect(() => {
    const q = dstQuery.trim();
    if (q.length >= 3) {
      handleLocationSearch(q, setDstOpts, setIsSearchingDst);
    } else {
      setDstOpts([]);
    }
  }, [dstQuery, handleLocationSearch]);

  async function setCurrentTo(field) {
    try {
      if (!navigator.geolocation) { setNotice('Geolocation not supported by your browser'); return; }
      
      console.log('Requesting geolocation...');
      const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
      const { latitude, longitude } = pos.coords;
      console.log('Got location:', latitude, longitude);
      
      let label = 'Current location';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (data && data.display_name) label = data.display_name.split(',')[0];
      } catch (e) { console.warn('Reverse geocode failed:', e); }
      
      if (field === 'src') { setSrcCoord([latitude, longitude]); setSrcQuery(label); }
      if (field === 'dst') { setDstCoord([latitude, longitude]); setDstQuery(label); }
      setFocusField(null); setNotice('');
    } catch (error) {
      console.error('Geolocation error:', error);
      if (error.name === 'NotAllowedError') setNotice('Location permission denied. Please allow location access in your browser settings.');
      else if (error.name === 'TimeoutError') setNotice('Location request timed out. Please try again.');
      else if (error.name === 'PositionUnavailableError') setNotice('Location information unavailable.');
      else setNotice('Unable to get current location. Make sure you are using HTTPS or localhost.');
    }
  }

  async function getPlans() {
    setError(''); setNotice(''); setPlanLoading(true);
    try {
      let sourceLoc = srcCoord ? { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] } : null;
      let destLoc = dstCoord ? { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] } : null;
      if (!sourceLoc || !destLoc) { setError('Please select both source and destination'); setPlanLoading(false); return; }
      const body = { sourceLoc, destLoc, when: pickupTime || null, passengers: Number(seats) || 1, maxTransfers: 1, maxDistanceMeters: Number(maxDistanceMeters) || 20000 };
      const { data } = await api.post('/api/rides/itineraries', body);
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
      if (!data?.plans?.length) setNotice('No AI trip plans found');
    } catch (e) { setError('Failed to get AI plans'); }
    finally { setPlanLoading(false); }
  }

  useEffect(() => {
    (async () => {
      try {
        if (!plans || plans.length === 0) { setPlanAdvice({}); return; }
        let startLatLng = selfPos;
        if (!startLatLng && navigator.geolocation) {
          await new Promise((resolve) => navigator.geolocation.getCurrentPosition((pos) => { startLatLng = [pos.coords.latitude, pos.coords.longitude]; resolve(); }, () => resolve()));
        }
        if (!startLatLng) { setPlanAdvice({}); return; }
        const start = [startLatLng[1], startLatLng[0]];
        const nextAdvice = {};
        for (let i = 0; i < plans.length; i++) {
          const p = plans[i];
          const pickup = p?.segments?.[0]?.ride?.sourceLoc?.coordinates;
          if (!pickup) continue;
          try {
            const eta = await getRouteAndEta({ start, end: pickup });
            const etaMin = Number(eta?.minutes || 0);
            const depMs = p?.segments?.[0]?.ride?.time ? new Date(p.segments[0].ride.time).getTime() : 0;
            if (depMs > 0 && etaMin > 0) {
              const reachBy = new Date(depMs);
              const leaveBy = new Date(depMs - etaMin * 60 * 1000);
              nextAdvice[i] = { etaMin, reachBy: reachBy.toISOString(), leaveBy: leaveBy.toISOString() };
            } else { nextAdvice[i] = { etaMin }; }
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
      await api.post('/api/booking/plan', { segments, passengers: Number(seats) || 1 });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'success', message: 'Plan requested' } }));
      setNotice('Booking requests sent');
    } catch (e) { setError('Plan booking failed'); }
  }

  async function autoBookBest() {
    setError(''); setNotice('');
    if (!srcCoord || !dstCoord) { setError('Please select both source and destination'); return; }
    if (!srcQuery.trim() || !dstQuery.trim()) { setError('Please enter valid locations'); return; }
    setLoading(true);
    try {
      const maxDist = Number(maxDistanceMeters) || 15000;
      const sourceLoc = { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] };
      const destLoc = { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] };
      const { data } = await api.post('/api/booking/auto', { sourceLoc, destLoc, maxDistanceMeters: maxDist, seats: Number(seats) || 1 });
      if (data.booking && data.ride) {
        setBookingModal({ booking: data.booking, ride: data.ride, sourceQuery: srcQuery, destQuery: dstQuery });
        setNotice('Best ride found! Please confirm.');
      } else { setError(data.error || 'Auto-book failed'); }
    } catch (e) {
      console.error('Auto-book error:', e);
      setError(e.response?.data?.error || 'Auto-book failed. Please login as a rider.');
    }
    finally { setLoading(false); }
  }

  function confirmBooking() {
    if (bookingModal) { navigate('/payment', { state: { bookingId: bookingModal.booking._id, amount: bookingModal.booking.amount }}); setBookingModal(null); }
  }

  function cancelBooking() { setBookingModal(null); setNotice(''); }

  async function cancelRideBooking() {
    if (!bookingModal?.booking?._id) return;
    try { setLoading(true); await api.delete(`/api/booking/${bookingModal.booking._id}`); setBookingModal(null); setNotice('Booking cancelled'); }
    catch (e) { setError('Failed to cancel'); }
    finally { setLoading(false); }
  }

  const filteredRides = rides.filter((r) => {
    const okSeats = !seats || Number(r.availableSeats || 0) >= Number(seats);
    if (pickupTime) {
      const rideTs = r.time ? new Date(r.time).getTime() : 0;
      const diff = Math.abs(rideTs - new Date(pickupTime).getTime());
      if (!(okSeats && (rideTs > 0 ? diff <= 90 * 60 * 1000 : true))) return false;
    } else if (!okSeats) return false;
    const dstKm = r?._ai?.meta?.dstKm;
    if (typeof dstKm === 'number' && dstKm > 10) return false;
    return true;
  });

  const sortedRides = [...filteredRides].sort((a, b) => {
    const aVal = typeof a?._ai?.meta?.dstKm === 'number' ? a._ai.meta.dstKm : Infinity;
    const bVal = typeof b?._ai?.meta?.dstKm === 'number' ? b._ai.meta.dstKm : Infinity;
    return aVal - bVal;
  });

  const primaryRides = sortedRides.slice(0, 2);
  const extraRides = sortedRides.slice(2);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => { setCenter([pos.coords.latitude, pos.coords.longitude]); setSelfPos([pos.coords.latitude, pos.coords.longitude]); }, () => {});
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (!srcCoord || !dstCoord) { setRouteCoords([]); return; }
      try {
        const res = await getRouteAndEta({ start: [srcCoord[1], srcCoord[0]], end: [dstCoord[1], dstCoord[0]] });
        setRouteCoords(Array.isArray(res.coords) ? res.coords : []);
        setCenter([(srcCoord[0] + dstCoord[0]) / 2, (srcCoord[1] + dstCoord[1]) / 2]);
      } catch { setRouteCoords([]); }
    })();
  }, [srcCoord, dstCoord]);

  async function search() {
    setError(''); setLoading(true);
    try {
      const maxDist = Number(maxDistanceMeters) || 15000;
      const sourceLoc = srcCoord ? { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] } : null;
      const destLoc = dstCoord ? { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] } : null;
      if (!sourceLoc || !destLoc) { setError('Please select both source and destination'); setLoading(false); return; }
      const { data } = await api.post('/api/rides/match', { sourceLoc, destLoc, maxDistanceMeters: maxDist });
      setRides(data.rides || []);
    } catch (e) { setError('Search failed'); }
    finally { setLoading(false); }
  }

  async function showEta(ride) {
    try {
      setEtaFor(prev => prev === ride._id ? null : ride._id);
      setEtaData(null); setNotice(''); setEtaLoading(true);
      if (!navigator.geolocation) { setNotice('Geolocation not supported'); setEtaLoading(false); return; }
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
      const start = [pos.coords.longitude, pos.coords.latitude];
      const end = ride?.destLoc?.coordinates || ride?.sourceLoc?.coordinates;
      if (!end) { setNotice('Ride geolocation unavailable'); setEtaLoading(false); return; }
      try { setEtaData(await getRouteAndEta({ start, end })); }
      catch { setNotice('Unable to fetch directions'); }
    } catch { setNotice('Unable to fetch directions'); }
    finally { setEtaLoading(false); }
  }

  return (
    <div className="space-y-6">
      <LoadingOverlay show={loading || etaLoading} text={etaLoading ? 'Fetching ETA...' : 'Searching rides...'} />
      
      <div className="rounded-2xl p-6 border" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <Car size={28} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>Find a Ride</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Search and book rides with AI-powered matching</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Zap size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>AI Matching</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Smart recommendations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>Verified</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Trusted drivers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 h-[50vh] lg:h-[70vh] rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
            {selfPos && <Marker position={selfPos} />}
            {dstCoord && <Marker position={[dstCoord[0], dstCoord[1]]} />}
            {routeCoords && routeCoords.length > 1 && <Polyline positions={routeCoords} pathOptions={{ color: '#3b82f6', weight: 4 }} />}
          </MapContainer>
        </div>

        <div className="space-y-4 min-w-[300px] w-full lg:sticky lg:top-20 self-start">
          <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Search size={20} style={{ color: 'var(--brand)' }} />
              <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Search</div>
            </div>

            <div className="space-y-4">
              <div style={{ position: 'relative' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Pickup</div>
                <input 
                  type="text"
                  value={srcQuery}
                  onChange={e => { console.log('Input changed:', e.target.value); setSrcQuery(e.target.value); setFocusField('src'); }}
                  placeholder="Enter pickup location"
                  className="w-full px-4 py-3 text-sm rounded-2xl"
                  style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text)' }}
                />
                <div className="mt-2">
                  <button onClick={() => setCurrentTo('src')} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--brand)', color: '#111' }}>
                    Use my location
                  </button>
                </div>
                {isSearchingSrc && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Searching...</div>}
                {geoError && <div className="text-xs mt-1" style={{ color: '#dc2626' }}>{geoError}</div>}
                {/* Temporarily always show dropdown for debugging */}
                {srcOpts.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    {srcOpts.map(opt => (
                      <button key={opt.place_id} onClick={() => { setSrcQuery(opt.display_name); setSrcCoord([Number(opt.lat), Number(opt.lon)]); setSrcOpts([]); setFocusField(null); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" style={{ color: 'var(--text)' }}>
                        {opt.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {srcOpts.length === 0 && srcQuery.length >= 3 && !isSearchingSrc && (
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>No results found</div>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Destination</div>
                <Input value={dstQuery} onChange={e => { setDstQuery(e.target.value); setFocusField('dst'); }} placeholder="Enter drop location" />
                <div className="mt-2">
                  <button onClick={() => setCurrentTo('dst')} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--brand)', color: '#111' }}>
                    Use my location
                  </button>
                </div>
                {isSearchingDst && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Searching...</div>}
                {geoError && <div className="text-xs mt-1" style={{ color: '#dc2626' }}>{geoError}</div>}
                {/* Temporarily always show dropdown for debugging */}
                {dstOpts.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    {dstOpts.map(opt => (
                      <button key={opt.place_id} onClick={() => { setDstQuery(opt.display_name); setDstCoord([Number(opt.lat), Number(opt.lon)]); setDstOpts([]); setFocusField(null); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" style={{ color: 'var(--text)' }}>
                        {opt.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {dstOpts.length === 0 && dstQuery.length >= 3 && !isSearchingDst && (
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>No results found</div>
                )}
              </div>

              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Radius (meters)</div>
                <Input type="number" value={maxDistanceMeters} onChange={e => setMaxDistance(e.target.value)} placeholder="15000" />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setMaxDistance(5000)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>5km</button>
                  <button onClick={() => setMaxDistance(15000)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>15km</button>
                  <button onClick={async () => await setCurrentTo('src')} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>Near me</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Seats</div>
                  <Input type="number" min={1} max={6} value={seats} onChange={e => setSeats(e.target.value)} placeholder="1" />
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Pickup Time</div>
                  <Input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                </div>
              </div>

              <button disabled={loading} onClick={search} className="w-full h-11 rounded-xl font-semibold text-white" style={{ background: 'var(--brand)', color: '#111', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Searching...' : 'Search Rides'}
              </button>

              <button disabled={loading || !srcCoord || !dstCoord} onClick={autoBookBest} className="w-full h-11 rounded-xl font-semibold text-white" style={{ background: '#10b981', opacity: (loading || !srcCoord || !dstCoord) ? 0.7 : 1 }}>
                {loading ? 'Auto-booking...' : 'Auto-book Best'}
              </button>

              <button disabled={planLoading} onClick={getPlans} className="w-full h-11 rounded-xl font-semibold text-white" style={{ background: '#8b5cf6', opacity: planLoading ? 0.7 : 1 }}>
                {planLoading ? 'Planning...' : 'AI Trip Plans'}
              </button>
            </div>

            <AnimatePresence>
              {(error || notice) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                  {error && <Alert type="error">{error}</Alert>}
                  {notice && <Alert type="info">{notice}</Alert>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {primaryRides.map((r) => (
                <div key={r._id} className="rounded-xl p-4 border hover:shadow-md transition-shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>{r.source} → {r.destination}</div>
                    <Badge>{r.status || 'Open'}</Badge>
                  </div>
                  <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                    Closest to destination • ~{r?._ai?.meta?.dstKm ?? '?'} km
                  </div>
                  <div className="flex gap-4 mb-3 text-sm" style={{ color: 'var(--muted)' }}>
                    <span>Fare: ₹{r.fare}</span>
                    <span>Seats: {r.availableSeats}</span>
                    {r.time && <span>{new Date(r.time).toLocaleDateString()}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => showEta(r)} className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>
                      Directions
                    </button>
                    <button onClick={() => navigate('/payment', { state: { rideId: r._id, amount: Number(r.fare) * 100 } })} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--brand)', color: '#111' }}>
                      Book
                    </button>
                  </div>
                  <button className="text-xs mt-2 underline" onClick={() => setReasonFor(prev => prev === r._id ? null : r._id)} style={{ color: 'var(--muted)' }}>
                    {reasonFor === r._id ? 'Hide reason' : 'Why recommended?'}
                  </button>
                  <AnimatePresence>
                    {reasonFor === r._id && r.aiReason && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-xs p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--text)' }}>
                        {r.aiReason}
                      </motion.div>
                    )}
                    {etaFor === r._id && etaData && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-sm p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--text)' }}>
                        ETA: {etaData.minutes} min • {etaData.km} km
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {extraRides.length > 0 && (
                <button onClick={() => setShowAllRides(v => !v)} className="w-full text-xs py-2 rounded border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--muted)' }}>
                  {showAllRides ? `Hide ${extraRides.length} rides` : `Show ${extraRides.length} more`}
                </button>
              )}

              {showAllRides && (
                <div className="space-y-2">
                  {extraRides.map(r => (
                    <div key={r._id} className="rounded-lg p-3 border" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'var(--bg)' }}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color: 'var(--text)' }}>{r.source} → {r.destination}</span>
                        <Badge>{r.status || 'Open'}</Badge>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>₹{r.fare} • {r.availableSeats} seats</div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => showEta(r)} className="text-xs underline" style={{ color: 'var(--muted)' }}>ETA</button>
                        <button onClick={() => navigate('/payment', { state: { rideId: r._id, amount: Number(r.fare) * 100 } })} className="text-xs underline" style={{ color: 'var(--muted)' }}>Book</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!sortedRides || sortedRides.length === 0) && (
                <div className="rounded-xl p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>No rides found. Try adjusting the distance.</div>
                </div>
              )}
            </div>
          )}

          {plans && plans.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} style={{ color: 'var(--brand)' }} />
                <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>AI Trip Plans</div>
              </div>
              {plans.map((p, idx) => (
                <div key={idx} className="rounded-xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>Plan #{idx + 1}</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>{(p.confidence * 100).toFixed(0)}% confidence</div>
                  </div>
                  <div className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
                    Fare: ₹{p?.totals?.fare || 0} • {p?.totals?.distanceKm} km • {p.transfers} transfers
                  </div>
                  {(() => { const adv = planAdvice[idx]; if (!adv) return null; return (
                    <div className="text-xs mb-2 p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--text)' }}>
                      {adv.reachBy && adv.leaveBy ? `Reach by ${new Date(adv.reachBy).toLocaleTimeString()}` : `ETA ~ ${adv.etaMin} min`}
                    </div>
                  ); })()}
                  <div className="space-y-1 mb-2">
                    {p.segments?.map((s, i2) => (
                      <div key={i2} className="text-xs p-2 rounded" style={{ background: 'var(--bg)' }}>
                        {s?.ride?.source} → {s?.ride?.destination} • ₹{s?.ride?.fare}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => bookPlan(p)} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--brand)', color: '#111' }}>
                      Confirm
                    </button>
                    <button onClick={() => navigate('/payment', { state: { amount: Number(p?.totals?.fare || 0) * 100 } })} className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {bookingModal && (
          <motion.div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9999 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelBooking}>
            <motion.div className="rounded-xl p-6 max-w-md w-full" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Confirm Booking</h3>
                <button onClick={cancelBooking} style={{ color: 'var(--muted)' }}>✕</button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-medium mb-2">Ride Details</div>
                  <div className="space-y-1" style={{ color: 'var(--muted)' }}>
                    <div>From: {bookingModal.sourceQuery}</div>
                    <div>To: {bookingModal.destQuery}</div>
                    <div>Route: {bookingModal.ride.source} → {bookingModal.ride.destination}</div>
                    <div>Seats: {bookingModal.booking.seats}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Payment</div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>₹{bookingModal.booking.amount / 100}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={cancelBooking} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>Close</button>
                  <button onClick={confirmBooking} className="px-4 py-2 rounded-lg font-medium text-white" style={{ background: 'var(--brand)', color: '#111' }}>Confirm & Pay</button>
                </div>
                <button onClick={cancelRideBooking} disabled={loading} className="w-full px-4 py-2 rounded-lg font-medium text-white" style={{ background: '#ef4444', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FindRide;
