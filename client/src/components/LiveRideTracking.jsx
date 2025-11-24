import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRideTracking, useGeolocation } from '../hooks/useRideTracking';
import { Card, Alert, Button } from '../components/UI.jsx';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LiveRideTracking({ rideId, isDriver = false, userId, bookingStatus = 'pending', bookingAmount = 0 }) {
  const { location, isConnected, error, sendLocation } = useRideTracking(rideId, userId);
  const { position, error: geoError, getCurrentPosition, watchPosition } = useGeolocation();
  const [watchId, setWatchId] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  // Debug logs
  console.log('LiveRideTracking:', { 
    rideId, 
    isDriver, 
    userId, 
    location, 
    position, 
    isConnected, 
    error, 
    geoError 
  });

  useEffect(() => {
    if (isDriver && position) {
      // Start watching position for drivers
      const id = watchPosition();
      setWatchId(id);
      console.log('Started watching position with ID:', id);
    }
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isDriver, position]);

  useEffect(() => {
    if (isDriver && position) {
      // Send location updates when driver position changes
      sendLocation(position);
      
      // Add to route history
      setRoutePoints(prev => [...prev, [position.lat, position.lng]]);
    }
  }, [position, isDriver, sendLocation]);

  const handleStartSharing = () => {
    console.log('Requesting location...');
    getCurrentPosition();
  };

  const handleManualLocation = () => {
    console.log('Manual location request...');
    getCurrentPosition();
  };

  if (!rideId) {
    return (
      <Card className="p-6">
        <Alert type="error">No ride ID provided</Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Live Ride Tracking
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {(error || geoError) && (
          <Alert type="error" className="mb-4">
            {error || geoError}
          </Alert>
        )}

        {/* Payment Reminder for Unpaid Bookings */}
        {!isDriver && bookingStatus === 'pending' && bookingAmount > 0 && (
          <Alert type="warning" className="mb-4">
            <div className="flex justify-between items-center">
              <span>
                Please complete your payment of ${(bookingAmount / 100).toFixed(2)} to ensure uninterrupted tracking.
              </span>
              <Button className="ml-4 px-3 py-1 text-sm">
                Pay Now
              </Button>
            </div>
          </Alert>
        )}

        {/* Free Booking Notice */}
        {!isDriver && bookingStatus === 'pending' && bookingAmount === 0 && (
          <Alert type="success" className="mb-4">
            This is a free ride - No payment required!
          </Alert>
        )}

        {isDriver && !position && (
          <div className="text-center py-4">
            <Button onClick={handleStartSharing}>
              Start Location Sharing
            </Button>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
              Share your location to provide live updates to riders
            </p>
            {geoError && (
              <p className="text-sm mt-2 text-red-600">
                Location error: {geoError}
              </p>
            )}
          </div>
        )}

        {isDriver && position && (
          <div className="text-center py-2">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Location sharing active ✓
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Accuracy: ±{position.accuracy}m
            </p>
          </div>
        )}

        {!isDriver && !position && (
          <div className="text-center py-4">
            <Button onClick={handleManualLocation} className="mb-2">
              Get My Location
            </Button>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Click to show your location on the map
            </p>
            {geoError && (
              <p className="text-sm mt-2 text-red-600">
                Location error: {geoError}
              </p>
            )}
          </div>
        )}

        {!isDriver && position && (
          <div className="text-center py-2">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Your location detected ✓
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Accuracy: ±{position.accuracy}m
            </p>
          </div>
        )}

        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={
              location ? [location.lat, location.lng] :
              position ? [position.lat, position.lng] :
              [28.6139, 77.2090]
            }
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Driver's current location */}
            {location && (
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <div className="text-sm">
                    <strong>Driver Location</strong><br/>
                    Last updated: {new Date(location.timestamp).toLocaleTimeString()}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* User's current location (for driver) */}
            {isDriver && position && (
              <Marker position={[position.lat, position.lng]}>
                <Popup>
                  <div className="text-sm">
                    <strong>Your Location</strong><br/>
                    Accuracy: ±{position.accuracy}m
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route path */}
            {routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                color="blue"
                weight={3}
                opacity={0.7}
              />
            )}
          </MapContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: 'var(--muted)' }}>Status:</span>
            <span className="ml-2 font-medium">
              {isDriver ? 'Driver' : 'Rider'}
            </span>
          </div>
          {location && (
            <div>
              <span style={{ color: 'var(--muted)' }}>Driver Location:</span>
              <span className="ml-2 font-medium">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
