import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../lib/api';
import { Card, Button, Alert } from '../components/UI.jsx';
import LiveRideTracking from '../components/LiveRideTracking.jsx';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trackingRideId, setTrackingRideId] = useState(null);

  useEffect(() => {
    fetchMyRides();
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchMyRides = async () => {
    try {
      const { data } = await api.get('/api/rides/mine');
      setRides(data.rides || []);
    } catch (error) {
      toast.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
        Driver Dashboard
      </h1>
      
      {rides.length === 0 ? (
        <Card className="p-6 text-center">
          <p style={{ color: 'var(--muted)' }}>You haven't created any rides yet.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/create-ride')}
          >
            Create a Ride
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <Card key={ride._id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                    {ride.source} → {ride.destination}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Ride Date: {ride.time ? formatDate(ride.time) : 'Not scheduled'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Created on: {formatDate(ride.createdAt)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Available Seats: {ride.availableSeats}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Fare: ${ride.fare}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    ride.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : ride.status === 'completed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ride.status === 'open' ? 'Open' : ride.status === 'active' ? 'Active' : ride.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Vehicle: {ride.vehicle} ({ride.subtype})
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {/* Start/Stop Location Sharing - Available for all rides */}
                  <Button 
                    onClick={() => setTrackingRideId(trackingRideId === ride._id ? null : ride._id)}
                    className="px-3 py-1 text-sm"
                    variant={trackingRideId === ride._id ? "secondary" : "primary"}
                  >
                    {trackingRideId === ride._id ? 'Stop Sharing' : 'Share Location'}
                  </Button>
                  
                  {/* View Bookings */}
                  <Button 
                    onClick={() => navigate(`/ride-bookings/${ride._id}`)}
                    className="px-3 py-1 text-sm"
                    variant="secondary"
                  >
                    View Bookings
                  </Button>
                </div>
              </div>
              
              {/* Live Tracking Component */}
              {trackingRideId === ride._id && user && (
                <div className="mt-4">
                  <LiveRideTracking 
                    rideId={ride._id}
                    isDriver={true}
                    userId={user.id}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
