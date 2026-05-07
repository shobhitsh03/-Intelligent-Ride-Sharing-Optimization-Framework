import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import geocodingService from '../lib/geocoding';
import { Card, Button, Input, Select, Alert } from '../components/UI.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { Car, MapPin, Clock, Users, CreditCard, Navigation, Zap, CheckCircle, Calendar, Shield } from 'lucide-react';

export default function CreateRide() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ source: '', destination: '', availableSeats: '', fare: '', time: '' });
  const [msg, setMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [srcQuery, setSrcQuery] = useState('');
  const [dstQuery, setDstQuery] = useState('');
  const [srcCoord, setSrcCoord] = useState(null);
  const [dstCoord, setDstCoord] = useState(null);
  const [srcOpts, setSrcOpts] = useState([]);
  const [dstOpts, setDstOpts] = useState([]);
  const [isSearchingSrc, setIsSearchingSrc] = useState(false);
  const [isSearchingDst, setIsSearchingDst] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [vehicle, setVehicle] = useState('car');
  const [subtype, setSubtype] = useState('');
  const [amenities, setAmenities] = useState({ ac: true, music: false, luggage: false });
  const [plate, setPlate] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [suggestedFare, setSuggestedFare] = useState(null);
  const [center, setCenter] = useState([28.6139, 77.2090]);
  const fileInputRef = useRef(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const handleLocationSearch = useCallback(async (query, setResult, setIsSearching) => {
    if (!query || query.length < 3) {
      setResult([]);
      return;
    }
    
    setIsSearching(true);
    setGeoError('');
    
    try {
      console.log('Searching for:', query);
      const results = await geocodingService.geocode(query);
      console.log('Search results:', results.length);
      setResult(results.slice(0, 5));
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeoError('Location search temporarily unavailable. Please try again.');
      setResult([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search implementation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = srcQuery.trim();
      if (q.length >= 3) {
        handleLocationSearch(q, setSrcOpts, setIsSearchingSrc);
      } else {
        setSrcOpts([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [srcQuery, handleLocationSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = dstQuery.trim();
      if (q.length >= 3) {
        handleLocationSearch(q, setDstOpts, setIsSearchingDst);
      } else {
        setDstOpts([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [dstQuery, handleLocationSearch]);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('create_ride_draft');
      if (raw) {
        const d = JSON.parse(raw);
        setForm((f)=>({ ...f, ...d.form }));
        setSrcQuery(d.srcQuery || '');
        setDstQuery(d.dstQuery || '');
        setSrcCoord(d.srcCoord || null);
        setDstCoord(d.dstCoord || null);
      }
    } catch {}
  }, []);

  // Persist draft on change
  useEffect(() => {
    const draft = { form, srcQuery, dstQuery, srcCoord, dstCoord, vehicle, subtype, amenities, plate, photo };
    localStorage.setItem('create_ride_draft', JSON.stringify(draft));
  }, [form, srcQuery, dstQuery, srcCoord, dstCoord, vehicle, subtype, amenities, plate, photo]);

  // Compute suggested fare from distance
  useEffect(() => {
    if (!srcCoord || !dstCoord) { setSuggestedFare(null); return; }
    const R = 6371;
    const toRad = (x)=> x * Math.PI/180;
    const [lat1, lon1] = [srcCoord[0], srcCoord[1]];
    const [lat2, lon2] = [dstCoord[0], dstCoord[1]];
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const km = R * c;
    const rate = vehicle === 'bike' ? 5 : vehicle === 'suv' ? 12 : 8;
    const amenityAdder = (amenities.ac ? 1 : 0) + (amenities.luggage ? 0.5 : 0);
    const suggested = Math.max(50, Math.round((km * rate + amenityAdder * 10)));
    setSuggestedFare({ km: km.toFixed(1), value: suggested });
  }, [srcCoord, dstCoord, vehicle, amenities]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setNotice('');
    setLoading(true);
    try {
      let sourceLoc = srcCoord ? { type: 'Point', coordinates: [srcCoord[1], srcCoord[0]] } : null;
      let destLoc = dstCoord ? { type: 'Point', coordinates: [dstCoord[1], dstCoord[0]] } : null;
      if (!sourceLoc || !destLoc) {
        if (!navigator.geolocation) throw new Error('Provide source/destination or enable location');
        await new Promise((resolve) => navigator.geolocation.getCurrentPosition((pos) => {
          sourceLoc = sourceLoc || { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] };
          destLoc = destLoc || sourceLoc;
          resolve();
        }, () => resolve()));
      }
      const payload = {
        ...form,
        source: form.source || srcQuery,
        destination: form.destination || dstQuery,
        availableSeats: Number(form.availableSeats || 3),
        fare: Number(form.fare || 100),
        time: form.time ? new Date(form.time) : new Date(Date.now() + 60*60*1000),
        vehicle,
        subtype,
        plate,
        vehiclePhoto: photo,
        amenities,
        sourceLoc,
        destLoc,
      };
      const { data } = await api.post('/api/rides/create', payload);
      setMsg(`Ride created: ${data.ride?.source} → ${data.ride?.destination}`);
      localStorage.removeItem('create_ride_draft');
    } catch (e) {
      setMsg('');
      setNotice(e?.response?.data?.error || e?.message || 'Failed to create ride. Ensure you are logged in as driver.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <LoadingOverlay show={loading} text="Creating ride..." />
      
      {/* Professional Header */}
      <div className="rounded-2xl p-6 border" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <Car size={28} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>Create a Ride</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Share your journey and earn money</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Shield size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>Secure</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Verified riders</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <Zap size={16} style={{ color: '#10b981' }} />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>Fast</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Quick booking</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      <div className="mb-4">
        {msg && <Alert type="success">{msg}</Alert>}
        {notice && <Alert type="error">{notice}</Alert>}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[50vh] lg:h-[70vh] rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
            {srcCoord && <Marker position={[srcCoord[0], srcCoord[1]]} />}
            {dstCoord && <Marker position={[dstCoord[0], dstCoord[1]]} />}
            {srcCoord && dstCoord && (
              <Polyline positions={[ [srcCoord[0], srcCoord[1]], [dstCoord[0], dstCoord[1]] ]} pathOptions={{ color: '#3b82f6', weight: 4 }} />
            )}
          </MapContainer>
        </div>

        <div className="space-y-4">
          <Card className="p-6" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Navigation size={20} style={{ color: 'var(--brand)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Ride Details</h2>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
            <div style={{ position: 'relative' }}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} style={{ color: 'var(--brand)' }} />
                <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Source</div>
              </div>
              <Input 
                value={srcQuery} 
                onChange={(e)=>{ setSrcQuery(e.target.value); setFocusField('src'); }} 
                placeholder="Enter pickup location"
                className={isSearchingSrc ? 'opacity-50' : ''}
              />
              {geoError && (
                <div className="absolute z-20 mt-1 w-full rounded-md border shadow p-2 text-sm" style={{ background: 'var(--surface)', borderColor: 'rgba(220, 38, 38, 0.2)', color: '#dc2626' }}>
                  {geoError}
                </div>
              )}
              {focusField==='src' && srcOpts.length>0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
                  {srcOpts.map((opt)=> (
                    <button key={opt.place_id} className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" onClick={()=>{ setSrcQuery(opt.display_name); setSrcCoord([Number(opt.lat), Number(opt.lon)]); setSrcOpts([]); setFocusField(null); set('source', opt.display_name); }} style={{ color: 'var(--text)' }}>
                      {opt.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} style={{ color: '#ef4444' }} />
                <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Destination</div>
              </div>
              <Input 
                value={dstQuery} 
                onChange={(e)=>{ setDstQuery(e.target.value); setFocusField('dst'); }} 
                placeholder="Enter drop location"
                className={isSearchingDst ? 'opacity-50' : ''}
              />
              {geoError && (
                <div className="absolute z-20 mt-1 w-full rounded-md border shadow p-2 text-sm" style={{ background: 'var(--surface)', borderColor: 'rgba(220, 38, 38, 0.2)', color: '#dc2626' }}>
                  {geoError}
                </div>
              )}
              {focusField==='dst' && dstOpts.length>0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border shadow" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
                  {dstOpts.map((opt)=> (
                    <button key={opt.place_id} className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" onClick={()=>{ setDstQuery(opt.display_name); setDstCoord([Number(opt.lat), Number(opt.lon)]); setDstOpts([]); setFocusField(null); set('destination', opt.display_name); }} style={{ color: 'var(--text)' }}>
                      {opt.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} style={{ color: 'var(--brand)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Seats</div>
                </div>
                <Input type="number" min={1} max={6} placeholder="e.g. 3" value={form.availableSeats} onChange={(e)=>set('availableSeats', e.target.value)} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} style={{ color: 'var(--brand)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Fare (₹)</div>
                </div>
                <Input type="number" min={0} placeholder="e.g. 150" value={form.fare} onChange={(e)=>set('fare', e.target.value)} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} style={{ color: 'var(--brand)' }} />
                <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Pickup time</div>
              </div>
              <Input type="datetime-local" value={form.time} onChange={(e)=>set('time', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Car size={16} style={{ color: 'var(--brand)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Vehicle</div>
                </div>
                <Select value={vehicle} onChange={(e)=>setVehicle(e.target.value)}>
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="bike">Bike</option>
                </Select>
              </div>
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Subtype</div>
                <Select value={subtype} onChange={(e)=>setSubtype(e.target.value)}>
                  {(vehicle === 'car') && (<>
                    <option value="">Select subtype</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="sedan">Sedan</option>
                    <option value="mpv">MPV</option>
                  </>)}
                  {(vehicle === 'suv') && (<>
                    <option value="">Select subtype</option>
                    <option value="compact">Compact SUV</option>
                    <option value="full">Full-size SUV</option>
                  </>)}
                  {(vehicle === 'bike') && (<>
                    <option value="">Select subtype</option>
                    <option value="scooter">Scooter</option>
                    <option value="standard">Standard</option>
                  </>)}
                </Select>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Amenities</div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={amenities.ac} onChange={(e)=>setAmenities(a=>({...a, ac: e.target.checked}))} /> AC</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={amenities.music} onChange={(e)=>setAmenities(a=>({...a, music: e.target.checked}))} /> Music</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={amenities.luggage} onChange={(e)=>setAmenities(a=>({...a, luggage: e.target.checked}))} /> Luggage</label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Vehicle number plate (private)</div>
                <Input value={plate} onChange={(e)=>setPlate(e.target.value)} placeholder="e.g. DL 01 AB 1234" />
              </div>
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Vehicle photo (private)</div>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={async (e)=>{
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => setPhoto(reader.result?.toString() || '');
                    reader.readAsDataURL(file);
                  }}
                />
                <div className="flex items-center gap-2">
                  <button type="button" className="px-3 py-1.5 text-sm rounded border" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.1)' }} onClick={()=>fileInputRef.current?.click()}>Choose file</button>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{photoName || 'No file chosen'}</span>
                </div>
                {photo && (
                  <img src={photo} alt="vehicle" className="mt-2 h-16 w-24 object-cover rounded-md border" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />
                )}
              </div>
            </div>
            {suggestedFare && (
              <div className="text-sm flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <div className="flex items-center gap-2">
                  <Zap size={16} style={{ color: '#3b82f6' }} />
                  <span style={{ color: 'var(--text)' }}>Approx distance: {suggestedFare.km} km • Suggested fare: ₹{suggestedFare.value}</span>
                </div>
                <button type="button" className="px-3 py-1.5 text-sm rounded-lg font-medium" style={{ background: 'var(--brand)', color: '#111' }} onClick={()=>set('fare', suggestedFare.value)}>
                  Use suggestion
                </button>
              </div>
            )}
            <Button className="w-full py-3 rounded-xl font-semibold" type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: '#111' }}>Create Ride</Button>
          </form>
        </Card>
        </div>
      </div>
    </div>
  );
}
