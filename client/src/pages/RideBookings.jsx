import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../lib/api';
import { Card, Button, Alert } from '../components/UI.jsx';

export default function RideBookings() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);

  useEffect(() => {
    fetchRideBookings();
  }, [rideId]);

  const fetchRideBookings = async () => {
    try {
      // Get ride details
      const rideRes = await api.get(`/api/rides/${rideId}`);
      setRide(rideRes.data.ride);
      
      // Get bookings for this ride
      const bookingsRes = await api.get(`/api/booking/ride/${rideId}`);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch ride bookings');
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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/driver-dashboard')}
          variant="secondary"
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Ride Bookings
        </h1>
        {ride && (
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {ride.source} → {ride.destination} | {ride.time ? formatDate(ride.time) : 'Not scheduled'}
          </p>
        )}
      </div>
      
      {bookings.length === 0 ? (
        <Card className="p-6 text-center">
          <p style={{ color: 'var(--muted)' }}>No bookings yet for this ride.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking._id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                    {booking.rider?.name || 'Unknown Rider'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Email: {booking.rider?.email || 'N/A'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Seats: {booking.seats}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Booked on: {formatDate(booking.createdAt)}
                  </p>
                  {booking.amount > 0 && (
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Amount: ${(booking.amount / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status === 'paid' ? 'Paid' : 'Payment Pending'}
                  </span>
                  {booking.paymentProvider && (
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {booking.paymentProvider === 'pending' ? 'Pay Later' : booking.paymentProvider}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action buttons for driver */}
              <div className="mt-4 flex space-x-2">
                <Button 
                  className="px-3 py-1 text-sm"
                  variant="secondary"
                  onClick={() => navigate(`/live-tracking/${booking.ride}`)}
                >
                  Share Location
                </Button>
                {booking.rider?.email && (
                  <Button 
                    className="px-3 py-1 text-sm"
                    variant="secondary"
                    onClick={() => window.open(`mailto:${booking.rider.email}`, '_blank')}
                  >
                    Contact Rider
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
