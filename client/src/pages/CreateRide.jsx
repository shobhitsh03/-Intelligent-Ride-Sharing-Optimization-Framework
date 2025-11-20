import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { Card, Button, ButtonSecondary, Input, Select, Alert } from '../components/UI.jsx';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';

export default function CreateRide() {
  const [form, setForm] = useState({ source: '', destination: '', availableSeats: '', fare: '', time: '' });
  const [msg, setMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [srcQuery, setSrcQuery] = useState('');
  const [dstQuery, setDstQuery] = useState('');
  const [srcCoord, setSrcCoord] = useState(null);
  const [dstCoord, setDstCoord] = useState(null);
  const [srcOpts, setSrcOpts] = useState([]);
  const [dstOpts, setDstOpts] = useState([]);
  const [focusField, setFocusField] = useState(null);
  const [vehicle, setVehicle] = useState('car');
  const [subtype, setSubtype] = useState('');
  const [amenities, setAmenities] = useState({ ac: true, music: false, luggage: false });
  const [center, setCenter] = useState([28.6139, 77.2090]);
  const [suggestedFare, setSuggestedFare] = useState(null);
  const [plate, setPlate] = useState('');
  const [photo, setPhoto] = useState(''); // data URL, kept local
  const [photoName, setPhotoName] = useState('');
  const fileInputRef = useRef(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

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
        setVehicle(d.vehicle || 'car');
        setSubtype(d.subtype || '');
        setAmenities(d.amenities || { ac: true, music: false, luggage: false });
        setPlate(d.plate || '');
        setPhoto(d.photo || '');
      }
    } catch {}
  }, []);

  // Persist draft on change
  useEffect(() => {
    const draft = { form, srcQuery, dstQuery, srcCoord, dstCoord, vehicle, subtype, amenities, plate, photo };
    localStorage.setItem('create_ride_draft', JSON.stringify(draft));
  }, [form, srcQuery, dstQuery, srcCoord, dstCoord, vehicle, subtype, amenities, plate, photo]);

  useEffect(() => {
    const q = srcQuery.trim();
    if (q.length < 3) { setSrcOpts([]); return; }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setSrcOpts((data || []).slice(0, 5));
      } catch {}
    })();
    return () => ctrl.abort();
  }, [srcQuery]);

  useEffect(() => {
    const q = dstQuery.trim();
    if (q.length < 3) { setDstOpts([]); return; }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setDstOpts((data || []).slice(0, 5));
      } catch {}
    })();
    return () => ctrl.abort();
  }, [dstQuery]);

  // Compute suggested fare from distance (haversine) with base rate
  useEffect(() => {
    if (!srcCoord || !dstCoord) { setSuggestedFare(null); return; }
    const R = 6371; // km
    const toRad = (x)=> x * Math.PI/180;
    const [lat1, lon1] = [srcCoord[0], srcCoord[1]];
    const [lat2, lon2] = [dstCoord[0], dstCoord[1]];
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const km = R * c;
    // Base rate per km varies by vehicle
    const rate = vehicle === 'bike' ? 5 : vehicle === 'suv' ? 12 : 8; // ₹/km
    const amenityAdder = (amenities.ac ? 1 : 0) + (amenities.luggage ? 0.5 : 0);
    const suggested = Math.max(50, Math.round((km * rate + amenityAdder * 10)));
    setSuggestedFare({ km: km.toFixed(1), value: suggested });
  }, [srcCoord, dstCoord, vehicle, amenities]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setNotice('');
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
        vehiclePhoto: photo, // kept private client-side; sent only for demo
        amenities,
        sourceLoc,
        destLoc,
      };
      const { data } = await api.post('/api/rides/create', payload);
      setMsg(`Ride created: ${data.ride?.source} → ${data.ride?.destination}`);
      // Clear draft on success
      localStorage.removeItem('create_ride_draft');
    } catch (e) {
      setMsg('');
      setNotice(e?.response?.data?.error || e?.message || 'Failed to create ride. Ensure you are logged in as driver.');
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-[40vh] lg:h-[60vh] rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
          {srcCoord && <Marker position={[srcCoord[0], srcCoord[1]]} />}
          {dstCoord && <Marker position={[dstCoord[0], dstCoord[1]]} />}
          {srcCoord && dstCoord && (
            <Polyline positions={[ [srcCoord[0], srcCoord[1]], [dstCoord[0], dstCoord[1]] ]} pathOptions={{ color: '#FFC043', weight: 3 }} />
          )}
        </MapContainer>
      </div>

      <div className="space-y-3">
        <Card className="p-6 space-y-3">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Create Ride</h2>
          {msg && <Alert type="success">{msg}</Alert>}
          {notice && <Alert type="error">{notice}</Alert>}
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Source</div>
              <div className="relative">
                <Input value={srcQuery} onChange={(e)=>{ setSrcQuery(e.target.value); setFocusField('src'); }} placeholder="Enter pickup" />
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
            </div>

            <div className="col-span-2">
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Destination</div>
              <div className="relative">
                <Input value={dstQuery} onChange={(e)=>{ setDstQuery(e.target.value); setFocusField('dst'); }} placeholder="Enter drop" />
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
            </div>

            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Seats</div>
              <Input type="number" min={1} max={6} placeholder="e.g. 3" value={form.availableSeats} onChange={(e)=>set('availableSeats', e.target.value)} />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Fare (₹)</div>
              <Input type="number" min={0} placeholder="e.g. 150" value={form.fare} onChange={(e)=>set('fare', e.target.value)} />
            </div>

            <div className="col-span-2">
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Pickup time</div>
              <Input type="datetime-local" value={form.time} onChange={(e)=>set('time', e.target.value)} />
            </div>

            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Vehicle</div>
              <Select value={vehicle} onChange={(e)=>setVehicle(e.target.value)}>
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="bike">Bike</option>
              </Select>
            </div>

            {/* Conditional subtype based on vehicle */}
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Subtype</div>
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

            <div className="col-span-2 flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={amenities.ac} onChange={(e)=>setAmenities(a=>({...a, ac: e.target.checked}))} /> AC</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={amenities.music} onChange={(e)=>setAmenities(a=>({...a, music: e.target.checked}))} /> Music</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={amenities.luggage} onChange={(e)=>setAmenities(a=>({...a, luggage: e.target.checked}))} /> Luggage</label>
            </div>

            {/* Private details */}
            <div className="col-span-2 grid grid-cols-2 gap-3 items-end">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Vehicle number plate (private)</div>
                <Input value={plate} onChange={(e)=>setPlate(e.target.value)} placeholder="e.g. DL 01 AB 1234" />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Vehicle photo (private)</div>
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
                  <ButtonSecondary type="button" onClick={()=>fileInputRef.current?.click()}>Choose file</ButtonSecondary>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{photoName || 'No file chosen'}</span>
                </div>
                {photo && (
                  <img src={photo} alt="vehicle" className="mt-2 h-16 w-24 object-cover rounded-md border" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />
                )}
              </div>
            </div>

            {/* Fare suggestion */}
            {suggestedFare && (
              <div className="col-span-2 text-sm flex items-center justify-between rounded-md px-3 py-2" style={{ background: 'color-mix(in oklab, var(--primary) 6%, transparent)', color: 'var(--text)' }}>
                <div>Approx distance: {suggestedFare.km} km • Suggested fare: ₹{suggestedFare.value}</div>
                <ButtonSecondary type="button" onClick={()=>set('fare', suggestedFare.value)}>
                  Use suggestion
                </ButtonSecondary>
              </div>
            )}

            <Button className="col-span-2 w-full" type="submit">Create</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
