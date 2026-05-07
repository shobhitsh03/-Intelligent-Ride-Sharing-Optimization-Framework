import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../lib/api';
import { Card, Button, Alert } from '../components/UI.jsx';
import LiveRideTracking from '../components/LiveRideTracking.jsx';
import { io } from 'socket.io-client';
import {
  Car, MapPin, Calendar, Users, CreditCard,
  CheckCircle, Clock, XCircle, ArrowRight,
  Zap, Shield, ChevronRight, Navigation
} from 'lucide-react';

// Helper function to check if user is a rider and show alert
const handleCreateRideClick = (e, navigate) => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  
  if (roles.includes('rider') && !roles.includes('driver')) {
    alert('You are logged in as a Rider. Only Drivers can create rides. Please register as a Driver to create rides.');
    return false;
  }
  
  navigate('/create-ride');
  return true;
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trackingRideId, setTrackingRideId] = useState(null);
  const socketRef = useRef(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchMyRides();
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Socket.IO: Join ride rooms to receive booking notifications
  useEffect(() => {
    if (!token || rides.length === 0) return;

    const url = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
    const socket = io(url, { withCredentials: true });
    socketRef.current = socket;

    // Join all ride rooms
    rides.forEach(ride => {
      if (ride._id) {
        socket.emit('join:ride', { rideId: ride._id });
      }
    });

    // Listen for new bookings
    socket.on('booking:new', ({ bookingId, rideId, seats, riderName }) => {
      toast.success(`🎉 New booking: ${seats} seat(s) booked!`);
      // Refresh rides to update seat counts
      fetchMyRides();
    });

    return () => {
      // Leave all ride rooms
      rides.forEach(ride => {
        if (ride._id) {
          socket.emit('leave:ride', { rideId: ride._id });
        }
      });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, rides]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'open': return <Clock size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      default: return 'Cancelled';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Driver Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Manage your rides and track bookings</p>
        </div>
        <a 
          onClick={(e) => handleCreateRideClick(e, navigate)}
          href="/create-ride" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ background: 'var(--brand)', color: '#111' }}
        >
          <Car size={20} />
          Create New Ride
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Car size={24} style={{ color: '#3B82F6' }} />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
              Total
            </span>
          </div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{rides.length}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Total Rides</div>
        </div>

        <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <CheckCircle size={24} style={{ color: '#10B981' }} />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              Active
            </span>
          </div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            {rides.filter(r => r.status === 'active').length}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Active Rides</div>
        </div>

        <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <Users size={24} style={{ color: '#F59E0B' }} />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              Seats
            </span>
          </div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            {rides.reduce((acc, r) => acc + r.availableSeats, 0)}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Available Seats</div>
        </div>
      </div>

      {/* Rides List */}
      {rides.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <Car size={40} style={{ color: '#3B82F6' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No Rides Yet</h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Start earning by creating your first ride. Share your journey and help others travel together.
          </p>
          <a 
            onClick={(e) => handleCreateRideClick(e, navigate)}
            href="/create-ride"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ background: 'var(--brand)', color: '#111' }}
          >
            <Car size={20} />
            Create New Ride
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {rides.map((ride) => (
            <div key={ride._id} className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                {/* Ride Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <MapPin size={24} style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                        {ride.source} → {ride.destination}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ride.status)}`}>
                          {getStatusIcon(ride.status)}
                          {getStatusLabel(ride.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} style={{ color: 'var(--muted)' }} />
                      <div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Date</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {ride.time ? formatDate(ride.time) : 'Not scheduled'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: 'var(--muted)' }} />
                      <div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Seats</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {ride.availableSeats} available
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} style={{ color: 'var(--muted)' }} />
                      <div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Fare</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          ₹{ride.fare}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car size={16} style={{ color: 'var(--muted)' }} />
                      <div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Vehicle</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {ride.vehicle} ({ride.subtype})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-3">
                  <button
                    onClick={() => setTrackingRideId(trackingRideId === ride._id ? null : ride._id)}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      trackingRideId === ride._id 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <Navigation size={16} />
                    {trackingRideId === ride._id ? 'Stop Sharing' : 'Share Location'}
                  </button>
                  
                  <button
                    onClick={() => navigate(`/ride-bookings/${ride._id}`)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text)', border: '1px solid rgba(0,0,0,0.15)' }}
                  >
                    <Users size={16} />
                    View Bookings
                  </button>
                </div>
              </div>
              
              {/* Live Tracking Component */}
              {trackingRideId === ride._id && user && (
                <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <LiveRideTracking 
                    rideId={ride._id}
                    isDriver={true}
                    userId={user.id}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tips Section */}
      <div className="rounded-2xl p-6" style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Shield size={20} style={{ color: '#10B981' }} />
          </div>
          <div className="font-semibold" style={{ color: 'var(--text)' }}>Driver Tips</div>
        </div>
        <ul className="grid md:grid-cols-3 gap-4 text-sm" style={{ color: 'var(--muted)' }}>
          <li className="flex items-start gap-2">
            <Zap size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
            <span>Keep your vehicle clean and comfortable for passengers</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
            <span>Always verify passenger identity before starting the ride</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
            <span>Be punctual and maintain good communication with riders</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
