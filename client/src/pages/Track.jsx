import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { Card, Input, ButtonSecondary, Badge } from '../components/UI.jsx';

export default function Track() {
  const [coords, setCoords] = useState(null);
  const [history, setHistory] = useState([]);
  const [rideId, setRideId] = useState('demo-ride');
  const socketRef = useRef(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const socket = io(url + '/api/track/live');
    socketRef.current = socket;
    socket.on('connect', () => {
      if (rideId) socket.emit('join', { rideId });
    });
    socket.on('location', (data) => {
      if (data?.coords) {
        setCoords(data.coords);
        setHistory((h) => [...h, [data.coords.lat, data.coords.lng]]);
      }
    });
    return () => socket.close();
  }, [rideId]);

  // Demo: emit driver location from browser every 3s if allowed and checked
  useEffect(() => {
    const socket = socketRef.current;
    let timer;
    if (socket && navigator.geolocation) {
      timer = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          const payload = { rideId, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
          socket.emit('location', payload);
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [rideId]);

  const center = coords ? [coords.lat, coords.lng] : [28.6139, 77.2090];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Live Tracking</h2>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[40vh] lg:h-[520px] rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {coords && <Marker position={[coords.lat, coords.lng]} />}
            {history.length > 1 && <Polyline positions={history} color="#2563EB" />}
          </MapContainer>
        </div>

        <div className="lg:col-span-1 space-y-3">
          <Card className="p-4 space-y-3">
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Join a ride room to receive live location updates.</div>
            <div className="flex items-center gap-2">
              <Input value={rideId} onChange={(e)=>setRideId(e.target.value)} placeholder="Ride ID" />
              <ButtonSecondary onClick={()=>setHistory([])}>Clear path</ButtonSecondary>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
              Status: {coords ? <Badge tone="success">Live</Badge> : <Badge>Idle</Badge>}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Last location</div>
            {coords ? (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Lat {coords.lat.toFixed(5)}, Lng {coords.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>Waiting for location updates…</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
